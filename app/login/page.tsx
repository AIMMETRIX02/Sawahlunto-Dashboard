'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HardHat, Loader2, AlertCircle, Eye, EyeOff, AlertTriangle, Mail, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Unverified account state
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendError, setResendError] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setUnverifiedEmail(null)
    setResendSuccess(false)
    setResendError(null)

    let targetEmail = loginId.trim()

    try {
      // If it doesn't look like an email, assume it's ID Peserta / NIP
      if (!targetEmail.includes('@')) {
        // Call RPC function get_email_by_id_peserta
        const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_id_peserta', { 
          p_id_peserta: targetEmail.toUpperCase() 
        })

        if (rpcError || !emailData) {
          throw new Error('ID Peserta / NIP tidak ditemukan. Pastikan Anda sudah terdaftar.')
        }
        
        targetEmail = emailData
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      })

      if (error) throw error
      
      router.push('/')
      router.refresh()
    } catch (err: any) {
      const errMsg = err?.message || ''
      const isUnconfirmed = 
        errMsg.toLowerCase().includes('not confirmed') ||
        errMsg.toLowerCase().includes('email not confirmed') ||
        err?.code === 'email_not_confirmed'

      if (isUnconfirmed) {
        setUnverifiedEmail(targetEmail)
      } else {
        setError(errMsg || 'Gagal masuk. Periksa kembali data akun dan kata sandi Anda.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail || resendCooldown > 0) return
    setResendLoading(true)
    setResendSuccess(false)
    setResendError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
      })
      if (error) throw error
      setResendSuccess(true)
      setResendCooldown(60)
    } catch (err: any) {
      setResendError(err.message || 'Gagal mengirim ulang email verifikasi. Coba lagi beberapa saat lagi.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    setUnverifiedEmail(null)
    
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
          Portal Akses BDTBT
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-[#CA8A04] dark:text-[#FACC15]">
          Balai Diklat Tambang Bawah Tanah – Kementerian ESDM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-slate-800">
          
          {/* General Error Banner */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-xl flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Unverified Account Notification */}
          {unverifiedEmail && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/40 p-4 rounded-2xl shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl mr-3 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-[#FFF000]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Akun Belum Diverifikasi!
                  </h4>
                  <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300 leading-relaxed">
                    Email <span className="font-semibold underline break-all">{unverifiedEmail}</span> belum diverifikasi. Silakan periksa kotak masuk (inbox) atau folder spam pada email Anda untuk mengaktifkan akun.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading || resendCooldown > 0}
                      className="inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/30 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      {resendLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Mail className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang Email Verifikasi'}
                    </button>

                    {resendSuccess && (
                      <span className="text-xs text-green-700 dark:text-green-400 font-semibold inline-flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> Tautan aktivasi terkirim!
                      </span>
                    )}

                    {resendError && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {resendError}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email atau NIP / No. Registrasi
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value)
                  if (unverifiedEmail) setUnverifiedEmail(null)
                }}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                placeholder="Misal: REG-2026-001 atau peserta@esdm.go.id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-yellow-500/30 rounded-xl shadow-lg text-sm font-bold text-[#FFF000] bg-[#1D2327] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D2327] disabled:opacity-50 transition-colors uppercase tracking-wider"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-[#FFF000]" /> : 'Masuk Aplikasi'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">atau lanjutkan dengan</span>
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
                Login dengan Google
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Belum punya akun? </span>
            <Link href="/register" className="font-semibold text-[#CA8A04] dark:text-[#FACC15] hover:underline">
              Daftar di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

