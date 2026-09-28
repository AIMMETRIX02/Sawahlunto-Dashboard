import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Balai Diklat Tambang Bawah Tanah - Kementerian ESDM',
  description: 'Portal Official Balai Diklat Tambang Bawah Tanah Kementerian Energi dan Sumber Daya Mineral (ESDM) Sawahlunto',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-slate-900 transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
