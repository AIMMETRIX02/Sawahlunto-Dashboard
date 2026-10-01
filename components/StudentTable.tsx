'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  Award,
  X,
  RefreshCw,
  Eye,
  FileCheck2,
  User,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { SummaryCards } from './SummaryCards'
import {
  StudentData,
  getCompletedSteps,
  normalizeStudentData,
  saveStudentExamRecord
} from '@/lib/examHelpers'
export type { StudentData }
export { getCompletedSteps }
import { ReviewApprovalModal } from './ReviewApprovalModal'
import { DelayDiagramModal } from './DelayDiagramModal'
import { ParticipantCardsModal } from './ParticipantCardsModal'
import { exportToExcel, exportToPDF } from '@/lib/exportHelpers'

const StudentModal = dynamic(() => import('./StudentModal').then(mod => mod.StudentModal), {
  loading: () => null,
  ssr: false,
})

const DeleteModal = dynamic(() => import('./DeleteModal').then(mod => mod.DeleteModal), {
  loading: () => null,
  ssr: false,
})

const CertificateModal = dynamic(() => import('./CertificateModal').then(mod => mod.CertificateModal), {
  loading: () => null,
  ssr: false,
})

// Custom Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4500)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 flex items-center p-4 mb-4 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-l-4 ${type === 'success' ? 'border-green-500' : 'border-red-500'} z-[2000] animate-in slide-in-from-bottom-5 border border-gray-100 dark:border-slate-700`}>
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg mr-2">
        {type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>
      <div className="text-xs sm:text-sm font-semibold pr-6">{message}</div>
      <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 inline-flex items-center justify-center h-8 w-8 cursor-pointer">
        <span className="sr-only">Close</span>
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function StudentTable() {
  const [data, setData] = useState<StudentData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  
  // Filtering and sorting state
  const [sortBy, setSortBy] = useState('terbaru')
  const [filterModul, setFilterModul] = useState('Semua')
  const [filterStatus, setFilterStatus] = useState('Semua')

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  const [isParticipantCardsModalOpen, setIsParticipantCardsModalOpen] = useState(false)
  
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<StudentData | null>(null)
  const [certificateStudent, setCertificateStudent] = useState<StudentData | null>(null)
  const [reviewStudent, setReviewStudent] = useState<StudentData | null>(null)
  const [delayStudent, setDelayStudent] = useState<StudentData | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<{ nip: string; name: string; records: StudentData[] } | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [passingThreshold, setPassingThreshold] = useState(35) // Fallback default

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('hasil_ujian')
        .select('*')
        .order('tanggal', { ascending: false })

      if (supabaseError) {
        throw new Error(supabaseError.message)
      }
      
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('passing_threshold')
        .eq('id', 1)
        .maybeSingle()
        
      if (settingsData) {
        setPassingThreshold(settingsData.passing_threshold)
      }
      
      const normalized = (supabaseData || []).map(normalizeStudentData)
      setData(normalized)
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data dari Supabase. Pastikan tabel hasil_ujian ada dan RLS sudah diatur.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Dynamic Modul Options
  const modulOptions = useMemo(() => {
    const moduls = new Set(data.map(s => s.modul || 'Umum'))
    return ['Semua', ...Array.from(moduls)]
  }, [data])

  // Filter and Sort Data
  const filteredData = useMemo(() => {
    let result = data

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(student => {
        const idPeserta = (student.id_peserta || '').toLowerCase()
        const instansi = (student.instansi || '').toLowerCase()
        const nama = (student.nama || '').toLowerCase()
        const modul = (student.modul || '').toLowerCase()
        const catatan = (student.catatan_instruktur || '').toLowerCase()
        return (
          nama.includes(q) || 
          idPeserta.includes(q) ||
          instansi.includes(q) ||
          modul.includes(q) ||
          catatan.includes(q)
        )
      })
    }

    if (filterModul !== 'Semua') {
      result = result.filter(student => (student.modul || 'Umum') === filterModul)
    }

    if (filterStatus === 'Disetujui') {
      result = result.filter(student => student.status_approval === 'Disetujui')
    } else if (filterStatus === 'Tidak Disetujui') {
      result = result.filter(student => student.status_approval === 'Tidak Disetujui')
    } else if (filterStatus === 'Sedang Di Tinjau Instruktur') {
      result = result.filter(student => !student.status_approval || student.status_approval === 'Sedang Di Tinjau Instruktur')
    }

    // Sorting
    result = [...result]
    if (sortBy === 'terbaru') {
      result.sort((a, b) => {
        const timeA = new Date(`${a.tanggal}T${a.waktu}`).getTime()
        const timeB = new Date(`${b.tanggal}T${b.waktu}`).getTime()
        return timeB - timeA
      })
    } else if (sortBy === 'terlama') {
      result.sort((a, b) => {
        const timeA = new Date(`${a.tanggal}T${a.waktu}`).getTime()
        const timeB = new Date(`${b.tanggal}T${b.waktu}`).getTime()
        return timeA - timeB
      })
    } else if (sortBy === 'nama_asc') {
      result.sort((a, b) => a.nama.localeCompare(b.nama))
    } else if (sortBy === 'nama_desc') {
      result.sort((a, b) => b.nama.localeCompare(a.nama))
    }

    return result
  }, [data, searchQuery, filterModul, filterStatus, sortBy])

  // Pagination State (15 Data Per Halaman)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Reset ke halaman 1 saat filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterModul, filterStatus, sortBy])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredData.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredData, currentPage])

  // Statistics
  const totalStudents = data.length
  const passedStudents = data.filter(s => s.status_approval === 'Disetujui').length
  const pendingStudents = data.filter(s => !s.status_approval || s.status_approval === 'Sedang Di Tinjau Instruktur').length
  const failedStudents = data.filter(s => s.status_approval === 'Tidak Disetujui').length
  const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0

  // Export Handlers (Excel & PDF Resmi)
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      setToast({ message: "Tidak ada data untuk diekspor", type: 'error' })
      return
    }
    try {
      exportToExcel(filteredData, {
        filterModul,
        filterStatus,
        searchQuery,
      })
      setToast({ message: "Laporan Excel (.xlsx) resmi berhasil diunduh!", type: 'success' })
      setIsExportMenuOpen(false)
    } catch (err: any) {
      setToast({ message: err.message || "Gagal mengekspor data ke Excel", type: 'error' })
    }
  }

  const handleExportPDF = () => {
    if (filteredData.length === 0) {
      setToast({ message: "Tidak ada data untuk diekspor", type: 'error' })
      return
    }
    try {
      exportToPDF(filteredData, {
        filterModul,
        filterStatus,
        searchQuery,
      })
      setToast({ message: "Dokumen PDF resmi BDTBT ESDM siap cetak berhasil diunduh!", type: 'success' })
      setIsExportMenuOpen(false)
    } catch (err: any) {
      setToast({ message: err.message || "Gagal mengekspor data ke PDF", type: 'error' })
    }
  }

  // Handle Save (Create/Update) - Bug Free!
  const handleSave = async (formData: Partial<StudentData>) => {
    try {
      const res = await saveStudentExamRecord(editingStudent ? editingStudent.id : null, formData)
      
      if (res.error) {
        throw new Error(res.error)
      }

      if (res.data) {
        if (editingStudent) {
          setData(prev => prev.map(d => d.id === editingStudent.id ? res.data! : d))
          setToast({ message: "Data evaluasi peserta berhasil diperbarui!", type: 'success' })
        } else {
          setData(prev => [res.data!, ...prev])
          setToast({ message: "Data peserta berhasil ditambahkan!", type: 'success' })
        }
      }
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menyimpan data", type: 'error' })
      throw err
    }
  }

  // Handle Review Success
  const handleReviewSuccess = (updatedStudent: StudentData) => {
    setData(prev => prev.map(d => d.id === updatedStudent.id ? updatedStudent : d))
    
    // Also update selectedParticipant records if participant modal is open
    if (selectedParticipant) {
      setSelectedParticipant(prev => prev ? {
        ...prev,
        records: prev.records.map(r => r.id === updatedStudent.id ? updatedStudent : r)
      } : null)
    }

    setToast({
      message: `Keputusan berhasil disimpan: ${updatedStudent.status_approval}!`,
      type: 'success'
    })
  }

  // Handle Delete
  const handleDelete = async () => {
    if (!deletingStudent) return
    
    setIsDeleting(true)
    try {
      const { error: deleteError } = await supabase
        .from('hasil_ujian')
        .delete()
        .eq('id', deletingStudent.id)
        
      if (deleteError) throw new Error(deleteError.message)
      
      setData(prev => prev.filter(d => d.id !== deletingStudent.id))
      setIsDeleteModalOpen(false)
      setToast({ message: "Data berhasil dihapus!", type: 'success' })
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menghapus data", type: 'error' })
    } finally {
      setIsDeleting(false)
      setDeletingStudent(null)
    }
  }

  // Modal open helpers
  const openEditModal = (student: StudentData) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingStudent(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (student: StudentData) => {
    setDeletingStudent(student)
    setIsDeleteModalOpen(true)
  }

  const openCertificateModal = (student: StudentData) => {
    setCertificateStudent(student)
    setIsCertificateModalOpen(true)
  }

  const openReviewModal = (student: StudentData) => {
    setReviewStudent(student)
    setIsReviewModalOpen(true)
  }

  const openDelayModal = (student: StudentData) => {
    setDelayStudent(student)
    setIsDelayModalOpen(true)
  }

  const openParticipantCards = (student: StudentData) => {
    setSelectedParticipant({
      nip: student.id_peserta || 'NO-REG',
      name: student.nama,
      records: [student]
    })
    setIsParticipantCardsModalOpen(true)
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SummaryCards 
        totalStudents={totalStudents} 
        passedStudents={passedStudents} 
        pendingStudents={pendingStudents}
        failedStudents={failedStudents} 
        passRate={passRate}
      />

      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-end space-y-4 lg:space-y-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Data Evaluasi Ujian Diklat
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola, periksa kartu evaluasi, tinjau diagram delay, dan berikan keputusan kelulusan peserta diklat BDTBT ESDM.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap sm:flex-nowrap">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64 sm:flex-initial min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari Nama / NIP / Modul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] dark:focus:ring-[#FFF000] focus:border-[#EAB308] outline-none transition-all shadow-sm text-sm"
            />
          </div>
          
          {/* Refresh Button */}
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="h-10 w-10 flex-shrink-0 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Export Dropdown Menu (Excel & PDF) */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} 
              disabled={filteredData.length === 0}
              className="h-10 px-3.5 flex-shrink-0 whitespace-nowrap border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              title="Ekspor Data ke Excel (.xlsx) atau PDF"
            >
              <Download className="h-4 w-4 text-amber-500" />
              <span>Ekspor</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <>
                {/* Backdrop to close popover */}
                <div 
                  className="fixed inset-0 z-[110]" 
                  onClick={() => setIsExportMenuOpen(false)} 
                />

                {/* Dropdown Popover */}
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 p-2 z-[120] animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 mb-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Pilih Format Ekspor
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {filteredData.length} Laporan siap diunduh
                    </p>
                  </div>

                  {/* Option 1: Excel (.xlsx) */}
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Ekspor Excel (.xlsx)
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        Spreadsheet rapi, 11 rincian SOP & status evaluasi
                      </p>
                    </div>
                  </button>

                  {/* Option 2: PDF (.pdf) */}
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors group cursor-pointer mt-1"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                        Ekspor PDF Resmi (.pdf)
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        Format landscape siap cetak lengkap Kop & TTD BDTBT
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tambah Data Button */}
          <button 
            onClick={openCreateModal}
            className="h-10 px-4 flex-shrink-0 whitespace-nowrap bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/30 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Data
          </button>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 mb-6 flex flex-wrap gap-4 items-center justify-between transition-colors">
        <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1 min-w-[140px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Urutkan</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D2327]"
          >
            <option value="terbaru">Waktu: Terbaru</option>
            <option value="terlama">Waktu: Terlama</option>
            <option value="nama_asc">Nama: A - Z</option>
            <option value="nama_desc">Nama: Z - A</option>
          </select>
        </div>

        <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1 min-w-[140px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Filter Modul</label>
          <select 
            value={filterModul} 
            onChange={(e) => setFilterModul(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D2327]"
          >
            {modulOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex flex-col space-y-1 w-full sm:w-auto flex-1 min-w-[140px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Filter Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1D2327]"
          >
            <option value="Semua">Semua Status</option>
            <option value="Sedang Di Tinjau Instruktur">Sedang Ditinjau Instruktur</option>
            <option value="Disetujui">Disetujui (Kompeten)</option>
            <option value="Tidak Disetujui">Tidak Disetujui (Belum Kompeten)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="h-10 w-10 text-[#EAB308] dark:text-[#FFF000] animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Berkomunikasi dengan Supabase...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Akses Supabase Ditolak / Gagal</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-mono break-words">
              {error}
            </p>
            <button onClick={fetchData} className="mt-6 px-6 py-2 bg-[#1D2327] text-[#FFF000] rounded-xl shadow-sm font-bold hover:bg-black transition-colors border border-yellow-500/30 cursor-pointer">
              Muat Ulang Data
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto min-h-[420px]">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-gray-50/90 dark:bg-slate-800/90 border-b border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5 whitespace-nowrap">Peserta & Instansi</th>
                  <th className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">Modul Diklat</th>
                  <th className="px-4 py-3.5 whitespace-nowrap hidden sm:table-cell">Tanggal & Waktu</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Prosedur (OK)</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Status Kelulusan</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50 text-sm">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <Search className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">Data tidak ditemukan</p>
                        <p className="text-sm">Tidak ada data peserta yang cocok dengan kriteria pencarian.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((student) => {
                    const completedSteps = getCompletedSteps(student)
                    const approval = student.status_approval || 'Sedang Di Tinjau Instruktur'
                    const isApproved = approval === 'Disetujui'
                    const isRejected = approval === 'Tidak Disetujui'
                    const isPending = !isApproved && !isRejected

                    const displayId = student.id_peserta || '-'
                    const displayInstansi = student.instansi || 'BDTBT ESDM'
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors group">
                        
                        {/* 1. Peserta & Instansi */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openParticipantCards(student)}
                            className="flex flex-col text-left group/btn cursor-pointer focus:outline-none"
                            title="Klik untuk membuka kartu evaluasi per NIP ini"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-500 dark:text-[#FFF000] group-hover/btn:underline transition-colors text-sm">
                                {student.nama}
                              </span>
                              <User className="w-3.5 h-3.5 text-yellow-500 opacity-80" />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="font-mono font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40 text-[11px]">
                                {displayId}
                              </span>
                              <span>•</span>
                              <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[180px]">
                                {displayInstansi}
                              </span>
                            </div>
                            {student.catatan_instruktur && (
                              <p className="text-[11px] text-gray-400 italic mt-0.5 truncate max-w-[220px]">
                                💬 &ldquo;{student.catatan_instruktur}&rdquo;
                              </p>
                            )}
                          </button>
                        </td>

                        {/* 2. Modul Diklat */}
                        <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70 shadow-2xs whitespace-nowrap">
                            {student.modul || 'Tambang Bawah Tanah'}
                          </span>
                          {student.mode && (
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5 ml-1">
                              Mode: {student.mode}
                            </p>
                          )}
                        </td>

                        {/* 3. Tanggal & Waktu */}
                        <td className="px-4 py-3.5 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{student.tanggal}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{student.waktu} WIB</span>
                          </div>
                        </td>

                        {/* 4. Prosedur (OK) */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-[#FFF000] border border-amber-200 dark:border-amber-800 shadow-2xs">
                            {completedSteps} / 11 OK
                          </span>
                        </td>

                        {/* 5. Status Kelulusan (Clean Non-Duplicate Badge) */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${
                              isApproved 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/60' 
                                : isRejected
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800/60'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/60'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            ) : isRejected ? (
                              <AlertCircle className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            )}
                            {isApproved ? 'Kompeten' : isRejected ? 'Belum Kompeten' : 'Sedang Ditinjau'}
                          </span>
                        </td>

                        {/* 6. Aksi (1 Tombol Utama 'Tinjau' + Edit/Delete) */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            
                            {/* Tombol Utama: Tinjau */}
                            <button
                              type="button"
                              onClick={() => openReviewModal(student)}
                              className="inline-flex items-center px-3 py-1.5 bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/40 rounded-xl text-xs font-bold transition-all shadow-sm hover:-translate-y-0.5 cursor-pointer"
                              title="Tinjau Hasil Evaluasi, Diagram Delay & Keputusan"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 mr-1 text-[#FFF000]" />
                              <span>Tinjau</span>
                            </button>

                            {/* Edit Data */}
                            <button 
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="w-8 h-8 flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-all border border-blue-200 dark:border-blue-800 shadow-2xs cursor-pointer"
                              title="Edit Data Peserta"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Hapus Data */}
                            <button 
                              type="button"
                              onClick={() => openDeleteModal(student)}
                              className="w-8 h-8 flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-all border border-rose-200 dark:border-rose-800 shadow-2xs cursor-pointer"
                              title="Hapus Data Peserta"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* Pagination Controls */}
          {filteredData.length > 0 && (
            <div className="px-5 py-3.5 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/50">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Menampilkan <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}</span> dari <span className="font-bold text-gray-900 dark:text-white">{filteredData.length}</span> data evaluasi
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                    Sebelumnya
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 || 
                        pageNum === totalPages || 
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-[#1D2327] text-[#FFF000] border border-yellow-500/40 shadow-sm dark:bg-yellow-400 dark:text-black'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      } else if (
                        pageNum === currentPage - 2 || 
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} className="text-gray-400 px-1 text-xs">...</span>
                      }
                      return null
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center shadow-2xs"
                  >
                    Selanjutnya
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <StudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingStudent}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          studentName={deletingStudent?.nama || ''}
          isDeleting={isDeleting}
        />
      )}

      {/* Certificate Modal */}
      {isCertificateModalOpen && (
        <CertificateModal
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
          student={certificateStudent}
        />
      )}

      {/* Review & Approval Modal (Disetujui / Tidak Disetujui & Reason) */}
      {isReviewModalOpen && reviewStudent && (
        <ReviewApprovalModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          student={reviewStudent}
          onSuccess={handleReviewSuccess}
          onViewDelay={(s) => {
            setDelayStudent(s)
            setIsDelayModalOpen(true)
          }}
          onViewCards={openParticipantCards}
          onPrintCertificate={openCertificateModal}
        />
      )}

      {/* Delay Diagram Modal */}
      {isDelayModalOpen && delayStudent && (
        <DelayDiagramModal
          isOpen={isDelayModalOpen}
          onClose={() => setIsDelayModalOpen(false)}
          title={`${delayStudent.modul || 'Simulasi Peledakan'} (${delayStudent.nama} - ${delayStudent.tanggal})`}
          delayData={delayStudent.delay_data}
        />
      )}

      {/* Participant Cards Modal (Per NIP View like Portal Peserta) */}
      {isParticipantCardsModalOpen && selectedParticipant && (
        <ParticipantCardsModal
          isOpen={isParticipantCardsModalOpen}
          onClose={() => setIsParticipantCardsModalOpen(false)}
          nip={selectedParticipant.nip}
          participantName={selectedParticipant.name}
          records={selectedParticipant.records}
          passingThreshold={passingThreshold}
          onViewDelay={(s) => {
            setDelayStudent(s)
            setIsDelayModalOpen(true)
          }}
          onViewCertificate={openCertificateModal}
          onOpenReview={(s) => {
            setIsParticipantCardsModalOpen(false)
            openReviewModal(s)
          }}
        />
      )}
    </>
  )
}
