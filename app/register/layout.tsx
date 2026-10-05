import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pendaftaran Akun Peserta Diklat',
  description:
    'Registrasi akun peserta baru untuk mengikuti pelatihan simulasi peledakan tambang bawah tanah BDTBT Sawahlunto Kementerian Energi dan Sumber Daya Mineral (ESDM).',
  alternates: {
    canonical: '/register',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
