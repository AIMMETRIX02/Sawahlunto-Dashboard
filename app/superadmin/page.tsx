'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Crown, 
  GraduationCap, 
  HardHat, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  KeyRound, 
  Mail, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2, 
  ChevronRight, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Shield, 
  ArrowLeft,
  Calendar,
  Lock,
  Award
} from 'lucide-react'
import { BalaiSettingsModal } from '@/components/BalaiSettingsModal'

interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  nama?: string | null
  id_peserta: string | null
  stambuk?: string | null
  instansi: string | null
  role: 'superadmin' | 'admin' | 'peserta' | 'mahasiswa' | string
  created_at: string | null
  updated_at?: string | null
}

const ROLES_INFO: Record<string, { label: string; desc: string; color: string; badgeBg: string; icon: any }> = {
  superadmin: {
    label: 'Superadmin',
    desc: 'Akses penuh seluruh sistem: kelola akun, atur role, evaluasi ujian, dan portal peserta.',
    color: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700/60',
    icon: Crown
  },
  admin: {
    label: 'Administrator',
    desc: 'Pengelola diklat: input, evaluasi, edit nilai ujian, kelola checklist keselamatan tambang.',
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700/60',
    icon: ShieldCheck
  },
  peserta: {
    label: 'Peserta Diklat',
    desc: 'Peserta pelatihan: akses portal hasil ujian pribadi, diagram delay, dan sertifikat kelulusan.',
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
    icon: HardHat
  },
  dosen: {
    label: 'Administrator',
    desc: 'Akun pengelola diklat.',
    color: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700/60',
    icon: ShieldCheck
  },
  mahasiswa: {
    label: 'Peserta Diklat',
    desc: 'Label peserta diklat.',
    color: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
    icon: HardHat
  }
}

