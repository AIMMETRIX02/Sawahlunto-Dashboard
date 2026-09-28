'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Loader2, BookOpen, AlertCircle, CheckCircle, Printer, ArrowLeft, Shield, ShieldCheck, Eye, Image as ImageIcon, ExternalLink, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const CertificateModal = dynamic(() => import('@/components/CertificateModal').then(mod => mod.CertificateModal), {
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>,
  ssr: false,
})

const DelayDiagramUI = dynamic(() => import('@/components/DelayDiagramUI').then(mod => mod.DelayDiagramUI), {
  loading: () => <div className="p-8 text-center text-gray-400 font-mono"><Loader2 className="w-6 h-6 mx-auto mb-2 text-yellow-400 animate-spin" />Memuat Diagram Realtime...</div>,
  ssr: false,
})

const getTimeZoneLabel = (waktuStr?: string) => {
  if (!waktuStr) return 'WIB'
  const upper = waktuStr.toUpperCase()
  if (upper.includes('WITA')) return 'WITA'
  if (upper.includes('WIT')) return 'WIT'
  if (upper.includes('WIB')) return 'WIB'
  
  // Detect client/browser timezone offset
  if (typeof window !== 'undefined') {
    const offset = -new Date().getTimezoneOffset() / 60
    if (offset === 8) return 'WITA'
    if (offset === 9) return 'WIT'
  }
  return 'WIB' // Default BDTBT Sawahlunto, Sumatera Barat (UTC+7)
}

