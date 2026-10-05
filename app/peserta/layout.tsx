import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Peserta Diklat',
  description: 'Portal Pembelajaran, Riwayat Ujian, dan Penilaian Simulasi Peledakan BDTBT ESDM.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PesertaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
