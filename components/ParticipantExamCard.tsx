'use client'

import React from 'react'
import {
  StudentData,
  EVALUATION_FIELDS,
  getCompletedSteps,
  getTimeZoneLabel
} from '@/lib/examHelpers'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
  Eye,
  Printer,
  MessageSquare,
  FileCheck2,
  FileX2,
  Edit3
} from 'lucide-react'

interface ParticipantExamCardProps {
  student: StudentData
  passingThreshold?: number
  onViewDelay: (student: StudentData) => void
  onViewCertificate?: (student: StudentData) => void
  isAdminView?: boolean
  onOpenReview?: (student: StudentData) => void
}

export const ParticipantExamCard: React.FC<ParticipantExamCardProps> = ({
  student,
  passingThreshold = 35,
  onViewDelay,
  onViewCertificate,
  isAdminView = false,
  onOpenReview,
}) => {
  const completedSteps = getCompletedSteps(student)
  const approval = student.status_approval || 'Sedang Di Tinjau Instruktur'
  const isApproved = approval === 'Disetujui'
  const isRejected = approval === 'Tidak Disetujui'
  const isPending = !isApproved && !isRejected

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 bg-gray-50/70 dark:bg-slate-900/60 rounded-3xl p-6 border border-gray-200 dark:border-slate-800 flex flex-col justify-between h-full shadow-md hover:shadow-lg transition-all duration-200">
      
      <div>
        {/* Header Tanggal & Jam */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-5 border-b border-gray-200 dark:border-slate-700/80">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#1D2327] text-[#FFF000] text-xs font-black tracking-wider uppercase shadow-sm border border-yellow-500/30">
            📅 {student.tanggal} • ⏰ {student.waktu} {getTimeZoneLabel(student.waktu)}
          </span>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
            Zona Waktu: {getTimeZoneLabel(student.waktu)}
          </span>
        </div>

        {/* Header Modul & Mode */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#1D2327] text-[#FFF000] text-xs font-bold tracking-wider uppercase mb-2 shadow-md border border-yellow-500/30 max-w-full truncate">
            Modul: {student.modul || 'Tambang Bawah Tanah'}
          </span>
          {student.mode && (
            <div className="mt-1 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-[#FFF000] text-xs font-extrabold tracking-wider uppercase border border-amber-200 dark:border-amber-800/60 shadow-sm">
                🎮 Mode: {student.mode}
              </span>
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">Hasil Evaluasi Akhir Kompetensi</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Nama Peserta: <span className="font-semibold text-gray-900 dark:text-white">{student.nama}</span>
            {student.id_peserta && (
              <span className="ml-2 font-mono text-amber-600 dark:text-[#FFF000]">({student.id_peserta})</span>
            )}
          </p>
        </div>

        {/* Status Card & Compliance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Status Card */}
          <div
            className={`p-5 rounded-2xl flex flex-col items-center justify-center border-2 text-center transition-all ${
              isApproved
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800'
                : isRejected
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
                : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/60 shadow-inner'
            }`}
          >
            {isApproved ? (
              <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
            ) : isRejected ? (
              <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
            ) : (
              <Clock className="w-12 h-12 text-amber-500 dark:text-amber-400 mb-2 animate-pulse" />
            )}

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Status Kompetensi
            </p>

            <h3
              className={`text-lg sm:text-xl font-black uppercase tracking-wide leading-tight ${
                isApproved
                  ? 'text-green-700 dark:text-green-400'
                  : isRejected
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {isApproved
                ? 'KOMPETEN / LULUS'
                : isRejected
                ? 'BELUM KOMPETEN'
                : 'SEDANG DI TINJAU INSTRUKTUR'}
            </h3>

            <span
              className={`mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isApproved
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                  : isRejected
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                  : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isApproved
                ? '✓ Telah Disetujui'
                : isRejected
                ? '✕ Ditolak / Perlu Perbaikan'
                : '⏳ Menunggu Peninjauan'}
            </span>
          </div>

          {/* Procedure Compliance Card */}
          <div className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 flex flex-col justify-center shadow-xs">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">Rincian Kepatuhan Prosedur</p>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Prosedur Terpenuhi</span>
                <span className="text-base font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-0.5 rounded-lg shadow-sm">
                  {completedSteps} / 11
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Prosedur Belum Selesai</span>
                <span className="text-base font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-3 py-0.5 rounded-lg shadow-sm">
                  {11 - completedSteps}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 font-bold">Tingkat Kepatuhan</span>
                <span className="text-base font-black text-[#CA8A04] dark:text-[#FACC15]">
                  {Math.round((completedSteps / 11) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 11 Evaluasi Prosedur Peledakan */}
        <div className="bg-white dark:bg-slate-800/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/80 mb-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-[#CA8A04] dark:text-[#FACC15]" />
              Evaluasi Prosedur Peledakan
            </h3>
            <span className="text-[11px] font-bold text-[#CA8A04] dark:text-[#FACC15] bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              {completedSteps} / 11 OK
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EVALUATION_FIELDS.map(({ key, label, icon }) => {
              const isOk = !!student[key as keyof StudentData]
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-bold ${
                    isOk
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-300'
                      : 'bg-red-50/50 dark:bg-red-900/10 border-red-200/60 dark:border-red-900/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  <span className="flex items-center space-x-1.5 min-w-0 pr-1">
                    <span className="flex-shrink-0">{icon}</span>
                    <span className="text-[10px] sm:text-[11px] leading-tight font-bold whitespace-normal">{label}</span>
                  </span>
                  {isOk ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0 ml-1" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 ml-1" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Alasan / Catatan Instruktur Box (Visible on Participant Portal & Admin) */}
        {student.catatan_instruktur ? (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-yellow-500/40 text-left shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center text-xs font-bold text-amber-800 dark:text-[#FFF000] uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
                Catatan & Alasan Instruktur BDTBT:
              </span>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                {isApproved ? 'Catatan Kelulusan' : isRejected ? 'Catatan Perbaikan' : 'Catatan Peninjauan'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 italic font-medium leading-relaxed bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-yellow-500/20">
              &ldquo;{student.catatan_instruktur}&rdquo;
            </p>
          </div>
        ) : isPending ? (
          <div className="mb-5 p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-dashed border-gray-300 dark:border-slate-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Hasil simulasi ujian ini belum memiliki catatan evaluasi dari tim instruktur BDTBT.
            </p>
          </div>
        ) : null}

        {/* Tombol View Delay (Diagram Peledakan) */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => onViewDelay(student)}
            className="w-full py-3 px-4 bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/40 rounded-2xl font-extrabold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center justify-center space-x-2 uppercase tracking-wider cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#FFF000]" />
            <span>View Delay (Diagram Peledakan)</span>
          </button>
        </div>

        {/* Banner Sertifikat jika Disetujui */}
        {isApproved && onViewCertificate && (
          <div className="bg-white dark:bg-slate-900 border border-yellow-500/30 rounded-3xl p-6 sm:p-7 text-center flex flex-col items-center shadow-lg mb-4">
            <Printer className="w-10 h-10 text-[#CA8A04] dark:text-[#FACC15] mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Selamat! Sertifikat Diklat ESDM Anda Telah Terbit
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-md">
              Sertifikat kompetensi resmi dari Balai Diklat Tambang Bawah Tanah Kementerian ESDM telah disetujui dan diterbitkan secara digital.
            </p>
            <button
              type="button"
              onClick={() => onViewCertificate(student)}
              className="px-6 py-3 bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/40 rounded-2xl font-bold text-sm shadow-xl transition-all hover:-translate-y-1 flex items-center cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-2 text-[#FFF000]" />
              Lihat & Cetak Sertifikat ESDM
            </button>
          </div>
        )}
      </div>

      {/* Admin Review Action Section (when shown in Admin portal) */}
      {isAdminView && onOpenReview && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between bg-yellow-500/5 -mx-6 -mb-6 p-4 rounded-b-3xl">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Aksi Instruktur:
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
              isApproved ? 'bg-green-100 text-green-800' : isRejected ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {approval}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenReview(student)}
            className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#1D2327] hover:bg-black text-[#FFF000] border border-yellow-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Tinjau / Beri Keputusan
          </button>
        </div>
      )}
    </div>
  )
}
