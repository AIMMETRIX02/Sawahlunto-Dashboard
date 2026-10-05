import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bdtbt-sawahlunto.esdm.go.id'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/register',
          '/api/download',
          '/images/',
          '/icon.svg',
          '/favicon.ico',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/superadmin',
          '/superadmin/*',
          '/peserta',
          '/peserta/*',
          '/profile',
          '/profile/*',
          '/complete-profile',
          '/complete-profile/*',
          '/developer',
          '/developer/*',
          '/api/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/login',
          '/register',
          '/api/download',
          '/images/',
          '/icon.svg',
          '/favicon.ico',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/superadmin',
          '/superadmin/*',
          '/peserta',
          '/peserta/*',
          '/profile',
          '/profile/*',
          '/complete-profile',
          '/complete-profile/*',
          '/developer',
          '/developer/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
