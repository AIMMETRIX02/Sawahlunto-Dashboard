'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HardHat, Loader2, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [idPeserta, setIdPeserta] = useState('')
  const [instansi, setInstansi] = useState('Balai Diklat Tambang Bawah Tanah')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.')
      return
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.')
      return
    }

    if (!idPeserta || idPeserta.length < 4) {
      setError('ID Peserta / NIP wajib diisi.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const upperId = idPeserta.toUpperCase()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'peserta',
            id_peserta: upperId,
            instansi: instansi || 'BDTBT ESDM'
          }
        }
      })

      if (error) throw error
      
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung dengan Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-[#1D2327] rounded-2xl shadow-xl border-2 border-[#FFF000]">
            <HardHat className="h-10 w-10 text-[#FFF000]" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white font-sans uppercase tracking-wider">
          Pendaftaran Peserta Diklat
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

          <form className="space-y-6" onSubmit={handleRegister}>
            
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID Peserta / NIP / No. Registrasi
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instansi / Perusahaan
              </label>
              <input
                type="text"
                required
                value={instansi}
                onChange={(e) => setInstansi(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                placeholder="Misal: PT Freeport Indonesia / BDTBT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                placeholder="peserta@esdm.go.id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kata Sandi
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-yellow-500/30 rounded-xl shadow-lg text-sm font-bold text-[#FFF000] bg-[#1D2327] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D2327] disabled:opacity-50 transition-colors uppercase tracking-wider"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-[#FFF000]" /> : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">atau daftar cepat dengan</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-gray-500" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                    <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.73 17.57C14.74 18.23 13.48 18.63 12 18.63C9.13 18.63 6.7 16.7 5.82 14.09H2.15V16.94C3.96 20.53 7.69 23 12 23Z" fill="#34A853"/>
                    <path d="M5.82 14.09C5.59 13.43 5.46 12.73 5.46 12C5.46 11.27 5.59 10.57 5.82 9.91V7.06H2.15C1.41 8.53 1 10.21 1 12C1 13.79 1.41 15.47 2.15 16.94L5.82 14.09Z" fill="#FBBC05"/>
                    <path d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.03L19.38 3.86C17.45 2.06 14.96 1 12 1C7.69 1 3.96 3.47 2.15 7.06L5.82 9.91C6.7 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
                  </svg>
                )}
                Daftar dengan Google
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Sudah memiliki akun? </span>
            <Link href="/login" className="font-semibold text-[#CA8A04] dark:text-[#FACC15] hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
