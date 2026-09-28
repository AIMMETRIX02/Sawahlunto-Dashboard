'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { StudentTable } from '@/components/StudentTable'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
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
        
        const userPesertaId = profile?.id_peserta || (profile as any)?.stambuk
        const isPeserta = profile?.role === 'peserta' || profile?.role === 'mahasiswa'
        if (!profile) {
          router.push('/complete-profile')
        } else if (isPeserta && !userPesertaId) {
          router.push('/complete-profile')
        } else if (isPeserta) {
          router.push('/peserta')
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error checking main dashboard session:', err)
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (!session) {
          router.push('/login')
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, id_peserta')
            .eq('id', session.user.id)
            .maybeSingle()
          
          const userPesertaId = profile?.id_peserta || (profile as any)?.stambuk
          const isPeserta = profile?.role === 'peserta' || profile?.role === 'mahasiswa'
          if (!profile) {
            router.push('/complete-profile')
          } else if (isPeserta && !userPesertaId) {
            router.push('/complete-profile')
          } else if (isPeserta) {
            router.push('/peserta')
          } else {
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Error on auth state change:', err)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#EAB308] animate-spin mb-4" />
        <p className="text-gray-600 font-semibold dark:text-gray-400">Memverifikasi Sesi Akses BDTBT ESDM...</p>
      </div>
    )
  }

  return (
    <div id="dashboard-main" className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentTable />
      </main>
    </div>
  )
}
