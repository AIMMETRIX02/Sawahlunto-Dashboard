'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Loader2, User, Mail, Save, AlertCircle, CheckCircle, Lock } from 'lucide-react'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase.from('profiles').select('nama').eq('id', session.user.id).single()
      
      setUser(session.user)
      setEmail(session.user.email || '')
      setFullName(profile?.nama || session.user.user_metadata?.full_name || '')
      setLoading(false)
    }

    fetchUser()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword) {
      if (newPassword !== confirmNewPassword) {
        setMessage({ text: 'Konfirmasi kata sandi baru tidak cocok.', type: 'error' })
        return
      }
      if (newPassword.length < 6) {
        setMessage({ text: 'Kata sandi baru minimal 6 karakter.', type: 'error' })
        return
      }
    }

    setSaving(true)
    setMessage(null)

    try {
      // 1. Update nama in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ nama: fullName })
        .eq('id', user.id)
        
      if (profileError) throw profileError

      // 2. Update metadata as fallback (optional, but good for sync)
      const updates: any = {
        data: { full_name: fullName, nama: fullName }
      }

      // 3. Update password if provided
      if (newPassword) {
        updates.password = newPassword
      }

      const { error: authError } = await supabase.auth.updateUser(updates)

      if (authError) throw authError
      
      setMessage({ text: newPassword ? 'Profil dan kata sandi berhasil diperbarui!' : 'Profil berhasil diperbarui!', type: 'success' })
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error: any) {
      setMessage({ text: error.message || 'Gagal memperbarui profil.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#EAB308] animate-spin mb-4" />
        <p className="text-gray-600 font-semibold dark:text-gray-400">Memuat profil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          
          {/* Header */}
          <div className="bg-[#1D2327] px-6 py-8 sm:px-10 flex items-center space-x-4 border-b-4 border-[#FFF000]">
            <div className="h-16 w-16 bg-[#FFF000] rounded-2xl flex items-center justify-center shadow-lg">
              <User className="h-8 w-8 text-[#1D2327]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Profil Saya</h1>
              <p className="text-[#FFF000] text-sm font-medium">Kelola informasi akun Balai Diklat Tambang Bawah Tanah ESDM</p>
            </div>
          </div>

          {/* Form */}
          <div className="px-6 py-8 sm:px-10">
            {message && (
              <div className={`mb-6 p-4 rounded-xl flex items-start ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alamat Email (Tidak bisa diubah)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ubah Kata Sandi</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kata Sandi Baru (Opsional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                        placeholder="Kosongkan jika tidak ingin diubah"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all"
                        placeholder="Ketik ulang kata sandi baru"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center px-6 py-3 w-full sm:w-auto border border-yellow-500/30 rounded-xl shadow-lg text-sm font-bold text-[#FFF000] bg-[#1D2327] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D2327] disabled:opacity-50 transition-colors uppercase tracking-wider"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#FFF000]" />
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
