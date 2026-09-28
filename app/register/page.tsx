'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HardHat, Loader2, AlertCircle, Eye, EyeOff, Mail, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [idPeserta, setIdPeserta] = useState('')
  const [instansi, setInstansi] = useState('Balai Diklat Tambang Bawah Tanah')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Verification notification state
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
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
      
      // If user signed up successfully, always show the verification required screen
      setIsRegistered(true)
      setRegisteredEmail(email)
      setResendSuccess(false)
      setResendError(null)
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!registeredEmail || resendCooldown > 0) return
    setResendLoading(true)
    setResendSuccess(false)
    setResendError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      })
      if (error) throw error
      setResendSuccess(true)
      setResendCooldown(60)
    } catch (err: any) {
      setResendError(err.message || 'Gagal mengirim ulang email verifikasi. Coba lagi nanti.')
    } finally {
      setResendLoading(false)
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
          {isRegistered ? 'Verifikasi Akun' : 'Pendaftaran Peserta Diklat'}
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-[#CA8A04] dark:text-[#FACC15]">
          Balai Diklat Tambang Bawah Tanah – Kementerian ESDM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-slate-800">
          
          {/* Post-Registration Verification Screen */}
          {isRegistered ? (
            <div className="text-center py-2 animate-in fade-in duration-300">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center border-2 border-[#FFF000] mb-4 shadow-lg shadow-amber-500/10">
                <Mail className="w-8 h-8 text-amber-600 dark:text-[#FFF000]" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Pendaftaran Berhasil!
              </h3>
              <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-[#FACC15]">
                Akun Anda Perlu Diverifikasi Dahulu
              </p>

              <div className="mt-5 bg-amber-50/70 dark:bg-slate-800/80 rounded-2xl p-4 border border-amber-200/80 dark:border-slate-700 text-left">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tautan aktivasi akun telah dikirimkan ke:
                </p>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 font-mono break-all">
                  {registeredEmail}
                </p>
                
                <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1D2327] text-[#FFF000] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                    <span>Buka email Anda dan periksa kotak masuk (inbox) atau folder <strong>Spam / Junk</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1D2327] text-[#FFF000] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                    <span>Klik tombol atau tautan <strong>Konfirmasi / Verifikasi Email</strong> di pesan tersebut.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1D2327] text-[#FFF000] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                    <span>Setelah status email aktif, Anda dapat langsung masuk ke portal BDTBT.</span>
                  </div>
                </div>
              </div>

              {resendSuccess && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-800 rounded-xl text-xs text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  <span>Tautan verifikasi baru berhasil dikirimkan ke email Anda.</span>
                </div>
              )}

              {resendError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{resendError}</span>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="w-full flex justify-center items-center py-3 px-4 border border-yellow-500/30 rounded-xl shadow-lg text-sm font-bold text-[#FFF000] bg-[#1D2327] hover:bg-black focus:outline-none transition-colors uppercase tracking-wider"
                >
                  Menuju Halaman Masuk
                </Link>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading || resendCooldown > 0}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {resendLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2 text-[#CA8A04] dark:text-[#FACC15]" />
                  )}
                  {resendCooldown > 0 ? `Kirim Ulang Email (${resendCooldown}s)` : 'Belum menerima email? Kirim Ulang'}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistered(false)
                      setError(null)
                      setResendSuccess(false)
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Daftar kembali dengan akun lain
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <>
              {error && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleRegister}>
                
                <div>
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
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-11 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                      placeholder="Minimal 6 karakter"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-4 pr-11 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                      placeholder="Ketik ulang kata sandi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                      aria-label={showConfirmPassword ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                    >
                      {showConfirmPassword ? (
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
            </>
          )}

        </div>
      </div>
    </div>
  )
}

