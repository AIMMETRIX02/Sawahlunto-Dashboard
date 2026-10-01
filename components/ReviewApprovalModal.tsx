'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Loader2,
  FileCheck2,
  FileX2,
  MessageSquare,
  User,
  Award,
  ShieldCheck
} from 'lucide-react'
import { StudentData, EVALUATION_FIELDS, getCompletedSteps, updateExamApproval } from '@/lib/examHelpers'

interface ReviewApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  student: StudentData | null
  onSuccess: (updatedStudent: StudentData) => void
  onViewDelay?: (student: StudentData) => void
  onViewCards?: (student: StudentData) => void
  onPrintCertificate?: (student: StudentData) => void
}

export function ReviewApprovalModal({
  isOpen,
  onClose,
  student,
  onSuccess,
  onViewDelay,
  onViewCards,
  onPrintCertificate,
}: ReviewApprovalModalProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'Disetujui' | 'Tidak Disetujui' | 'Sedang Di Tinjau Instruktur'>('Disetujui')
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (student) {
      const curStatus = (student.status_approval as any) || 'Sedang Di Tinjau Instruktur'
      setSelectedStatus(
        curStatus === 'Disetujui'
          ? 'Disetujui'
          : curStatus === 'Tidak Disetujui'
          ? 'Tidak Disetujui'
          : 'Sedang Di Tinjau Instruktur'
      )
      setReason(student.catatan_instruktur || '')
      setErrorMsg(null)
    }
  }, [student, isOpen])

  if (!isOpen || !mounted || !student) return null

  const completedSteps = getCompletedSteps(student)
  const complianceRate = Math.round((completedSteps / 11) * 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg(null)

    try {
      const res = await updateExamApproval(
        student.id,
        student.delay_data,
        selectedStatus,
        reason
      )

      if (!res.success) {
        throw new Error(res.error || 'Gagal menyimpan status evaluasi')
      }

      const updated: StudentData = {
        ...student,
        status_approval: selectedStatus,
        catatan_instruktur: reason,
      }

      onSuccess(updated)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan evaluasi.')
    } finally {
      setIsSaving(false)
    }
  }

  const applyQuickReason = (text: string) => {
    setReason(text)
  }

  const modal = (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-800 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1D2327] border-b border-yellow-500/30">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center">
              <FileCheck2 className="w-5 h-5 mr-2 text-[#FFF000]" />
              Verifikasi & Evaluasi Instruktur
            </h2>
            <p className="text-xs text-[#FFF000]">Balai Diklat Tambang Bawah Tanah – ESDM</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {/* Participant Info Banner */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nama Peserta</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{student.nama}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">NIP / No. Reg</p>
                <p className="text-sm font-mono font-bold text-amber-600 dark:text-[#FFF000]">{student.id_peserta || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Tanggal & Jam: </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{student.tanggal} • {student.waktu}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Kepatuhan Prosedur: </span>
                <span className="font-bold text-amber-600 dark:text-yellow-400">{completedSteps} / 11 OK ({complianceRate}%)</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-end gap-2">
              {onViewCards && (
                <button
                  type="button"
                  onClick={() => onViewCards(student)}
                  className="inline-flex items-center px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Lihat seluruh kartu evaluasi untuk NIP ini"
                >
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  Lihat Kartu Peserta (NIP)
                </button>
              )}

              {onViewDelay && (
                <button
                  type="button"
                  onClick={() => onViewDelay(student)}
                  className="inline-flex items-center px-3 py-1.5 bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/40 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Cek visualisasi diagram delay"
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Cek Diagram Delay
                </button>
              )}

              {selectedStatus === 'Disetujui' && onPrintCertificate && (
                <button
                  type="button"
                  onClick={() => onPrintCertificate(student)}
                  className="inline-flex items-center px-3 py-1.5 bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Cetak sertifikat kelulusan ESDM"
                >
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  Cetak Sertifikat
                </button>
              )}
            </div>
          </div>

          {/* Checklist 11 Prosedur SOP Peledakan */}
          <div className="p-3.5 bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl border border-gray-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Rincian Evaluasi 11 Prosedur SOP:
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-yellow-400 bg-amber-50 dark:bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                {completedSteps} / 11 Terpenuhi
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {EVALUATION_FIELDS.map(({ key, label, icon }) => {
                const isOk = !!student[key as keyof StudentData]
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-1.5 px-2 rounded-xl border text-[10px] font-bold ${
                      isOk
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-300'
                        : 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-900/30 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <span className="truncate mr-1">{icon} {label}</span>
                    {isOk ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Keputusan Evaluasi Buttons (Disetujui / Tidak Disetujui / Sedang Ditinjau) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Pilih Keputusan Kelulusan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Option 1: Disetujui */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Disetujui')}
                className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  selectedStatus === 'Disetujui'
                    ? 'bg-green-50 dark:bg-green-950/40 border-green-500 text-green-700 dark:text-green-300 shadow-md ring-2 ring-green-500/40'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-green-300'
                }`}
              >
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <span className="text-center font-black">DISETUJUI</span>
                <span className="text-[10px] font-normal opacity-80">(Kompeten / Lulus)</span>
              </button>

              {/* Option 2: Tidak Disetujui */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Tidak Disetujui')}
                className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  selectedStatus === 'Tidak Disetujui'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 shadow-md ring-2 ring-rose-500/40'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-rose-300'
                }`}
              >
                <AlertCircle className="w-6 h-6 text-rose-500" />
                <span className="text-center font-black">TIDAK DISETUJUI</span>
                <span className="text-[10px] font-normal opacity-80">(Belum Kompeten)</span>
              </button>

              {/* Option 3: Sedang Di Tinjau */}
              <button
                type="button"
                onClick={() => setSelectedStatus('Sedang Di Tinjau Instruktur')}
                className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  selectedStatus === 'Sedang Di Tinjau Instruktur'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 shadow-md ring-2 ring-amber-500/40'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-amber-300'
                }`}
              >
                <Clock className="w-6 h-6 text-amber-500" />
                <span className="text-center font-black">SEDANG DITINJAU</span>
                <span className="text-[10px] font-normal opacity-80">(Pending / Review)</span>
              </button>
            </div>
          </div>

          {/* Reason / Catatan Instruktur Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Alasan / Catatan Evaluasi Instruktur
              </label>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">
                Akan ditampilkan pada portal peserta
              </span>
            </div>
            
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Prosedur peledakan telah sesuai standar SOP BDTBT. Rangkaian tie-in dan delay sequence aman..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-[#1D2327] dark:focus:ring-[#FFF000] focus:border-[#EAB308] outline-none text-xs sm:text-sm font-medium transition-all shadow-inner leading-relaxed"
            />

            {/* Quick Reason Templates */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] font-semibold text-gray-400">Pilihan Cepat:</span>
              <button
                type="button"
                onClick={() => applyQuickReason('Seluruh tahapan SOP peledakan telah terpenuhi dengan baik dan aman.')}
                className="text-[10px] bg-gray-100 dark:bg-slate-800 hover:bg-yellow-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 cursor-pointer"
              >
                + SOP Sangat Baik
              </button>
              <button
                type="button"
                onClick={() => applyQuickReason('Pemasangan primer dan tie-in belum sesuai urutan simulasi underground blasting.')}
                className="text-[10px] bg-gray-100 dark:bg-slate-800 hover:bg-yellow-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 cursor-pointer"
              >
                + Urutan Tie-In Salah
              </button>
              <button
                type="button"
                onClick={() => applyQuickReason('Belum memenuhi ambang batas minimal kelulusan prosedur. Harap lakukan simulasi ulang.')}
                className="text-[10px] bg-gray-100 dark:bg-slate-800 hover:bg-yellow-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 cursor-pointer"
              >
                + Perlu Simulasi Ulang
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors text-xs uppercase tracking-wider cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-[#FFF000] bg-[#1D2327] border border-yellow-500/30 rounded-xl hover:bg-black font-bold transition-all disabled:opacity-70 flex items-center shadow-lg uppercase tracking-wider text-xs cursor-pointer"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#FFF000]" /> : null}
              Simpan Keputusan & Alasan
            </button>
          </div>

        </form>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
