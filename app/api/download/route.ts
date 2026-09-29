import { NextRequest, NextResponse } from 'next/server'
import https from 'node:https'
import http from 'node:http'
import { Readable } from 'node:stream'

export const dynamic = 'force-dynamic'

const DEFAULT_R2_URL =
  'https://pub-8b89ed0687f548dab4ebe7c8a311ed49.r2.dev/Manual%20Book%20Non%20Electrical%20UG%20Blast%20BDTBT.pdf'
const DEFAULT_FILENAME = 'Manual Book Non Electrical UG Blast BDTBT.pdf'

// Resolve hostname using secure DNS-over-HTTPS (DoH) to bypass Indonesian ISP blocks on *.r2.dev
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

function getDetailedErrorMessage(statusCode: number, filename: string): string {
  if (statusCode === 404) {
    return `Berkas "${filename}" tidak ditemukan di Cloudflare R2 (HTTP 404). Pastikan nama berkas sesuai dan fitur Public Access (r2.dev subdomain atau Custom Domain) sudah diaktifkan di dashboard Cloudflare R2.`
  }
  if (statusCode === 403 || statusCode === 401) {
    return `Akses ke berkas Cloudflare R2 ditolak (HTTP ${statusCode}). Jangan gunakan URL S3 endpoint internal (cloudflarestorage.com), gunakan Public R2 URL (pub-xxx.r2.dev) atau Custom Domain yang sudah di-allow.`
  }
  return `Server penyimpanan Cloudflare R2 mengembalikan kode HTTP ${statusCode}.`
}

async function handleDownloadRequest(req: NextRequest, isHeadOnly: boolean = false): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url)
    let rawUrl = searchParams.get('url') || DEFAULT_R2_URL
    try {
      rawUrl = decodeURI(rawUrl)
    } catch {}
    const filename = searchParams.get('filename') || DEFAULT_FILENAME

    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL berkas tidak valid. Harap gunakan URL http:// atau https://.' },
        { status: 400 }
      )
    }

    const parsedUrl = new URL(rawUrl)
    const isHttps = parsedUrl.protocol === 'https:'

    // Try standard fetch first (fastest on Cloudflare Workers / unblocked envs) with short timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)
      const directRes = await fetch(rawUrl, {
        method: isHeadOnly ? 'HEAD' : 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (directRes.status >= 400) {
        return NextResponse.json(
          { error: getDetailedErrorMessage(directRes.status, filename), statusCode: directRes.status },
          { status: directRes.status }
        )
      }

      const headers = new Headers()
      headers.set('Content-Type', directRes.headers.get('content-type') || 'application/pdf')
      const cleanName = filename.replace(/["\r\n]/g, '')
      headers.set(
        'Content-Disposition',
        `attachment; filename="${cleanName}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`
      )
      const cl = directRes.headers.get('content-length')
      if (cl) headers.set('Content-Length', cl)

      if (isHeadOnly) {
        return new Response(null, { status: 200, headers })
      }

      return new Response(directRes.body, { status: 200, headers })
    } catch {
      // Direct fetch timed out or failed (e.g. Indonesian ISP DNS blocking *.r2.dev). Fall back to DoH proxy.
    }

    // Fallback: Node.js https with DoH resolved IP
    const resolvedIp = await resolveHostWithDoH(parsedUrl.hostname)
    const requestModule = isHttps ? https : http

    return new Promise<Response>((resolve) => {
      const options = {
        host: resolvedIp,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: isHeadOnly ? 'HEAD' : 'GET',
        headers: {
          Host: parsedUrl.hostname,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
        },
        servername: parsedUrl.hostname,
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
              {
                error: getDetailedErrorMessage(clientRes.statusCode, filename),
                statusCode: clientRes.statusCode,
              },
              { status: clientRes.statusCode }
            )
          )
          return
        }

        const headers = new Headers()
        headers.set('Content-Type', clientRes.headers['content-type'] || 'application/pdf')
        const cleanName = filename.replace(/["\r\n]/g, '')
        headers.set(
          'Content-Disposition',
          `attachment; filename="${cleanName}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`
        )

        const contentLength = clientRes.headers['content-length']
        if (contentLength) {
          headers.set('Content-Length', contentLength)
        }

        if (isHeadOnly) {
          resolve(new Response(null, { status: 200, headers }))
          return
        }

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
            { error: `Gagal mengunduh berkas dari Cloudflare R2: ${err.message}` },
            { status: 500 }
          )
        )
      })

      clientReq.setTimeout(30000, () => {
        clientReq.destroy(new Error('Koneksi ke Cloudflare R2 timeout (30s)'))
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

export async function GET(req: NextRequest) {
  return handleDownloadRequest(req, false)
}

export async function HEAD(req: NextRequest) {
  return handleDownloadRequest(req, true)
}
