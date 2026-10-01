'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, User, Layers, BookOpen } from 'lucide-react'
import { StudentData } from '@/lib/examHelpers'
import { ParticipantExamCard } from './ParticipantExamCard'

interface ParticipantCardsModalProps {
  isOpen: boolean
  onClose: () => void
  nip: string
  participantName: string
  records: StudentData[]
  passingThreshold?: number
  onViewDelay: (student: StudentData) => void
  onViewCertificate: (student: StudentData) => void
  onOpenReview: (student: StudentData) => void
}

export function ParticipantCardsModal({
  isOpen,
  onClose,
  nip,
  participantName,
  records,
  passingThreshold = 35,
  onViewDelay,
  onViewCertificate,
  onOpenReview,
}: ParticipantCardsModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const modal = (
    <div className="fixed inset-0 z-[1400] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className={`bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full ${records.length === 1 ? 'max-w-3xl' : 'max-w-7xl'} overflow-hidden flex flex-col max-h-[94vh] border border-gray-100 dark:border-slate-800 my-auto`}>
        
        {/* Header (ESDM Sawahlunto Style) */}
        <div className="bg-[#1D2327] px-6 py-5 sm:px-8 border-b-4 border-[#FFF000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-black/40 border border-yellow-500/30 flex items-center justify-center text-[#FFF000]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-serif">{participantName}</h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#FFF000] text-black uppercase tracking-wider">
                  {records.length === 1 ? 'Detail Laporan' : `${records.length} Laporan`}
                </span>
              </div>
              <p className="text-xs text-[#FFF000] font-medium">
                Balai Diklat Tambang Bawah Tanah – ESDM Sawahlunto
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="px-3.5 py-1.5 bg-black/50 rounded-xl border border-yellow-500/30 text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">NIP / No. Registrasi</p>
              <p className="text-sm sm:text-base font-black text-[#FFF000] font-mono tracking-wider">{nip || 'TIDAK ADA'}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Cards like in Portal Peserta */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-gray-50/60 dark:bg-slate-950">
          {records.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-800">
              <BookOpen className="w-16 h-16 text-amber-500/60 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Belum Ada Laporan Ujian Untuk NIP Ini
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Peserta dengan nomor registrasi <strong>{nip}</strong> belum memiliki riwayat evaluasi simulasi peledakan.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                <span>
                  Pratinjau kartu evaluasi simulasi untuk <strong>{participantName}</strong> ({nip}):
                </span>
                <span className="font-semibold text-amber-600 dark:text-yellow-400">
                  Tampilan Persis Portal Peserta
                </span>
              </div>

              <div className={`grid ${records.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 xl:grid-cols-2'} gap-6 items-start`}>
                {records.map((item) => (
                  <ParticipantExamCard
                    key={item.id}
                    student={item}
                    passingThreshold={passingThreshold}
                    onViewDelay={onViewDelay}
                    onViewCertificate={onViewCertificate}
                    isAdminView={true}
                    onOpenReview={onOpenReview}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#1D2327] border-t border-yellow-500/30 flex justify-between items-center text-xs text-gray-300">
          <span className="font-mono text-[#FFF000] text-xs">
            Admin Preview • Kartu Peserta NIP {nip}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#FFF000] text-[#1D2327] rounded-xl font-extrabold uppercase tracking-wider hover:bg-yellow-400 transition-colors shadow-md cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
