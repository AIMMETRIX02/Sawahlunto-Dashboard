import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lengkapi Data Profil Peserta',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CompleteProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
