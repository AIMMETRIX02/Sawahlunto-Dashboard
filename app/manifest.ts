import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Balai Diklat Tambang Bawah Tanah - Kementerian ESDM',
    short_name: 'BDTBT ESDM',
    description: 'Portal Pembelajaran & Simulator Peledakan Tambang Bawah Tanah Sawahlunto Kementerian ESDM',
    start_url: '/',
    display: 'standalone',
    background_color: '#090A12',
    theme_color: '#FFF000',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
