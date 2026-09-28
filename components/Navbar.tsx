'use client'

import { LayoutDashboard, Settings, User, Moon, Sun, Menu, CheckCircle, AlertCircle, X, LogOut, ChevronDown, HardHat, Crown, GraduationCap, Award, Home, Sparkles } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { BalaiSettingsModal } from './BalaiSettingsModal'

// Custom Toast Component for Navbar
const NavToast = ({ message, type, onClose }: { message: string, type: 'success' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-24 right-4 flex items-center p-4 mb-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-l-4 ${type === 'success' ? 'border-green-500' : 'border-amber-500'} z-[110] animate-in slide-in-from-top-5`}>
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
        {type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
      </div>
      <div className="ml-3 text-sm font-medium pr-6">{message}</div>
      <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 inline-flex items-center justify-center h-8 w-8">
        <span className="sr-only">Close</span>
      </button>
    </div>
  )
}

const Marquee = 'marquee' as any

export function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isBalaiSettingsOpen, setIsBalaiSettingsOpen] = useState(false)
  const [isDeveloperAboutOpen, setIsDeveloperAboutOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', session.user.id)
          .maybeSingle()
        setRole(profile?.role || 'peserta')
        setUserName(profile?.full_name || session.user.email?.split('@')[0] || 'Pengguna')
      }
    }
    getRole()
  }, [])

  const handleNavClick = (menu: string) => {
    if (menu === 'beranda') {
      router.push('/')
    } else if (menu === 'lms') {
      if (role === 'peserta' || role === 'mahasiswa') {
        router.push('/peserta')
      } else if (role === 'admin' || role === 'superadmin') {
        router.push('/admin')
      } else {
        router.push('/login')
      }
    } else if (menu === 'superadmin' || menu === 'kelola-akun') {
      router.push('/superadmin')
    } else if (menu === 'portal-admin') {
      router.push('/admin')
    } else if (menu === 'portal-peserta' || menu === 'portal-mahasiswa') {
      router.push('/peserta')
    } else if (menu === 'settings-balai') {
      setIsBalaiSettingsOpen(true)
    } else if (menu === 'about-developer') {
      router.push('/developer')
    } else if (menu === 'profile') {
      router.push('/profile')
    } else if (menu === 'logout') {
      handleLogout()
    }
    setIsMobileMenuOpen(false)
    setIsDropdownOpen(false)
    setIsSettingsOpen(false)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      setToast({ message: 'Gagal keluar. Silakan coba lagi.', type: 'info' })
    }
  }

  const isLmsActive = pathname === '/admin' || pathname === '/peserta'

  return (
    <>
      {toast && <NavToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <BalaiSettingsModal
        isOpen={isBalaiSettingsOpen}
        onClose={() => setIsBalaiSettingsOpen(false)}
        onSaved={() => setToast({ message: 'Pengaturan Kepala Balai berhasil diperbarui', type: 'success' })}
      />
      
      {/* 1. TOP ANNOUNCEMENT MARQUEE BAR (Khas BDTBT ESDM) */}
      <div className="bg-black text-white text-xs sm:text-sm py-2 px-4 border-b border-yellow-500/30 overflow-hidden font-mono z-[95] relative">
        <Marquee className="tracking-wide">
          <span className="text-yellow-300 font-bold">SELAMAT DATANG DI BALAI DIKLAT TAMBANG BAWAH TANAH – KEMENTERIAN ESDM RI</span>
          <span className="mx-4 text-gray-400">---</span>
          <span>SISTEM SIMULATOR PELEDAKAN (BLASTING) TAMBANG BAWAH TANAH BERBASIS VIRTUAL REALITY</span>
          <span className="mx-4 text-gray-400">---</span>
          <span>KAWASAN PEMBANGUNAN ZONA INTEGRITAS MENUJU WBK & WBBM</span>
          <span className="mx-4 text-gray-400">---</span>
          <span className="text-yellow-400 font-bold">BDTBT MENOLAK GRATIFIKASI DALAM BENTUK APAPUN</span>
        </Marquee>
      </div>

      {/* 2. MAIN HEADER & NAVIGATION */}
      <nav className="bg-[#1D2327] dark:bg-slate-950 text-white shadow-xl transition-colors duration-300 relative z-[90] border-b-4 border-[#FFF000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Branding Logo & Title */}
            <div 
              onClick={() => handleNavClick('beranda')} 
              className="flex items-center space-x-3.5 cursor-pointer group"
            >
              <div className="p-2.5 bg-[#FFF000] text-black rounded-xl shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
                <HardHat className="h-7 w-7 text-black stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-wider text-white leading-tight uppercase font-sans">
                  BALAI DIKLAT TAMBANG BAWAH TANAH
                </span>
                <span className="text-xs sm:text-sm text-[#FFF000] font-semibold tracking-widest uppercase">
                  Kementerian Energi dan Sumber Daya Mineral
                </span>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-3">
              
              {/* Menu 1: Beranda / Landing Page */}
              <button 
                onClick={() => handleNavClick('beranda')} 
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center ${
                  pathname === '/' ? 'bg-white/15 text-[#FFF000] font-bold shadow-inner' : 'hover:bg-white/10 text-gray-200 hover:text-[#FFF000]'
                }`}
              >
                <Home className="h-4 w-4 mr-2 text-[#FFF000]" />
                Beranda
              </button>

              {/* Menu 2: Dashboard LMS (Peserta & Admin) */}
              <button 
                onClick={() => handleNavClick('lms')} 
                className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center ${
                  isLmsActive ? 'bg-white/15 text-[#FFF000] font-bold shadow-inner' : 'hover:bg-white/10 text-gray-200 hover:text-[#FFF000]'
                }`}
              >
                <GraduationCap className="h-4 w-4 mr-2 text-[#FFF000]" />
                Dashboard LMS
              </button>

              <div className="h-6 w-px bg-gray-700 mx-1"></div>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme} 
                className="p-2.5 hover:bg-white/10 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-300" 
                title="Toggle Dark Mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-[#FFF000]" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Settings Dropdown ONLY for Superadmin */}
              {role === 'superadmin' && (
                <div className="relative">
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(!isSettingsOpen)
                      if (!isSettingsOpen) setIsDropdownOpen(false)
                    }}
                    className={`p-2.5 hover:bg-white/10 dark:hover:bg-slate-800 rounded-full transition-colors text-purple-300 ${isSettingsOpen ? 'bg-white/10 dark:bg-slate-800' : ''}`} 
                    title="Pengaturan Sistem & Kelola Akun (Superadmin)"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  
                  {isSettingsOpen && (
                    <>
                      <div className="fixed inset-0 z-[-1]" onClick={() => setIsSettingsOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl py-2 border border-gray-100 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-2 text-slate-800 dark:text-slate-100">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center">
                            <Crown className="w-3.5 h-3.5 mr-1" /> Menu Superadmin
                          </p>
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                            Root Access
                          </span>
                        </div>
                        
                        {/* Kelola Akun - inside gear menu */}
                        <button 
                          onClick={() => handleNavClick('superadmin')} 
                          className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-bold transition-colors"
                        >
                          <Crown className="h-4 w-4 mr-3 text-purple-500" /> Kelola Akun & Hak Akses
                        </button>

                        {/* Pengaturan Kepala Balai & Sertifikat */}
                        <button 
                          onClick={() => handleNavClick('settings-balai')} 
                          className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-semibold transition-colors"
                        >
                          <Award className="h-4 w-4 mr-3 text-amber-500" /> Atur Kepala Balai & Sertifikat
                        </button>

                        {/* About us Developer (Aimmetrix) */}
                        <button 
                          onClick={() => handleNavClick('about-developer')} 
                          className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-yellow-50 dark:hover:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300 font-semibold transition-colors"
                        >
                          <Sparkles className="h-4 w-4 mr-3 text-yellow-500" /> About us Developer
                        </button>

                        <div className="my-1 border-t border-gray-100 dark:border-slate-800"></div>

                        <button 
                          onClick={() => handleNavClick('portal-admin')} 
                          className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" /> Portal Administrator (LMS)
                        </button>

                        <button 
                          onClick={() => handleNavClick('portal-peserta')} 
                          className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <User className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" /> Pratinjau Portal Peserta
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Account Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen)
                    if (!isDropdownOpen) setIsSettingsOpen(false)
                  }}
                  className="flex items-center space-x-2 py-2 px-4 hover:bg-white/10 dark:hover:bg-slate-800 rounded-xl transition-colors border border-yellow-500/40 bg-black/20"
                >
                  <User className="h-4 w-4 text-[#FFF000]" />
                  <span className="text-sm font-semibold text-gray-100 max-w-[120px] truncate">
                    {userName || 'Akun ESDM'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl py-2 border border-gray-100 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-2 text-slate-800 dark:text-slate-100">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800 mb-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Masuk sebagai</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName || 'Pengguna BDTBT'}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
                          {role || 'Peserta'}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleNavClick('profile')} 
                        className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3 text-gray-500" /> Profil Saya
                      </button>

                      <button 
                        onClick={() => handleNavClick('logout')} 
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-slate-800 mt-1 pt-2"
                      >
                        <LogOut className="h-4 w-4 mr-3" /> Keluar Aplikasi
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button onClick={toggleTheme} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-200">
                {theme === 'dark' ? <Sun className="h-5 w-5 text-[#FFF000]" /> : <Moon className="h-5 w-5" />}
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-200"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#1D2327] dark:bg-slate-900 border-t border-yellow-500/20 absolute w-full left-0 right-0 shadow-2xl">
            <div className="px-4 py-4 space-y-2">
              <button onClick={() => handleNavClick('beranda')} className="flex items-center space-x-3 w-full p-3 hover:bg-white/10 rounded-xl transition-colors text-left text-gray-100 font-semibold">
                <Home className="h-5 w-5 text-[#FFF000]" />
                <span>Beranda (Simulator VR)</span>
              </button>

              <button onClick={() => handleNavClick('lms')} className="flex items-center space-x-3 w-full p-3 hover:bg-white/10 rounded-xl transition-colors text-left text-gray-100 font-semibold">
                <GraduationCap className="h-5 w-5 text-[#FFF000]" />
                <span>Dashboard LMS</span>
              </button>

              <button onClick={() => handleNavClick('profile')} className="flex items-center space-x-3 w-full p-3 hover:bg-white/10 rounded-xl transition-colors text-left text-gray-100">
                <User className="h-5 w-5 text-[#FFF000]" />
                <span>Profil Saya</span>
              </button>

              {role === 'superadmin' && (
                <>
                  <div className="px-3 pt-3 pb-1 border-t border-gray-700/50 mt-2">
                    <p className="text-xs font-bold text-[#FFF000] uppercase tracking-wider flex items-center">
                      <Crown className="w-3.5 h-3.5 mr-1 text-purple-400" /> Mode Superadmin
                    </p>
                  </div>
                  <button onClick={() => handleNavClick('superadmin')} className="flex items-center space-x-3 w-full p-3 hover:bg-purple-900/30 rounded-xl transition-colors text-left text-purple-300 font-bold">
                    <Crown className="h-5 w-5 text-purple-400" />
                    <span>Kelola Akun & Hak Akses</span>
                  </button>
                  <button onClick={() => handleNavClick('settings-balai')} className="flex items-center space-x-3 w-full p-3 hover:bg-amber-900/30 rounded-xl transition-colors text-left text-amber-300 font-semibold">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span>Atur Kepala Balai & Sertifikat</span>
                  </button>
                  <button onClick={() => handleNavClick('about-developer')} className="flex items-center space-x-3 w-full p-3 hover:bg-yellow-900/30 rounded-xl transition-colors text-left text-yellow-300 font-semibold">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    <span>About us Developer</span>
                  </button>
                  <button onClick={() => handleNavClick('portal-admin')} className="flex items-center space-x-3 w-full p-3 hover:bg-white/10 rounded-xl transition-colors text-left text-gray-100">
                    <LayoutDashboard className="h-5 w-5 text-gray-400" />
                    <span>Portal Administrator (LMS)</span>
                  </button>
                  <button onClick={() => handleNavClick('portal-peserta')} className="flex items-center space-x-3 w-full p-3 hover:bg-white/10 rounded-xl transition-colors text-left text-[#FFF000] font-semibold">
                    <User className="h-5 w-5 text-[#FFF000]" />
                    <span>Portal Peserta Diklat</span>
                  </button>
                </>
              )}

              <button onClick={() => handleNavClick('logout')} className="flex items-center space-x-3 w-full p-3 hover:bg-red-500/20 text-red-300 rounded-xl transition-colors text-left border-t border-gray-700/50 mt-2 pt-3">
                <LogOut className="h-5 w-5" />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
