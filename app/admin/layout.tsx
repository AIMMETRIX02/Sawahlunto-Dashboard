import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Administrator',
  description: 'Panel Pengelolaan Data Nilai, Ujian, dan Peserta Diklat BDTBT ESDM.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
