const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <rect width="256" height="256" rx="56" fill="#FFF000"/>
  <g transform="translate(32, 32) scale(8)" fill="none" stroke="#000000" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/>
    <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/>
    <path d="M4 15v-3a6 6 0 0 1 6-6h0"/>
    <path d="M14 6h0a6 6 0 0 1 6 6v3"/>
  </g>
</svg>`

async function main() {
  const rootDir = path.resolve(__dirname, '..')
  const publicDir = path.join(rootDir, 'public')
  const appDir = path.join(rootDir, 'app')

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // Write SVGs
  const svgPathPublic = path.join(publicDir, 'icon.svg')
  const svgPathApp = path.join(appDir, 'icon.svg')
  const faviconSvgPublic = path.join(publicDir, 'favicon.svg')

  fs.writeFileSync(svgPathPublic, svgContent, 'utf-8')
  fs.writeFileSync(svgPathApp, svgContent, 'utf-8')
  fs.writeFileSync(faviconSvgPublic, svgContent, 'utf-8')
  console.log('✓ SVGs written successfully')

  // Generate PNGs using sharp
  const buffer = Buffer.from(svgContent)

  const png32 = await sharp(buffer).resize(32, 32).png().toBuffer()
  const png48 = await sharp(buffer).resize(48, 48).png().toBuffer()
  const png64 = await sharp(buffer).resize(64, 64).png().toBuffer()
  const png180 = await sharp(buffer).resize(180, 180).png().toBuffer()
  const png192 = await sharp(buffer).resize(192, 192).png().toBuffer()
  const png512 = await sharp(buffer).resize(512, 512).png().toBuffer()

  fs.writeFileSync(path.join(publicDir, 'icon.png'), png32)
  fs.writeFileSync(path.join(appDir, 'icon.png'), png32)
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180)
  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), png180)
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192)
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512)
  console.log('✓ PNG icons generated successfully')

  // Generate valid .ico file (wrapping PNG data inside ICO structure)
  // An ICO header consists of:
  // 6 bytes header: reserved(0x0000), type(0x0001 for icon), count(0x0001)
  // 16 bytes directory entry:
  // bWidth (32), bHeight (32), bColorCount (0), bReserved (0),
  // wPlanes (1), wBitCount (32), dwBytesInRes (png32.length), dwImageOffset (22)
  const icoHeader = Buffer.alloc(6)
  icoHeader.writeUInt16LE(0, 0) // Reserved
  icoHeader.writeUInt16LE(1, 2) // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4) // Count 1 image

  const icoEntry = Buffer.alloc(16)
  icoEntry.writeUInt8(32, 0) // Width (32)
  icoEntry.writeUInt8(32, 1) // Height (32)
  icoEntry.writeUInt8(0, 2)  // Color count (0 = >=8bpp)
  icoEntry.writeUInt8(0, 3)  // Reserved
  icoEntry.writeUInt16LE(1, 4) // Color planes
  icoEntry.writeUInt16LE(32, 6) // Bits per pixel
  icoEntry.writeUInt32LE(png32.length, 8) // Image data size
  icoEntry.writeUInt32LE(22, 12) // Image data offset (6 + 16 = 22)

  const icoFile = Buffer.concat([icoHeader, icoEntry, png32])
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile)
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoFile)
  console.log('✓ favicon.ico generated successfully')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
