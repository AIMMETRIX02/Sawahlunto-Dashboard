import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Super Admin Control Center',
  description: 'Pusat Manajemen Akun, Hak Akses Role, dan Pengaturan Sistem BDTBT ESDM.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
