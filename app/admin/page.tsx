'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { StudentTable } from '@/components/StudentTable'
import { Loader2 } from 'lucide-react'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, id_peserta')
          .eq('id', session.user.id)
          .maybeSingle()
        
        const userRole = profile?.role || 'peserta'

        // If regular peserta tries to enter admin portal, bounce to peserta portal
        if (userRole === 'peserta' || userRole === 'mahasiswa') {
          router.push('/peserta')
          return
        }

        setLoading(false)
      } catch (err) {
        console.error('Error checking admin dashboard session:', err)
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#EAB308] animate-spin mb-4" />
        <p className="text-gray-600 font-semibold dark:text-gray-400">Memverifikasi Hak Akses Administrator BDTBT...</p>
      </div>
    )
  }

  return (
    <div id="dashboard-admin" className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      <main className="max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentTable />
      </main>
    </div>
  )
}
