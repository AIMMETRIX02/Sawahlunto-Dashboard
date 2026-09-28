'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { HardHat, Loader2, AlertCircle, LogOut } from 'lucide-react'

export default function CompleteProfilePage() {
  const [idPeserta, setIdPeserta] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      
      const userPesertaId = profile?.id_peserta
      const isPeserta = profile?.role === 'peserta' || profile?.role === 'mahasiswa'
      
      // Non-participant roles (superadmin, admin) do not need to fill participant profile
      if (profile?.role && !isPeserta) {
        router.push('/')
        return
      }

      if (userPesertaId) {
        if (isPeserta) {
          router.push('/peserta')
        } else {
          router.push('/')
        }
        return
      }
      
      setInitializing(false)
    }
    checkUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!idPeserta || idPeserta.length < 4) {
      setError('ID Peserta / NIP wajib diisi.')
      return
    }

    if (!password || password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Dapatkan user id & email
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesi tidak valid")

      // 2. Update password untuk login di LMS / Simulator
      const { error: authError } = await supabase.auth.updateUser({
        password: password
      })
      if (authError) throw authError

      // 3. Upsert id_peserta, instansi dan role di tabel profiles
      const upperId = idPeserta.toUpperCase()
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          id_peserta: upperId,
          instansi: 'Balai Diklat Tambang Bawah Tanah',
          role: 'peserta',
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError
      
      router.push('/peserta')
      router.refresh()
    } catch (err: any) {
      if (err.message && err.message.includes('row-level security')) {
        setError('Akses Supabase Ditolak (Row Level Security). Silakan matikan RLS pada tabel "profiles" di Dashboard Supabase SQL Editor dengan perintah: ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;')
      } else {
        setError(err.message || 'Gagal menyimpan profil. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#EAB308] animate-spin mb-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300 relative">
      
      {/* Top Logout Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl shadow-sm text-sm font-semibold transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2 text-red-500" />
          Keluar / Switch Akun
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-[#1D2327] rounded-2xl shadow-xl border-2 border-[#FFF000]">
            <HardHat className="h-10 w-10 text-[#FFF000]" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white font-sans uppercase tracking-wider">
          Lengkapi Profil Peserta
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-[#CA8A04] dark:text-[#FACC15]">
          Balai Diklat Tambang Bawah Tanah – Kementerian ESDM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-slate-800">
          
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleCompleteProfile}>
            
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NIP / No. Registrasi Peserta
              </label>
              <input
                type="text"
                required
                value={idPeserta}
                onChange={(e) => setIdPeserta(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all uppercase"
                placeholder="Misal: REG-2026-001"
                maxLength={15}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Identitas ini wajib agar sistem BDTBT ESDM bisa melacak sertifikat & nilai ujian Anda.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Buat Kata Sandi Akses Simulator
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                    placeholder="Ketik ulang kata sandi"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-yellow-500/30 rounded-xl shadow-lg text-sm font-bold text-[#FFF000] bg-[#1D2327] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D2327] disabled:opacity-50 transition-colors mt-8 uppercase tracking-wider"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-[#FFF000]" /> : 'Simpan & Lanjutkan'}
            </button>
          </form>

          {/* Bottom Logout Link */}
          <div className="mt-6 text-center border-t border-gray-100 dark:border-slate-800 pt-4">
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex items-center"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Keluar dan ganti akun
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
