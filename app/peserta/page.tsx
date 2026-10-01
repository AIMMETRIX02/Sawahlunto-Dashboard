'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import {
  Loader2,
  BookOpen,
  AlertCircle,
  ArrowLeft,
  Shield,
  UserCheck
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  StudentData,
  normalizeStudentData
} from '@/lib/examHelpers'
import { ParticipantExamCard } from '@/components/ParticipantExamCard'
import { DelayDiagramModal } from '@/components/DelayDiagramModal'
import { ReviewApprovalModal } from '@/components/ReviewApprovalModal'

const CertificateModal = dynamic(() => import('@/components/CertificateModal').then(mod => mod.CertificateModal), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
    </div>
  ),
  ssr: false,
})

export default function PesertaDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userPesertaId, setUserPesertaId] = useState<string | null>(null)
  
  // Selected NIP for superadmin / admin dropdown
  const [selectedNip, setSelectedNip] = useState<string>('')
  
  // All exams fetched from Supabase (for superadmin dropdown and participant)
  const [allExams, setAllExams] = useState<StudentData[]>([])
  
  const [selectedCertificate, setSelectedCertificate] = useState<StudentData | null>(null)
  const [delayModalStudent, setDelayModalStudent] = useState<StudentData | null>(null)
  const [reviewStudent, setReviewStudent] = useState<StudentData | null>(null)
  const [passingThreshold, setPassingThreshold] = useState(35)
  
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
        
        if (!role) {
          router.push('/complete-profile')
          return
        }

        setUser(session.user)
        const currentPesertaId = profile?.id_peserta || ''
        setUserPesertaId(currentPesertaId)

        // Fetch global passing threshold
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('passing_threshold')
          .eq('id', 1)
          .maybeSingle()
          
        if (settingsData) {
          setPassingThreshold(settingsData.passing_threshold)
        }

        // Fetch exam records
        const isStaff = role === 'superadmin' || role === 'admin'
        
        if (isStaff) {
          // Admin / Superadmin: Fetch all results to build the participant NIP dropdown
          const { data: allData, error } = await supabase
            .from('hasil_ujian')
            .select('*')
            .order('tanggal', { ascending: false })

          if (allData) {
            const normalized = allData.map(normalizeStudentData)
            setAllExams(normalized)
            
            // Default selected NIP to current profile or first participant in list
            if (currentPesertaId && normalized.some(d => (d.id_peserta || '').toUpperCase() === currentPesertaId.toUpperCase())) {
              setSelectedNip(currentPesertaId)
            } else if (normalized.length > 0) {
              const firstNip = normalized.find(d => !!d.id_peserta)?.id_peserta || normalized[0].id_peserta || ''
              setSelectedNip(firstNip)
            }
          }
        } else {
          // Regular Participant: fetch their own exams
          if (currentPesertaId) {
            setSelectedNip(currentPesertaId)
            const { data: pData } = await supabase
              .from('hasil_ujian')
              .select('*')
              .eq('id_peserta', currentPesertaId)
              .order('tanggal', { ascending: false })

            if (pData) {
              setAllExams(pData.map(normalizeStudentData))
            }
          }
        }
      } catch (err) {
        console.error('Error loading participant dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const isSuperadmin = userRole === 'superadmin' || userRole === 'admin'

  // Build unique participants list for Admin dropdown:
  // Format requested: NIP | Nama | Total Report
  const participantOptions = useMemo(() => {
    if (!isSuperadmin || allExams.length === 0) return []
    
    const map = new Map<string, { nip: string; nama: string; totalReport: number }>()
    
    allExams.forEach(item => {
      const nip = (item.id_peserta || '').trim()
      if (!nip) return
      
      const key = nip.toUpperCase()
      const existing = map.get(key)
      if (existing) {
        existing.totalReport += 1
        if (item.nama && existing.nama === 'Peserta Diklat') {
          existing.nama = item.nama
        }
      } else {
        map.set(key, {
          nip: nip,
          nama: item.nama || 'Peserta Diklat',
          totalReport: 1
        })
      }
    })

    return Array.from(map.values())
  }, [isSuperadmin, allExams])

  // Filter exams by the active selected NIP
  const displayedExams = useMemo(() => {
    if (!selectedNip) {
      return allExams
    }
    return allExams.filter(item => 
      (item.id_peserta || '').toUpperCase() === selectedNip.toUpperCase()
    )
  }, [allExams, selectedNip])

  // Get current participant name for selected NIP
  const currentParticipantName = useMemo(() => {
    if (displayedExams.length > 0 && displayedExams[0].nama) {
      return displayedExams[0].nama
    }
    const found = participantOptions.find(p => p.nip.toUpperCase() === selectedNip.toUpperCase())
    return found?.nama || 'Peserta Diklat'
  }, [displayedExams, participantOptions, selectedNip])

  const handleReviewSuccess = (updated: StudentData) => {
    setAllExams(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-[#EAB308] animate-spin mb-4" />
        <p className="text-gray-600 font-semibold dark:text-gray-400">Memuat Data Kelulusan Diklat Peserta...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      {/* Superadmin Mode Banner */}
      {isSuperadmin && (
        <div className="bg-[#1D2327] border-b border-yellow-500/40 py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center text-[#FFF000] font-bold">
              <Shield className="w-4 h-4 mr-1.5" />
              MODE ADMIN: Pratinjau Tampilan Portal Peserta Diklat
            </span>
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-1 bg-[#FFF000] text-black rounded-lg font-bold hover:bg-yellow-400 transition-colors uppercase tracking-wider text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Kembali ke Dashboard Admin
            </Link>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-800">
          
          {/* Header Portal Peserta */}
          <div className="bg-[#1D2327] px-6 py-8 sm:px-12 flex flex-col lg:flex-row items-center lg:items-start justify-between text-center lg:text-left border-b-4 border-[#FFF000] gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-serif">Portal Peserta Diklat</h1>
              <p className="text-[#FFF000] text-base sm:text-lg font-medium">Balai Diklat Tambang Bawah Tanah – ESDM Sawahlunto</p>
              {isSuperadmin && (
                <p className="text-xs text-gray-400 mt-1">
                  Melihat profil peserta: <strong className="text-white">{currentParticipantName}</strong> ({displayedExams.length} Laporan)
                </p>
              )}
            </div>

            {/* NIP Section: Dropdown for Admin/Superadmin, or Static Badge for Student */}
            {isSuperadmin ? (
              <div className="p-4 bg-black/60 rounded-2xl backdrop-blur-sm border border-yellow-500/40 text-left min-w-[280px] sm:min-w-[340px] shadow-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center">
                    <UserCheck className="w-3.5 h-3.5 mr-1 text-[#FFF000]" />
                    Pilih NIP Peserta (Admin)
                  </span>
                  <span className="text-[10px] font-extrabold bg-[#FFF000] text-[#1D2327] px-2 py-0.5 rounded-full uppercase">
                    {participantOptions.length} Peserta
                  </span>
                </div>

                {participantOptions.length > 0 ? (
                  <select
                    value={selectedNip}
                    onChange={(e) => setSelectedNip(e.target.value)}
                    className="w-full bg-[#1D2327] border-2 border-yellow-500/60 text-[#FFF000] text-xs sm:text-sm font-bold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#FFF000] cursor-pointer shadow-inner"
                  >
                    {participantOptions.map((opt) => (
                      <option key={opt.nip} value={opt.nip} className="bg-slate-900 text-white font-medium py-1">
                        {opt.nip} | {opt.nama} | {opt.totalReport} Report
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum ada NIP peserta terdaftar</p>
                )}

                <p className="text-[10px] text-gray-400 mt-2 font-mono">
                  Format: NIP | Nama | Total Report
                </p>
              </div>
            ) : (
              <div className="mt-4 lg:mt-0 p-4 bg-black/40 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
                <p className="text-xs text-gray-300 mb-1 uppercase tracking-wider">NIP / No. Registrasi</p>
                <p className="text-2xl font-black text-[#FFF000] tracking-widest font-mono">
                  {selectedNip || userPesertaId || 'TIDAK ADA'}
                </p>
              </div>
            )}
          </div>

          {/* Cards Content */}
          <div className="p-6 sm:p-10">
            {!selectedNip && !isSuperadmin ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No. Registrasi Tidak Ditemukan</h2>
                <p className="text-gray-500 dark:text-gray-400">Akun Anda tidak memiliki NIP/No. Registrasi. Silakan hubungi Admin BDTBT ESDM atau perbarui profil Anda.</p>
              </div>
            ) : displayedExams.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                <BookOpen className="w-16 h-16 text-amber-500/60 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Nilai Ujian</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Nilai ujian simulasi diklat untuk No. Registrasi <strong>{selectedNip || 'Peserta'}</strong> belum dipublikasikan oleh tim instruktur BDTBT.
                </p>
              </div>
            ) : (
              <div>
                {isSuperadmin && (
                  <div className="mb-6 pb-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Menampilkan hasil simulasi untuk <strong>{currentParticipantName}</strong> (NIP: <span className="font-mono text-amber-600 dark:text-yellow-400 font-bold">{selectedNip}</span>)
                    </span>
                    <span className="font-semibold text-[#CA8A04] dark:text-[#FFF000]">
                      Total: {displayedExams.length} Laporan
                    </span>
                  </div>
                )}

                {/* Grid Cards (Like in Image 1) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                  {displayedExams.map((hasilUjian) => (
                    <ParticipantExamCard
                      key={hasilUjian.id}
                      student={hasilUjian}
                      passingThreshold={passingThreshold}
                      onViewDelay={(student) => setDelayModalStudent(student)}
                      onViewCertificate={(student) => setSelectedCertificate(student)}
                      isAdminView={isSuperadmin}
                      onOpenReview={(student) => setReviewStudent(student)}
                    />
                  ))}
                </div>
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

      {/* Delay Diagram Modal */}
      {delayModalStudent && (
        <DelayDiagramModal
          isOpen={!!delayModalStudent}
          onClose={() => setDelayModalStudent(null)}
          title={`${delayModalStudent.modul || 'Simulasi Peledakan'} (${delayModalStudent.nama} - ${delayModalStudent.tanggal})`}
          delayData={delayModalStudent.delay_data}
        />
      )}

      {/* Quick Review Modal for Superadmin/Admin */}
      {reviewStudent && (
        <ReviewApprovalModal
          isOpen={!!reviewStudent}
          onClose={() => setReviewStudent(null)}
          student={reviewStudent}
          onSuccess={handleReviewSuccess}
          onViewDelay={(s) => setDelayModalStudent(s)}
        />
      )}
    </div>
  )
}