export default function PesertaDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [stambuk, setStambuk] = useState<string | null>(null)
  const [hasilUjianList, setHasilUjianList] = useState<any[]>([])
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null)
  const [selectedDelayData, setSelectedDelayData] = useState<{ title: string; image: string | null; data: any | null } | null>(null)
  const [passingThreshold, setPassingThreshold] = useState(35) // Fallback default
  
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        const role = profile?.role
        setUserRole(role || 'peserta')
        
        // If user has no profile or no role set, ask to complete profile
        if (!role) {
          router.push('/complete-profile')
          return
        }

        // NOTE: Superadmin / Dosen / Admin ARE ALLOWED to access & preview this page!

        setUser(session.user)
        const userPesertaId = profile?.id_peserta
        
        if (userPesertaId) {
          setStambuk(userPesertaId)

          // Fetch grades by id_peserta
          const { data: dataNew } = await supabase
            .from('hasil_ujian')
            .select('*')
            .eq('id_peserta', userPesertaId)
            .order('tanggal', { ascending: false })

          if (dataNew) {
            setHasilUjianList(dataNew)
          }
        } else if (role === 'superadmin' || role === 'dosen' || role === 'admin') {
          // If superadmin has no specific NIP, fetch all recent exam results for previewing
          const { data: allData } = await supabase
            .from('hasil_ujian')
            .select('*')
            .order('tanggal', { ascending: false })
            .limit(5)
            
          if (allData) setHasilUjianList(allData)
        }

        // Fetch global passing threshold
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('passing_threshold')
          .eq('id', 1)
          .maybeSingle()
          
        if (settingsData) {
          setPassingThreshold(settingsData.passing_threshold)
        }
      } catch (err) {
        console.error('Error loading participant dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#EAB308] animate-spin mb-4" />
        <p className="text-gray-600 font-semibold dark:text-gray-400">Memuat Data Kelulusan Diklat Peserta...</p>
      </div>
    )
  }

  const isSuperadmin = userRole === 'superadmin' || userRole === 'dosen' || userRole === 'admin'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      {/* Superadmin Mode Preview Notice Bar */}
      {isSuperadmin && (
        <div className="bg-[#1D2327] border-b border-yellow-500/40 py-2.5 px-4 text-center">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center text-[#FFF000] font-bold">
              <Shield className="w-4 h-4 mr-1.5" />
              MODE SUPERADMIN: Pratinjau Tampilan Portal Peserta Diklat
            </span>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1 bg-[#FFF000] text-black rounded-lg font-bold hover:bg-yellow-400 transition-colors uppercase tracking-wider text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Kembali ke Admin Dashboard
            </Link>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800">
          
          {/* Header */}
          <div className="bg-[#1D2327] px-6 py-10 sm:px-12 flex flex-col sm:flex-row items-center sm:items-start justify-between text-center sm:text-left border-b-4 border-[#FFF000]">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 font-serif">Portal Peserta Diklat</h1>
              <p className="text-[#FFF000] text-lg font-medium">Balai Diklat Tambang Bawah Tanah – ESDM Sawahlunto</p>
            </div>
            <div className="mt-6 sm:mt-0 p-4 bg-black/40 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
              <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider">NIP / No. Registrasi</p>
              <p className="text-2xl font-black text-[#FFF000] tracking-widest">{stambuk || (isSuperadmin ? 'PREVIEW MODE' : 'TIDAK ADA')}</p>
            </div>
          </div>

          <div className="p-6 sm:p-12">
            {!stambuk && !isSuperadmin ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No. Registrasi Tidak Ditemukan</h2>
                <p className="text-gray-500 dark:text-gray-400">Akun Anda tidak memiliki NIP/No. Registrasi. Silakan hubungi Admin BDTBT ESDM atau perbarui profil Anda.</p>
              </div>
            ) : hasilUjianList.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                <BookOpen className="w-16 h-16 text-amber-500/60 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Nilai Ujian</h2>
                <p className="text-gray-500 dark:text-gray-400">Nilai ujian diklat untuk No. Registrasi <strong>{stambuk || 'Peserta'}</strong> belum dipublikasikan oleh tim instruktur BDTBT.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {hasilUjianList.map((hasilUjian, index) => {
                  const isPassed = hasilUjian.benar >= passingThreshold
                  
                  return (
                    <div key={hasilUjian.id} className="animate-in fade-in slide-in-from-bottom-4 bg-gray-50/50 dark:bg-slate-800/20 rounded-3xl p-6 border border-gray-200 dark:border-slate-800 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
                      
                      {/* Header Pemisah Berdasarkan Tanggal & Jam Simulasi */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-5 border-b border-gray-200 dark:border-slate-700/80">
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#1D2327] text-[#FFF000] text-xs font-black tracking-wider uppercase shadow-sm border border-yellow-500/30">
                          📅 {hasilUjian.tanggal} • ⏰ {hasilUjian.waktu} {getTimeZoneLabel(hasilUjian.waktu)}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
                          Zona Waktu: {getTimeZoneLabel(hasilUjian.waktu)}
                        </span>
                      </div>

                      {/* Header Modul & Mode dari Database */}
                      <div className="text-center mb-6">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[#1D2327] text-[#FFF000] text-xs font-bold tracking-wider uppercase mb-2 shadow-md border border-yellow-500/30 max-w-full truncate">
                          Modul: {hasilUjian.modul || 'Tambang Bawah Tanah'}
                        </span>
                        {hasilUjian.mode && (
                          <div className="mt-1 mb-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-[#FFF000] text-xs font-extrabold tracking-wider uppercase border border-amber-200 dark:border-amber-800/60 shadow-sm">
                              🎮 Mode: {hasilUjian.mode}
                            </span>
                          </div>
                        )}
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">Hasil Evaluasi Akhir Kompetensi</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nama Peserta: <span className="font-semibold text-gray-900 dark:text-white">{hasilUjian.nama}</span></p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {/* Status Card - Proportionately Sized */}
                        <div className={`p-5 rounded-2xl flex flex-col items-center justify-center border-2 text-center ${isPassed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                          {isPassed ? (
                            <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                          ) : (
                            <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                          )}
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status Kompetensi</p>
                          <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-wide leading-tight ${isPassed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {isPassed ? 'Kompeten / Lulus' : 'Belum Kompeten'}
                          </h3>
                        </div>

                        {/* Score Card */}
                        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Rincian Hasil Ujian</p>
                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-300 font-medium">Jawaban Benar</span>
                              <span className="text-base font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900 px-3 py-0.5 rounded-lg shadow-sm">{hasilUjian.benar}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-300 font-medium">Jawaban Salah</span>
                              <span className="text-base font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-900 px-3 py-0.5 rounded-lg shadow-sm">{hasilUjian.salah}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                              <span className="text-gray-600 dark:text-gray-300 font-bold">Tingkat Akurasi</span>
                              <span className="text-base font-black text-[#CA8A04] dark:text-[#FACC15]">
                                {Math.round((hasilUjian.benar / (hasilUjian.benar + hasilUjian.salah)) * 100) || 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Checklist Evaluasi Prosedur Operasional (9 Parameter) */}
                      <div className="bg-white dark:bg-slate-800/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/80 mb-6">
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100 dark:border-slate-700">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center">
                            <ShieldCheck className="w-4 h-4 mr-1.5 text-[#CA8A04] dark:text-[#FACC15]" />
                            Evaluasi Prosedur Peledakan
                          </h3>
                          <span className="text-[11px] font-bold text-[#CA8A04] dark:text-[#FACC15] bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            {[
                              hasilUjian.safety, hasilUjian.scaling, hasilUjian.primer, hasilUjian.tie_in, hasilUjian.cord_cable,
                              hasilUjian.charging, hasilUjian.blasting_cap, hasilUjian.cap_line,
                              hasilUjian.ignite_blastbox, hasilUjian.blasting, hasilUjian.motor_fan
                            ].filter(Boolean).length} / 11 OK
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: 'Safety Equipment', status: hasilUjian.safety, icon: '🦺' },
                            { label: 'Scaling', status: hasilUjian.scaling, icon: '⛏️' },
                            { label: 'Primer', status: hasilUjian.primer, icon: '💣' },
                            { label: 'Tie In', status: hasilUjian.tie_in, icon: '🔗' },
                            { label: 'Cord/Cable', status: hasilUjian.cord_cable, icon: '🔌' },
                            { label: 'Charging', status: hasilUjian.charging, icon: '⚡' },
                            { label: 'Blasting Cap', status: hasilUjian.blasting_cap, icon: '🧨' },
                            { label: 'Cap Line', status: hasilUjian.cap_line, icon: '🧵' },
                            { label: 'Ignite Blastbox', status: hasilUjian.ignite_blastbox, icon: '📦' },
                            { label: 'Blasting', status: hasilUjian.blasting, icon: '💥' },
                            { label: 'Motor Fan', status: hasilUjian.motor_fan, icon: '🌀' },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-bold ${
                                item.status
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-300'
                                  : 'bg-red-50/50 dark:bg-red-900/10 border-red-200/60 dark:border-red-900/30 text-red-600 dark:text-red-400'
                              }`}
                            >
                              <span className="flex items-center space-x-1.5 min-w-0 pr-1">
                                <span className="flex-shrink-0">{item.icon}</span>
                                <span className="text-[10px] sm:text-[11px] leading-tight font-bold whitespace-normal">{item.label}</span>
                              </span>
                              {item.status ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0 ml-1" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 ml-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tombol View Delay Diagram */}
                      <div className="mb-4">
                        <button 
                          onClick={() => setSelectedDelayData({
                            title: `${hasilUjian.modul || 'Simulasi Peledakan'} (${hasilUjian.tanggal})`,
                            image: hasilUjian.delay_image || null,
                            data: hasilUjian.delay_data || null,
                          })}
                          className="w-full py-3 px-4 bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/40 rounded-2xl font-extrabold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center space-x-2 uppercase tracking-wider"
                        >
                          <Eye className="w-4 h-4 text-[#FFF000]" />
                          <span>View Delay (Diagram Peledakan)</span>
                        </button>
                      </div>

                      {isPassed && (
                        <div className="bg-white dark:bg-slate-900 border border-yellow-500/30 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center shadow-lg">
                          <Printer className="w-12 h-12 text-[#CA8A04] dark:text-[#FACC15] mb-4" />
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Selamat! Sertifikat Diklat ESDM Anda Telah Terbit</h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-lg">
                            Sertifikat kompetensi resmi dari Balai Diklat Tambang Bawah Tanah Kementerian ESDM telah diterbitkan secara digital.
                          </p>
                          <button 
                            onClick={() => setSelectedCertificate(hasilUjian)}
                            className="px-8 py-4 bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/40 rounded-2xl font-bold text-lg shadow-xl transition-all hover:-translate-y-1 flex items-center"
                          >
                            <Printer className="w-5 h-5 mr-3 text-[#FFF000]" />
                            Lihat & Cetak Sertifikat ESDM
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Certificate Modal */}
      {selectedCertificate && (
        <CertificateModal
          isOpen={!!selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
          student={selectedCertificate}
        />
      )}

      {/* Delay Image / Interactive Array UI Lightbox Modal */}
      {selectedDelayData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-yellow-500/40">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1D2327] border-b border-yellow-500/30">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-[#FFF000]" />
                  Visualisasi Diagram Delay Peledakan (Realtime Data)
                </h3>
                <p className="text-xs text-[#FFF000] font-medium">{selectedDelayData.title}</p>
              </div>
              <button
                onClick={() => setSelectedDelayData(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body: Render Interactive UI Diagram Component */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center justify-center">
              <DelayDiagramUI
                delayData={selectedDelayData.data}
                title={selectedDelayData.title}
              />

              {/* Fallback Static Image View if Image URL exists */}
              {selectedDelayData.image && (
                <div className="w-full mt-6 pt-6 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
                    🖼️ Gambar Tangkapan Layar Static dari Unreal Engine
                  </p>
                  <img
                    src={selectedDelayData.image}
                    alt="Static Screenshot Delay"
                    className="max-h-[40vh] mx-auto object-contain rounded-2xl border border-gray-700 shadow-xl"
                  />
                  <a
                    href={selectedDelayData.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-xs font-bold text-[#FFF000] hover:underline"
                  >
                    <span>Buka Gambar Asli Resolusi Penuh</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#1D2327] border-t border-yellow-500/30 flex justify-between items-center text-xs text-gray-300">
              <span className="font-mono text-[#FFF000]">
                ⚡ Rendered Lightweight Array Data from Unreal Engine
              </span>
              <button
                onClick={() => setSelectedDelayData(null)}
                className="px-6 py-2 bg-[#FFF000] text-[#1D2327] rounded-xl font-extrabold uppercase tracking-wider hover:bg-yellow-400 transition-colors shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
