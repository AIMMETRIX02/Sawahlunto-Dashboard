import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bdtbt-sawahlunto.esdm.go.id'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF000' },
    { media: '(prefers-color-scheme: dark)', color: '#090A12' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Simulator Peledakan Tambang Bawah Tanah | BDTBT - Kementerian ESDM',
    template: '%s | BDTBT Kementerian ESDM',
  },
  description:
    'Portal resmi Balai Diklat Tambang Bawah Tanah (BDTBT) Sawahlunto Kementerian Energi dan Sumber Daya Mineral Republik Indonesia. Platform pembelajaran simulasi Virtual Reality (VR), evaluasi sirkuit delay peledakan milidetik, SOP K3 pertambangan nasional, dan sertifikasi juru ledak tambang bawah tanah.',
  applicationName: 'BDTBT Underground Blasting Simulator',
  authors: [
    {
      name: 'Balai Diklat Tambang Bawah Tanah (BDTBT) - Kementerian ESDM RI',
      url: 'https://bdtbt.esdm.go.id',
    },
  ],
  generator: 'Next.js',
  keywords: [
    'BDTBT',
    'BDTBT Sawahlunto',
    'Kementerian ESDM',
    'Balai Diklat Tambang Bawah Tanah',
    'Simulator Peledakan Tambang',
    'Underground Blasting Simulator',
    'Virtual Reality Tambang',
    'Juru Ledak Tambang',
    'K3 Pertambangan',
    'Delay Peledakan Milidetik',
    'Nonel Shock Tube',
    'Blast Box Exploder',
    'Sawahlunto Tambang Batubara',
    'Sertifikasi Peledakan Tambang',
    'Pusat Diklat ESDM',
  ],
  creator: 'Kementerian Energi dan Sumber Daya Mineral RI',
  publisher: 'Balai Diklat Tambang Bawah Tanah Sawahlunto',
  formatDetection: {
    email: false,
    address: true,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Simulator Peledakan Tambang Bawah Tanah - BDTBT ESDM',
    title: 'Simulator Peledakan Tambang Bawah Tanah | BDTBT Kementerian ESDM',
    description:
      'Portal resmi simulasi 3D dan VR peledakan tambang bawah tanah Sawahlunto Kementerian ESDM. Evaluasi delay milidetik, SOP K3 tambang, dan sertifikasi juru ledak.',
    images: [
      {
        url: '/images/simulator/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Simulator Peledakan Tambang Bawah Tanah BDTBT Sawahlunto Kementerian ESDM',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulator Peledakan Tambang Bawah Tanah | BDTBT Kementerian ESDM',
    description:
      'Portal resmi simulasi 3D dan VR peledakan tambang bawah tanah Sawahlunto Kementerian ESDM.',
    images: ['/images/simulator/hero.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
  },
  category: 'education',
}

// JSON-LD Structured Data Schema for Government & Education Organization + Web Application
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['GovernmentOrganization', 'EducationalOrganization'],
      '@id': `${siteUrl}/#organization`,
      name: 'Balai Diklat Tambang Bawah Tanah - Kementerian Energi dan Sumber Daya Mineral',
      alternateName: 'BDTBT ESDM Sawahlunto',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon-512.png`,
        width: 512,
        height: 512,
      },
      description:
        'Unit Pelaksana Teknis di lingkungan Kementerian Energi dan Sumber Daya Mineral (ESDM) Republik Indonesia yang menyelenggarakan pendidikan, pelatihan, dan sertifikasi vokasi pertambangan bawah tanah.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Sawahlunto',
        addressRegion: 'Sumatera Barat',
        addressCountry: 'ID',
      },
      parentOrganization: {
        '@type': 'GovernmentOrganization',
        name: 'Kementerian Energi dan Sumber Daya Mineral Republik Indonesia',
        url: 'https://esdm.go.id',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#application`,
      name: 'Simulator Peledakan Tambang Bawah Tanah Virtual Reality (VR)',
      alternateName: 'Underground Blasting Simulation System BDTBT',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'All, Windows, Web Browser',
      url: siteUrl,
      description:
        'Platform simulasi 3D dan virtual reality peledakan tambang bawah tanah Sawahlunto. Melatih 11 SOP kritis peledakan, telemetri gas tambang (CH4/CO/O2), sirkuit delay non-electric (nonel), dan evaluasi akurasi milidetik.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'IDR',
      },
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Simulator Peledakan Tambang Bawah Tanah - BDTBT ESDM',
      description:
        'Portal resmi pembelajaran dan evaluasi simulasi peledakan tambang bawah tanah Sawahlunto Kementerian ESDM.',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      inLanguage: 'id-ID',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} dark:bg-slate-900 transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

