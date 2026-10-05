import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang Pengembang Sistem',
  description: 'Informasi pengembang sistem simulator peledakan tambang bawah tanah BDTBT ESDM.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
