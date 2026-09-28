/**
 * Utility to convert any uploaded image (PNG, JPG, BMP, etc.) into lightweight WebP format.
 * Compresses and scales images efficiently on the client before saving to Supabase / LocalStorage.
 */

export interface ConvertedWebPResult {
  dataUrl: string
  originalSize: number
  webpSize: number
  compressionRatio: number
  fileName: string
  width: number
  height: number
}

export async function convertImageToWebP(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<ConvertedWebPResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Berkas yang dipilih bukan gambar yang valid.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Gagal memuat gambar ke memori browser.'))
      img.onload = () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Downscale proportionally if larger than maximum dimension
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D context tidak didukung pada browser ini.'))
          return
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Export to WebP format
        const webpDataUrl = canvas.toDataURL('image/webp', quality)

        // Compute size in bytes from Base64 string
        const base64Index = webpDataUrl.indexOf('base64,')
        const base64Length = base64Index >= 0 ? webpDataUrl.length - base64Index - 7 : webpDataUrl.length
        const webpSize = Math.round((base64Length * 3) / 4)
        const originalSize = file.size
        const compressionRatio = originalSize > webpSize
          ? Math.round(((originalSize - webpSize) / originalSize) * 100)
          : 0

        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name

        resolve({
          dataUrl: webpDataUrl,
          originalSize,
          webpSize,
          compressionRatio,
          fileName: `${baseName}.webp`,
          width,
          height
        })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