export default function SuperadminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Data State
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedInstansiFilter, setSelectedInstansiFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'id'>('newest')

  // UI / Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false)
  const [isBalaiSettingsOpen, setIsBalaiSettingsOpen] = useState(false)
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)

  // Form State - Add User
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newIdPeserta, setNewIdPeserta] = useState('')
  const [newInstansi, setNewInstansi] = useState('Balai Diklat Tambang Bawah Tanah')
  const [newRole, setNewRole] = useState<'superadmin' | 'admin' | 'peserta'>('peserta')
  const [showPassword, setShowPassword] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Form State - Edit User
  const [editFullName, setEditFullName] = useState('')
  const [editIdPeserta, setEditIdPeserta] = useState('')
  const [editInstansi, setEditInstansi] = useState('')
  const [editRole, setEditRole] = useState<string>('peserta')

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // 1. Initial Authentication & Superadmin Verification
  useEffect(() => {
    const verifySuperadmin = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        setCurrentUser(session.user)

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error || !profile) {
          router.push('/')
          return
        }

        setCurrentRole(profile.role)

        // Strict role check: Only 'superadmin' allowed
        if (profile.role !== 'superadmin') {
          router.push('/')
          return
        }

        await fetchProfiles()
      } catch (err) {
        console.error('Superadmin verification error:', err)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    verifySuperadmin()
  }, [router])

  // 2. Fetch All Profiles
  const fetchProfiles = async () => {
    try {
      setRefreshing(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProfiles(data || [])
    } catch (err: any) {
      setToast({ message: `Gagal mengambil daftar akun: ${err.message}`, type: 'error' })
    } finally {
      setRefreshing(false)
    }
  }

  // 3. Unique Instansi List for Filter
  const instansiOptions = useMemo(() => {
    const set = new Set<string>()
    profiles.forEach(p => {
      if (p.instansi && p.instansi.trim()) {
        set.add(p.instansi.trim())
      }
    })
    return Array.from(set).sort()
  }, [profiles])

  // 4. Filtered & Sorted Profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const name = (p.full_name || p.nama || '').toLowerCase()
      const email = (p.email || '').toLowerCase()
      const idStr = (p.id_peserta || p.stambuk || '').toLowerCase()
      const instansi = (p.instansi || '').toLowerCase()
      const q = searchQuery.toLowerCase().trim()

      const matchesSearch = !q || name.includes(q) || email.includes(q) || idStr.includes(q) || instansi.includes(q)
      
      const roleNormalized = p.role === 'mahasiswa' ? 'peserta' : p.role === 'dosen' ? 'admin' : p.role
      const matchesRole = selectedRoleFilter === 'all' || roleNormalized === selectedRoleFilter

      const matchesInstansi = selectedInstansiFilter === 'all' || (p.instansi && p.instansi.trim() === selectedInstansiFilter)

      return matchesSearch && matchesRole && matchesInstansi
    }).sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = (a.full_name || a.nama || a.email || '').toLowerCase()
        const nameB = (b.full_name || b.nama || b.email || '').toLowerCase()
        return nameA.localeCompare(nameB)
      }
      if (sortBy === 'id') {
        const idA = (a.id_peserta || a.stambuk || '').toLowerCase()
        const idB = (b.id_peserta || b.stambuk || '').toLowerCase()
        return idA.localeCompare(idB)
      }
      // default: newest
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
  }, [profiles, searchQuery, selectedRoleFilter, selectedInstansiFilter, sortBy])

  // 5. Metrics Calculation
  const metrics = useMemo(() => {
    let superadminCount = 0
    let adminCount = 0
    let pesertaCount = 0

    profiles.forEach(p => {
      const r = p.role
      if (r === 'superadmin') superadminCount++
      else if (r === 'admin' || r === 'dosen') adminCount++
      else pesertaCount++
    })

    return {
      total: profiles.length,
      superadmin: superadminCount,
      admin: adminCount,
      peserta: pesertaCount
    }
  }, [profiles])

  // 6. Handle Copy ID Peserta / NIP
  const handleCopyId = (idStr: string) => {
    navigator.clipboard.writeText(idStr)
    setCopiedId(idStr)
    setTimeout(() => setCopiedId(null), 2000)
    setToast({ message: `ID "${idStr}" berhasil disalin ke clipboard`, type: 'info' })
  }

  // 7. Handle Direct Role Change (Quick Selector)
  const handleQuickRoleChange = async (profile: UserProfile, newRoleTarget: string) => {
    // Safety guard: prevent self-demoting
    if (profile.id === currentUser?.id && newRoleTarget !== 'superadmin') {
      setToast({ message: 'Peringatan: Anda tidak dapat menurunkan hak akses akun Anda sendiri dari Superadmin!', type: 'error' })
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRoleTarget, updated_at: new Date().toISOString() })
        .eq('id', profile.id)

      if (error) throw error

      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRoleTarget } : p))
      setToast({ 
        message: `Hak akses untuk ${profile.full_name || profile.email} diubah menjadi ${newRoleTarget.toUpperCase()}!`, 
        type: 'success' 
      })
    } catch (err: any) {
      setToast({ message: `Gagal memperbarui role: ${err.message}`, type: 'error' })
    }
  }

  // 8. Handle Create New Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newEmail || !newPassword || !newFullName || !newIdPeserta) {
      setToast({ message: 'Semua kolom wajib diisi lengkap.', type: 'error' })
      return
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Kata sandi akun minimal 6 karakter.', type: 'error' })
      return
    }

    setFormSubmitting(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      
      // Use isolated client so superadmin's browser session is NOT replaced
      const isolatedClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      })

      const upperId = newIdPeserta.trim().toUpperCase()

      const { data: authData, error: authError } = await isolatedClient.auth.signUp({
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        options: {
          data: {
            full_name: newFullName.trim(),
            id_peserta: upperId,
            instansi: newInstansi.trim(),
            role: newRole
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Ensure profiles record is updated with exact values
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: newEmail.trim().toLowerCase(),
            full_name: newFullName.trim(),
            id_peserta: upperId,
            instansi: newInstansi.trim(),
            role: newRole,
            updated_at: new Date().toISOString()
          })
      }

      setToast({ message: `Akun ${newFullName} (${newRole.toUpperCase()}) berhasil dibuat!`, type: 'success' })
      setIsAddModalOpen(false)
      
      // Reset form
      setNewEmail('')
      setNewPassword('')
      setNewFullName('')
      setNewIdPeserta('')
      setNewInstansi('Balai Diklat Tambang Bawah Tanah')
      setNewRole('peserta')

      await fetchProfiles()
    } catch (err: any) {
      setToast({ message: `Gagal membuat akun: ${err.message}`, type: 'error' })
    } finally {
      setFormSubmitting(false)
    }
  }

  // 9. Handle Edit User Modal Submit
  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProfile) return

    // Safety guard: prevent self-demoting
    if (activeProfile.id === currentUser?.id && editRole !== 'superadmin') {
      setToast({ message: 'Anda tidak dapat mengubah hak akses akun Anda sendiri menjadi non-Superadmin!', type: 'error' })
      return
    }

    setFormSubmitting(true)
    try {
      const upperId = editIdPeserta.trim().toUpperCase()
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          id_peserta: upperId,
          instansi: editInstansi.trim(),
          role: editRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeProfile.id)

      if (error) throw error

      setProfiles(prev => prev.map(p => p.id === activeProfile.id ? {
        ...p,
        full_name: editFullName.trim(),
        id_peserta: upperId,
        instansi: editInstansi.trim(),
        role: editRole
      } : p))

      setToast({ message: `Data akun ${editFullName} berhasil diperbarui!`, type: 'success' })
      setIsEditModalOpen(false)
      setActiveProfile(null)
    } catch (err: any) {
      setToast({ message: `Gagal memperbarui akun: ${err.message}`, type: 'error' })
    } finally {
      setFormSubmitting(false)
    }
  }

  // 10. Handle Delete User
  const handleDeleteAccount = async () => {
    if (!activeProfile) return

    // Safety guard: prevent self-delete
    if (activeProfile.id === currentUser?.id) {
      setToast({ message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk!', type: 'error' })
      setIsDeleteModalOpen(false)
      return
    }

    setFormSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', activeProfile.id)

      if (error) throw error

      setProfiles(prev => prev.filter(p => p.id !== activeProfile.id))
      setToast({ message: `Akun ${activeProfile.full_name || activeProfile.email} telah dihapus dari sistem.`, type: 'info' })
      setIsDeleteModalOpen(false)
      setActiveProfile(null)
    } catch (err: any) {
      setToast({ message: `Gagal menghapus akun: ${err.message}`, type: 'error' })
    } finally {
      setFormSubmitting(false)
    }
  }

  // 11. Handle Reset Password Email Trigger
  const handleSendResetPassword = async () => {
    if (!activeProfile || !activeProfile.email) return

    setFormSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(activeProfile.email, {
        redirectTo: `${window.location.origin}/profile`
      })

      if (error) throw error

      setToast({ 
        message: `Instruksi pemulihan kata sandi telah dikirimkan ke email ${activeProfile.email}.`, 
        type: 'success' 
      })
      setIsResetPwdModalOpen(false)
      setActiveProfile(null)
    } catch (err: any) {
      setToast({ message: `Gagal mengirim email reset: ${err.message}`, type: 'error' })
    } finally {
      setFormSubmitting(false)
    }
  }

  // 12. Export to CSV
  const handleExportCSV = () => {
    if (filteredProfiles.length === 0) {
      setToast({ message: 'Tidak ada data pengguna untuk diekspor.', type: 'info' })
      return
    }

    const headers = ['No', 'Nama Lengkap', 'Email', 'ID Peserta / NIP', 'Instansi', 'Role', 'Tanggal Terdaftar']
    const rows = filteredProfiles.map((p, idx) => [
      idx + 1,
      `"${(p.full_name || p.nama || '-').replace(/"/g, '""')}"`,
      `"${(p.email || '-').replace(/"/g, '""')}"`,
      `"${(p.id_peserta || p.stambuk || '-').replace(/"/g, '""')}"`,
      `"${(p.instansi || '-').replace(/"/g, '""')}"`,
      `"${(p.role || '-').toUpperCase()}"`,
      `"${p.created_at ? new Date(p.created_at).toLocaleString('id-ID') : '-'}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Daftar_Akun_Pengguna_BDTBT_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setToast({ message: `Berhasil mengekspor ${filteredProfiles.length} akun ke format CSV!`, type: 'success' })
  }

  // Helper for Opening Edit Modal
  const openEditModal = (p: UserProfile) => {
    setActiveProfile(p)
    setEditFullName(p.full_name || p.nama || '')
    setEditIdPeserta(p.id_peserta || p.stambuk || '')
    setEditInstansi(p.instansi || 'Balai Diklat Tambang Bawah Tanah')
    setEditRole(p.role === 'mahasiswa' ? 'peserta' : p.role)
    setIsEditModalOpen(true)
  }

  // Helper for Opening Delete Modal
  const openDeleteModal = (p: UserProfile) => {
    setActiveProfile(p)
    setIsDeleteModalOpen(true)
  }

  // Helper for Opening Reset Password Modal
  const openResetPwdModal = (p: UserProfile) => {
    setActiveProfile(p)
    setIsResetPwdModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#EAB308] animate-spin mb-4" />
        <p className="text-gray-700 dark:text-gray-300 font-semibold tracking-wide">
          Memverifikasi Otorisasi Superadmin BDTBT ESDM...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 pb-16">
      <Navbar />

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed top-24 right-4 max-w-md flex items-center p-4 text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-l-4 z-[200] animate-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'border-green-500' : toast.type === 'error' ? 'border-red-500' : 'border-amber-500'
        }`}>
          <div className="mr-3 flex-shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <ShieldAlert className="w-5 h-5 text-amber-500" />}
          </div>
          <div className="text-sm font-medium pr-2">{toast.message}</div>
          <button 
            onClick={() => setToast(null)}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ========================================================================= */}
        {/* HEADER SECTION                                                           */}
        {/* ========================================================================= */}
        <div className="bg-[#1D2327] rounded-3xl shadow-2xl p-6 sm:p-8 border-b-4 border-[#FFF000] text-white relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Crown className="w-3.5 h-3.5 text-purple-300" />
                Superadmin Privilege Level
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide uppercase font-sans">
                Manajemen Akun & Kontrol Hak Akses
              </h1>
              <p className="text-gray-300 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
                Kelola kredensial, tetapkan peran pengguna (<span className="text-[#FFF000] font-semibold">Superadmin</span>, <span className="text-blue-400 font-semibold">Administrator</span>, dan <span className="text-amber-400 font-semibold">Peserta Diklat</span>), serta kelola akses database terpusat.
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 transition-all hover:scale-[1.02]"
                title="Kembali ke Landing Page Simulator VR"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5 text-[#FFF000]" />
                Beranda VR
              </button>

              <button
                onClick={() => router.push('/admin')}
                className="inline-flex items-center px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 transition-all hover:scale-[1.02]"
                title="Buka Portal LMS Evaluasi Ujian & Nilai"
              >
                <GraduationCap className="w-4 h-4 mr-1.5 text-[#FFF000]" />
                Portal LMS Admin
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#FFF000] text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] uppercase tracking-wider"
              >
                <UserPlus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                Tambah Akun
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATS METRIC CARDS                                                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* Total Pengguna */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Akun Terdaftar</span>
              <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{metrics.total}</span>
              <span className="text-xs text-gray-400 font-semibold">pengguna</span>
            </div>
          </div>

          {/* Superadmin */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/30 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400">Superadmin</span>
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Crown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-400">{metrics.superadmin}</span>
              <span className="text-xs text-purple-500 font-semibold">otoritas penuh</span>
            </div>
          </div>

          {/* Administrator */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/30 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400">Administrator</span>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400">{metrics.admin}</span>
              <span className="text-xs text-blue-500 font-semibold">pengelola diklat</span>
            </div>
          </div>

          {/* Peserta Diklat */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">Peserta Diklat</span>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <HardHat className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400">{metrics.peserta}</span>
              <span className="text-xs text-amber-500 font-semibold">siswa diklat</span>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CONTROLS & SEARCH BAR                                                    */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-100 dark:border-slate-800 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, email, NIP / ID peserta, atau instansi..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#1D2327] dark:focus:ring-yellow-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Role Dropdown */}
              <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-xs sm:text-sm">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 font-medium hidden sm:inline">Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={e => setSelectedRoleFilter(e.target.value)}
                  className="bg-transparent font-semibold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Role</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="admin">Administrator</option>
                  <option value="peserta">Peserta Diklat</option>
                </select>
              </div>

              {/* Instansi Dropdown */}
              {instansiOptions.length > 0 && (
                <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedInstansiFilter}
                    onChange={e => setSelectedInstansiFilter(e.target.value)}
                    className="bg-transparent font-semibold text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
                  >
                    <option value="all">Semua Instansi</option>
                    {instansiOptions.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={fetchProfiles}
                disabled={refreshing}
                title="Segarkan Data"
                className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-yellow-500' : ''}`} />
              </button>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                title="Ekspor CSV"
                className="inline-flex items-center px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors"
              >
                <Download className="w-4 h-4 mr-1.5 text-gray-500" />
                Ekspor CSV
              </button>

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* USERS ACCOUNT TABLE                                                       */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-yellow-500" />
              <h2 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-sm sm:text-base">
                Daftar Akun Pengguna ({filteredProfiles.length})
              </h2>
            </div>
            {selectedRoleFilter !== 'all' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-semibold">
                Filter: {selectedRoleFilter.toUpperCase()}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1D2327] text-white text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Pengguna</th>
                  <th className="py-4 px-6">ID Peserta / NIP</th>
                  <th className="py-4 px-6">Instansi / Perusahaan</th>
                  <th className="py-4 px-6">Hak Akses (Role)</th>
                  <th className="py-4 px-6">Terdaftar</th>
                  <th className="py-4 px-6 text-right">Kelola Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-semibold text-base">Tidak ada akun yang cocok dengan filter pencarian.</p>
                      <p className="text-xs mt-1">Coba sesuaikan kata kunci atau reset filter role.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map(p => {
                    const roleKey = p.role || 'peserta'
                    const roleCfg = ROLES_INFO[roleKey] || ROLES_INFO.peserta
                    const RoleIcon = roleCfg.icon
                    const isSelf = p.id === currentUser?.id

                    return (
                      <tr 
                        key={p.id}
                        className={`hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelf ? 'bg-yellow-50/50 dark:bg-yellow-950/10' : ''
                        }`}
                      >
                        {/* Pengguna (Avatar, Nama, Email) */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                              roleKey === 'superadmin' ? 'bg-purple-600 text-white' :
                              roleKey === 'admin' ? 'bg-blue-600 text-white' :
                              'bg-amber-500 text-black font-extrabold'
                            }`}>
                              {(p.full_name || p.nama || p.email || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                {p.full_name || p.nama || 'Tanpa Nama'}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-600 dark:text-yellow-300 font-bold border border-yellow-400/40">
                                    AKUN ANDA
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {p.email || 'Email belum diatur'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ID Peserta / NIP */}
                        <td className="py-4 px-6 font-mono font-bold text-xs text-gray-700 dark:text-gray-300">
                          {p.id_peserta || p.stambuk ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                              <span>{p.id_peserta || p.stambuk}</span>
                              <button 
                                onClick={() => handleCopyId(p.id_peserta || p.stambuk || '')}
                                title="Salin ID"
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              >
                                {copiedId === (p.id_peserta || p.stambuk) ? (
                                  <Check className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Belum diisi</span>
                          )}
                        </td>

                        {/* Instansi */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1.5 text-gray-700 dark:text-gray-300 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[200px]" title={p.instansi || 'BDTBT ESDM'}>
                              {p.instansi || 'Balai Diklat Tambang Bawah Tanah'}
                            </span>
                          </div>
                        </td>

                        {/* Role Selector & Badge */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${roleCfg.badgeBg}`}>
                              <RoleIcon className="w-3.5 h-3.5" />
                              {roleCfg.label}
                            </span>

                            {/* Inline Quick Role Selector */}
                            <select
                              value={p.role === 'mahasiswa' ? 'peserta' : p.role}
                              onChange={e => handleQuickRoleChange(p, e.target.value)}
                              disabled={isSelf}
                              title={isSelf ? 'Anda tidak dapat menurunkan role akun Anda sendiri' : 'Ubah role pengguna secara cepat'}
                              className="text-xs bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value="superadmin">Jadikan Superadmin</option>
                              <option value="admin">Jadikan Admin</option>
                              <option value="peserta">Jadikan Peserta</option>
                            </select>
                          </div>
                        </td>

                        {/* Tanggal Terdaftar */}
                        <td className="py-4 px-6 text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {p.created_at ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(p.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>

                        {/* Kelola Aksi */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            
                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(p)}
                              title="Edit Profil & Role"
                              className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => openResetPwdModal(p)}
                              title="Kirim Tautan Reset Kata Sandi"
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => openDeleteModal(p)}
                              disabled={isSelf}
                              title={isSelf ? 'Anda tidak dapat menghapus akun sendiri' : 'Hapus Akun Pengguna'}
                              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH AKUN BARU                                                 */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            
            <div className="bg-[#1D2327] px-6 py-5 border-b-4 border-[#FFF000] text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#FFF000] text-black rounded-xl">
                  <UserPlus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-wider">Tambah Akun Pengguna Baru</h3>
                  <p className="text-xs text-[#FFF000]">Daftarkan akun resmi ke database BDTBT ESDM</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="Misal: Ir. Budi Santoso, M.T."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Alamat Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@esdm.go.id"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Kata Sandi *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#1D2327] focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    ID Peserta / NIP *
                  </label>
                  <input
                    type="text"
                    required
                    value={newIdPeserta}
                    onChange={e => setNewIdPeserta(e.target.value.toUpperCase())}
                    placeholder="REG-2026-001"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Hak Akses (Role) *
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                  >
                    <option value="peserta">Peserta Diklat</option>
                    <option value="admin">Administrator Diklat</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Instansi / Perusahaan
                </label>
                <input
                  type="text"
                  value={newInstansi}
                  onChange={e => setNewInstansi(e.target.value)}
                  placeholder="PT Freeport / BDTBT ESDM / Mahasiswa ITB"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                />
              </div>

              {/* Role explanation alert */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                <Crown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{newRole.toUpperCase()}</strong>: {ROLES_INFO[newRole]?.desc}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1D2327] text-[#FFF000] hover:bg-black border border-yellow-500/30 transition-all flex items-center"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#FFF000]" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan & Buat Akun'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT AKUN & ROLE                                                 */}
      {/* ========================================================================= */}
      {isEditModalOpen && activeProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            
            <div className="bg-[#1D2327] px-6 py-5 border-b-4 border-blue-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 text-white rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-wider">Edit Data & Role Pengguna</h3>
                  <p className="text-xs text-blue-300">{activeProfile.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    ID Peserta / NIP *
                  </label>
                  <input
                    type="text"
                    required
                    value={editIdPeserta}
                    onChange={e => setEditIdPeserta(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Hak Akses (Role) *
                  </label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    disabled={activeProfile.id === currentUser?.id}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#1D2327] focus:outline-none disabled:opacity-50"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="admin">Administrator Diklat</option>
                    <option value="peserta">Peserta Diklat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Instansi / Perusahaan
                </label>
                <input
                  type="text"
                  value={editInstansi}
                  onChange={e => setEditInstansi(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-[#1D2327] focus:outline-none"
                />
              </div>

              {activeProfile.id === currentUser?.id && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300">
                  <p className="font-bold">Perhatian Akun Aktif:</p>
                  <p>Anda sedang mengedit akun Anda sendiri. Role tidak dapat diubah dari Superadmin untuk mencegah lockout.</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Perbarui Akun'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HAPUS AKUN                                                       */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && activeProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            
            <div className="bg-red-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-wider">Hapus Akun Pengguna</h3>
                  <p className="text-xs text-red-200">Konfirmasi tindakan destruktif</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-red-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun pengguna berikut?
              </p>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-sm">
                <div className="font-bold text-gray-900 dark:text-white">{activeProfile.full_name || activeProfile.nama || 'Tanpa Nama'}</div>
                <div className="text-xs text-gray-500 mt-0.5">{activeProfile.email}</div>
                <div className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400 mt-2">
                  ID: {activeProfile.id_peserta || activeProfile.stambuk || '-'} | Role: {activeProfile.role?.toUpperCase()}
                </div>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                Peringatan: Tindakan ini akan menghapus profil akun dari sistem BDTBT ESDM.
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all flex items-center"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    'Ya, Hapus Akun'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RESET PASSWORD                                                   */}
      {/* ========================================================================= */}
      {isResetPwdModalOpen && activeProfile && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            
            <div className="bg-[#1D2327] px-6 py-5 border-b-4 border-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500 text-black rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base uppercase tracking-wider">Pemulihan Kata Sandi</h3>
                  <p className="text-xs text-amber-300">Kirim email tautan reset</p>
                </div>
              </div>
              <button 
                onClick={() => setIsResetPwdModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Kirim instruksi dan tautan pemulihan kata sandi resmi ke alamat email pengguna:
              </p>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-sm">
                <div className="font-bold text-gray-900 dark:text-white">{activeProfile.full_name || activeProfile.nama}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">{activeProfile.email}</div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
                Pengguna akan menerima email berisikan tautan aman untuk membuat kata sandi baru.
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsResetPwdModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendResetPassword}
                  disabled={formSubmitting || !activeProfile.email}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-black transition-all flex items-center"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-black" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Email Reset'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Kepala Balai & Sertifikat */}
      <BalaiSettingsModal
        isOpen={isBalaiSettingsOpen}
        onClose={() => setIsBalaiSettingsOpen(false)}
        onSaved={() => {
          setToast({ message: 'Pengaturan Kepala Balai dan NIP berhasil disimpan!', type: 'success' })
        }}
      />

    </div>
  )
}
