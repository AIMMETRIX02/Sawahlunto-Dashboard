import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk Akun Peserta & Administrator',
  description:
    'Masuk ke portal LMS dan sistem evaluasi peledakan tambang bawah tanah BDTBT Sawahlunto Kementerian Energi dan Sumber Daya Mineral (ESDM).',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
