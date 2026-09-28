'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, Plus, Edit2, Trash2, Search, Download, AlertCircle, CheckCircle, Award, X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { SummaryCards } from './SummaryCards'

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

export interface StudentData {
  id: string
  nama: string
  id_peserta: string
  instansi?: string
  modul: string
  mode?: string
  delay_image?: string
  delay_data?: any
  tanggal: string
  waktu: string
  benar: number
  salah: number
  safety?: boolean
  scaling?: boolean
  primer?: boolean
  tie_in?: boolean
  cord_cable?: boolean
  charging?: boolean
  blasting_cap?: boolean
  cap_line?: boolean
  ignite_blastbox?: boolean
  blasting?: boolean
  motor_fan?: boolean
}

export const getCompletedSteps = (student: Partial<StudentData>) => {
  return [
    student.safety,
    student.scaling,
    student.primer,
    student.tie_in,
    student.cord_cable,
    student.charging,
    student.blasting_cap,
    student.cap_line,
    student.ignite_blastbox,
    student.blasting,
    student.motor_fan,
  ].filter(Boolean).length
}

// Custom Toast Component for simple notification
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 flex items-center p-4 mb-4 text-gray-500 dark:text-gray-300 bg-white dark:bg-slate-800 rounded-xl shadow-xl border-l-4 ${type === 'success' ? 'border-green-500' : 'border-red-500'} z-[100] animate-in slide-in-from-bottom-5`}>
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
        {type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>
      <div className="ml-3 text-sm font-medium pr-6">{message}</div>
      <button onClick={onClose} className="ml-auto -mx-1.5 -my-1.5 bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 inline-flex items-center justify-center h-8 w-8">
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
  const [sortBy, setSortBy] = useState('terbaru') // 'terbaru', 'terlama', 'nama_asc', 'nama_desc'
  const [filterModul, setFilterModul] = useState('Semua')
  const [filterStatus, setFilterStatus] = useState('Semua')

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<StudentData | null>(null)
  const [certificateStudent, setCertificateStudent] = useState<StudentData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false)
  const [isSavingThreshold, setIsSavingThreshold] = useState(false)

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
      
      setData(supabaseData as StudentData[] || [])
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
      result = result.filter(student => {
        const idPeserta = student.id_peserta || ''
        const instansi = student.instansi || ''
        return (
          student.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
          idPeserta.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.modul && student.modul.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      })
    }

    if (filterModul !== 'Semua') {
      result = result.filter(student => (student.modul || 'Umum') === filterModul)
    }

    if (filterStatus === 'Lulus') {
      result = result.filter(student => getCompletedSteps(student) >= passingThreshold)
    } else if (filterStatus === 'Tidak Lulus') {
      result = result.filter(student => getCompletedSteps(student) < passingThreshold)
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
  }, [data, searchQuery, filterModul, filterStatus, sortBy, passingThreshold])

  // Calculate Statistics
  const totalStudents = data.length
  const passedStudents = data.filter(s => getCompletedSteps(s) >= passingThreshold).length
  const failedStudents = totalStudents - passedStudents
  const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0

  // Export CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      setToast({ message: "Tidak ada data untuk diekspor", type: 'error' })
      return
    }

    const headers = ['ID', 'Nama', 'ID Peserta', 'Instansi', 'Modul', 'Tanggal', 'Waktu', 'Prosedur OK', 'Status', 'Safety equipment', 'Scaling', 'Primer', 'Tie In', 'Cord/Cable', 'Charging', 'Blasting Cap', 'Cap Line', 'Ignite Blastbox', 'Blasting', 'Motor Fan']
    const csvContent = [
      headers.join(','),
      ...filteredData.map(s => {
        const okCount = getCompletedSteps(s)
        return [
          s.id,
          `"${s.nama}"`,
          `"${s.id_peserta || ''}"`,
          `"${s.instansi || 'BDTBT ESDM'}"`,
          `"${s.modul || 'Umum'}"`,
          s.tanggal,
          s.waktu,
          `${okCount}/11`,
          okCount >= passingThreshold ? 'Lulus' : 'Tidak Lulus',
          s.safety ? 'Ya' : 'Tidak',
          s.scaling ? 'Ya' : 'Tidak',
          s.primer ? 'Ya' : 'Tidak',
          s.tie_in ? 'Ya' : 'Tidak',
          s.cord_cable ? 'Ya' : 'Tidak',
          s.charging ? 'Ya' : 'Tidak',
          s.blasting_cap ? 'Ya' : 'Tidak',
          s.cap_line ? 'Ya' : 'Tidak',
          s.ignite_blastbox ? 'Ya' : 'Tidak',
          s.blasting ? 'Ya' : 'Tidak',
          s.motor_fan ? 'Ya' : 'Tidak'
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_Evaluasi_Diklat_BDTBT_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setToast({ message: "Data berhasil diekspor ke CSV", type: 'success' })
  }

  // Handle Save (Create/Update)
  const handleSave = async (formData: Partial<StudentData>) => {
    try {
      const idVal = formData.id_peserta || ''
      const payload: any = {
        nama: formData.nama,
        id_peserta: idVal,
        instansi: formData.instansi || 'BDTBT ESDM',
        modul: formData.modul || 'Tambang Bawah Tanah',
        mode: formData.mode || 'Simulasi',
        delay_image: formData.delay_image || null,
        delay_data: formData.delay_data || null,
        tanggal: formData.tanggal,
        waktu: formData.waktu,
        benar: formData.benar,
        salah: formData.salah,
        safety: !!formData.safety,
        scaling: !!formData.scaling,
        primer: !!formData.primer,
        tie_in: !!formData.tie_in,
        cord_cable: !!formData.cord_cable,
        charging: !!formData.charging,
        blasting_cap: !!formData.blasting_cap,
        cap_line: !!formData.cap_line,
        ignite_blastbox: !!formData.ignite_blastbox,
        blasting: !!formData.blasting,
        motor_fan: !!formData.motor_fan,
      }

      if (editingStudent) {
        // Update
        const { error: updateError } = await supabase
          .from('hasil_ujian')
          .update(payload)
          .eq('id', editingStudent.id)
          
        if (updateError) throw new Error(updateError.message)
        
        setData(data.map(d => d.id === editingStudent.id ? { ...d, ...payload } as StudentData : d))
        setToast({ message: "Data berhasil diperbarui!", type: 'success' })
      } else {
        // Create
        const { data: inserted, error: insertError } = await supabase
          .from('hasil_ujian')
          .insert([payload])
          .select()
          
        if (insertError) throw new Error(insertError.message)
        
        if (inserted) {
          setData([inserted[0] as StudentData, ...data])
          setToast({ message: "Data peserta berhasil ditambahkan!", type: 'success' })
        }
      }
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menyimpan data", type: 'error' })
      throw err // Rethrow to keep modal open
    }
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
      
      setData(data.filter(d => d.id !== deletingStudent.id))
      setIsDeleteModalOpen(false)
      setToast({ message: "Data berhasil dihapus!", type: 'success' })
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menghapus data", type: 'error' })
    } finally {
      setIsDeleting(false)
      setDeletingStudent(null)
    }
  }

  const handleSaveThreshold = async () => {
    setIsSavingThreshold(true)
    try {
      const numVal = Number(passingThreshold) || 35
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          id: 1, 
          passing_threshold: numVal,
          updated_at: new Date().toISOString()
        })
        
      if (error) throw new Error(error.message)
      
      setPassingThreshold(numVal)
      setToast({ message: "Standar kelulusan berhasil diperbarui di database!", type: 'success' })
      setIsThresholdModalOpen(false)
    } catch (err: any) {
      if (err.message && err.message.includes('row-level security')) {
        setToast({ message: "Akses Ditolak (RLS): Matikan RLS di Supabase pada tabel 'system_settings' dengan: ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;", type: 'error' })
      } else {
        setToast({ message: err.message || "Gagal menyimpan standar kelulusan", type: 'error' })
      }
    } finally {
      setIsSavingThreshold(false)
    }
  }

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

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SummaryCards 
        totalStudents={totalStudents} 
        passedStudents={passedStudents} 
        failedStudents={failedStudents} 
        passRate={passRate}
      />

      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-end space-y-4 lg:space-y-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            Data Evaluasi Ujian Diklat
            <button 
              onClick={() => setIsThresholdModalOpen(true)}
              className="text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 w-fit hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1 cursor-pointer"
              title="Klik untuk ubah standar kelulusan prosedur"
            >
              Standar Lulus: ≥ {passingThreshold}/11 Prosedur <Edit2 className="w-3 h-3 ml-1" />
            </button>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola dan pantau hasil evaluasi ujian diklat pertambangan BDTBT ESDM secara real-time.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari Nama / NIP / No Reg..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] dark:focus:ring-[#FFF000] focus:border-[#EAB308] outline-none transition-all shadow-sm text-sm"
            />
          </div>
          
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center"
            title="Segarkan Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={exportToCSV} 
            disabled={filteredData.length === 0}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          
          <button 
            onClick={openCreateModal}
            className="bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Data
          </button>
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="mb-6 flex flex-wrap gap-3 p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
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
            <option value="Lulus">Lulus / Kompeten</option>
            <option value="Tidak Lulus">Belum Kompeten</option>
          </select>
        </div>
      </div>

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
            <button onClick={fetchData} className="mt-6 px-6 py-2 bg-[#1D2327] text-[#FFF000] rounded-xl shadow-sm font-bold hover:bg-black transition-colors border border-yellow-500/30">
              Muat Ulang Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-gray-50/90 dark:bg-slate-800/90 border-b border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-4 whitespace-nowrap">Peserta & Instansi</th>
                  <th className="px-4 py-4 whitespace-nowrap hidden md:table-cell">Modul Diklat</th>
                  <th className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">Tanggal & Waktu</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Prosedur (OK)</th>
                  <th className="px-4 py-4 text-center whitespace-nowrap">Status</th>
                  <th className="px-5 py-4 text-center whitespace-nowrap w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                        <Search className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">Data tidak ditemukan</p>
                        <p className="text-sm">Tidak ada data peserta yang cocok dengan pencarian Anda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((student) => {
                    const completedSteps = getCompletedSteps(student);
                    const isPassed = completedSteps >= passingThreshold;
                    const displayId = student.id_peserta || '-';
                    const displayInstansi = student.instansi || 'BDTBT ESDM';
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                        {/* 1. Peserta & Instansi */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-[#FFF000] transition-colors text-sm">
                              {student.nama}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className="font-mono font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40 text-[11px]">
                                {displayId}
                              </span>
                              <span>•</span>
                              <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[200px]">
                                {displayInstansi}
                              </span>
                            </div>
                            <div className="md:hidden mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 w-fit px-2 py-0.5 rounded">
                              {student.modul || 'Tambang Bawah Tanah'}
                            </div>
                            <div className="sm:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {student.tanggal} • {student.waktu}
                            </div>
                          </div>
                        </td>

                        {/* 2. Modul Diklat */}
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-[#FFF000] border border-amber-200 dark:border-amber-800">
                            {student.modul || 'Tambang Bawah Tanah'}
                          </span>
                        </td>

                        {/* 3. Tanggal & Waktu */}
                        <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{student.tanggal}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{student.waktu} WIB</span>
                          </div>
                        </td>

                        {/* 4. Prosedur (OK) */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-[#FFF000] border border-amber-200 dark:border-amber-800 shadow-2xs">
                            {completedSteps} / 11 OK
                          </span>
                        </td>

                        {/* 5. Status */}
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${
                            isPassed 
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' 
                              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                          }`}>
                            {isPassed ? 'Kompeten' : 'Belum Kompeten'}
                          </span>
                        </td>

                        {/* 6. Aksi (Rapi & Sejajar) */}
                        <td className="px-5 py-4 text-center whitespace-nowrap w-36">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Certificate Slot */}
                            {isPassed ? (
                              <button 
                                onClick={() => openCertificateModal(student)}
                                className="w-8 h-8 flex items-center justify-center text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl transition-all border border-amber-200 dark:border-amber-800 shadow-xs"
                                title="Cetak Sertifikat ESDM"
                              >
                                <Award className="h-4 w-4" />
                              </button>
                            ) : (
                              <div className="w-8 h-8" />
                            )}

                            {/* Edit Button */}
                            <button 
                              onClick={() => openEditModal(student)}
                              className="w-8 h-8 flex items-center justify-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-all border border-blue-200 dark:border-blue-800 shadow-xs"
                              title="Edit Data Peserta"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {/* Delete Button */}
                            <button 
                              onClick={() => openDeleteModal(student)}
                              className="w-8 h-8 flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-all border border-rose-200 dark:border-rose-800 shadow-xs"
                              title="Hapus Data Peserta"
                            >
                              <Trash2 className="h-4 w-4" />
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
        )}
        
        {!loading && !error && (
          <div className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{filteredData.length}</span> data
            </span>
            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-colors cursor-not-allowed opacity-50">
                Sebelumnya
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-colors cursor-not-allowed opacity-50">
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <StudentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingStudent}
      />

      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        studentName={deletingStudent?.nama || ''}
        isDeleting={isDeleting}
      />

      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        student={certificateStudent}
      />

      {isThresholdModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ubah Standar Kelulusan Prosedur Diklat</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Tentukan batas minimum prosedur peledakan yang harus dipenuhi (1 - 11 Prosedur) agar peserta dinyatakan Kompeten / Lulus.
            </p>
            <input 
              type="number" 
              min="1"
              max="11"
              value={passingThreshold}
              onChange={(e) => setPassingThreshold(parseInt(e.target.value) || 0)}
              className="w-full text-center text-3xl font-bold py-3 px-4 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none mb-6 text-gray-900 dark:text-white"
            />
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsThresholdModalOpen(false)}
                className="px-4 py-2 w-full text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 font-medium transition-colors"
                disabled={isSavingThreshold}
              >
                Batal
              </button>
              <button
                onClick={handleSaveThreshold}
                disabled={isSavingThreshold}
                className="px-4 py-2 w-full text-[#FFF000] bg-[#1D2327] hover:bg-black border border-yellow-500/30 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
              >
                {isSavingThreshold ? <Loader2 className="w-5 h-5 animate-spin text-[#FFF000]" /> : "Simpan Standar Baru"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
