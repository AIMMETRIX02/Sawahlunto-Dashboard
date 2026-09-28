import { NextRequest, NextResponse } from 'next/server'
import https from 'node:https'
import http from 'node:http'
import { Readable } from 'node:stream'

export const dynamic = 'force-dynamic'

const DEFAULT_R2_URL =
  'https://pub-8b89ed0687f548dab4ebe7c8a311ed49.r2.dev/Manual%20Book%20Non%20Electrical%20UG%20Blast%20BDTBT.pdf'
const DEFAULT_FILENAME = 'Manual Book Non Electrical UG Blast BDTBT.pdf'

// Resolve hostname using secure DNS-over-HTTPS (DoH) to prevent Indonesian ISP blocks on r2.dev
async function resolveHostWithDoH(hostname: string): Promise<string> {
  try {
    const res = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: { accept: 'application/dns-json' },
      cache: 'force-cache',
    })
    if (res.ok) {
      const data = await res.json()
      const answer = data.Answer?.find((a: any) => a.type === 1)
      if (answer && answer.data) {
        return answer.data
      }
    }
  } catch (err) {
    console.warn('DoH resolution error, falling back to default hostname:', err)
  }
  return hostname
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let rawUrl = searchParams.get('url') || DEFAULT_R2_URL
    try {
      rawUrl = decodeURI(rawUrl)
    } catch {}
    const filename = searchParams.get('filename') || DEFAULT_FILENAME

    const parsedUrl = new URL(rawUrl)
    const resolvedIp = await resolveHostWithDoH(parsedUrl.hostname)

    const isHttps = parsedUrl.protocol === 'https:'
    const requestModule = isHttps ? https : http

    return new Promise<Response>((resolve) => {
      const options = {
        host: resolvedIp,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          Host: parsedUrl.hostname,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
        servername: parsedUrl.hostname, // Required for TLS SNI handshake
      }

      const clientReq = requestModule.request(options, (clientRes) => {
        // Handle HTTP redirects
        if (
          clientRes.statusCode &&
          (clientRes.statusCode === 301 || clientRes.statusCode === 302 || clientRes.statusCode === 307) &&
          clientRes.headers.location
        ) {
          resolve(NextResponse.redirect(clientRes.headers.location))
          return
        }

        if (clientRes.statusCode && clientRes.statusCode >= 400) {
          resolve(
            NextResponse.json(
              { error: `Storage server returned HTTP ${clientRes.statusCode}` },
              { status: clientRes.statusCode }
            )
          )
          return
        }

        const headers = new Headers()
        headers.set('Content-Type', clientRes.headers['content-type'] || 'application/pdf')
        // Content-Disposition: attachment forces all browsers to directly download the file
        const cleanName = filename.replace(/["\r\n]/g, '')
        headers.set(
          'Content-Disposition',
          `attachment; filename="${cleanName}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`
        )

        const contentLength = clientRes.headers['content-length']
        if (contentLength) {
          headers.set('Content-Length', contentLength)
        }

        // Stream binary data directly to client browser
        const webStream = Readable.toWeb(clientRes) as ReadableStream

        resolve(
          new Response(webStream, {
            status: 200,
            headers,
          })
        )
      })

      clientReq.on('error', (err) => {
        resolve(
          NextResponse.json(
            { error: `Gagal mengunduh berkas: ${err.message}` },
            { status: 500 }
          )
        )
      })

      clientReq.setTimeout(30000, () => {
        clientReq.destroy(new Error('Koneksi unduhan timeout'))
      })

      clientReq.end()
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan pada sistem unduh' },
      { status: 500 }
    )
  }
}
