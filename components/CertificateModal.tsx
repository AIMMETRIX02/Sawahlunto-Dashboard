'use client'

import { X, Printer } from 'lucide-react'
import { StudentData } from './StudentTable'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  student: StudentData | null
}

export function CertificateModal({ isOpen, onClose, student }: CertificateModalProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !student || !mounted) return null

  const handlePrint = () => {
    window.print()
  }

  const accuracy = Math.round((student.benar / (student.benar + student.salah)) * 100) || 0

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm print:bg-transparent print:p-0 print:items-start print:justify-start">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 print:hidden">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Printer className="w-5 h-5 mr-2 text-[#EAB308] dark:text-[#FACC15]" />
            Preview Sertifikat Kelulusan Diklat ESDM
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content - Certificate Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-gray-100 dark:bg-slate-950 print:bg-transparent print:p-0 print:overflow-visible">
          
          {/* THE CERTIFICATE */}
          <div 
            id="certificate-print-area"
            className="bg-[#fafaf9] text-slate-900 w-full max-w-[1123px] aspect-[1.414/1] relative shadow-lg mx-auto overflow-hidden flex flex-col"
            style={{ minHeight: '600px' }}
          >
            {/* Outer ESDM Dark Slate Border */}
            <div className="absolute inset-4 border-[12px] border-[#1D2327] pointer-events-none z-10 print-border"></div>
            {/* Inner ESDM Gold Border */}
            <div className="absolute inset-[24px] border-[2px] border-[#EAB308] pointer-events-none z-10 print-border"></div>
            
            {/* Decorative corners */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-[#1D2327] z-20 print-border"></div>
            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-[#1D2327] z-20 print-border"></div>
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-[#1D2327] z-20 print-border"></div>
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-[#1D2327] z-20 print-border"></div>

            <div className="relative z-30 flex-1 flex flex-col items-center justify-center p-8 sm:p-16 text-center">
              
              <div className="mb-6">
                <p className="text-sm sm:text-base font-bold tracking-[0.2em] text-[#CA8A04] uppercase mb-1">
                  KEMENTERIAN ENERGI DAN SUMBER DAYA MINERAL RI
                </p>
                <h1 className="text-2xl sm:text-4xl font-black text-[#1D2327] tracking-wider mb-2 font-serif uppercase print-text-esdm">
                  BALAI DIKLAT TAMBANG BAWAH TANAH
                </h1>
                <h2 className="text-base sm:text-xl font-bold text-slate-700 tracking-[0.15em] uppercase border-b-2 border-[#EAB308] pb-2 inline-block print-border">
                  Sertifikat Kelulusan & Kompetensi Diklat
                </h2>
              </div>

              <div className="max-w-3xl mx-auto space-y-5 mt-2">
                <p className="text-base sm:text-lg text-slate-600 font-serif italic">
                  Diberikan kepada peserta pendidikan dan pelatihan pertambangan di bawah ini atas penyelesaian evaluasi kompetensi teknis:
                </p>

                <div className="py-4">
                  <h3 className="text-2xl sm:text-4xl font-black text-[#1D2327] mb-1 font-serif uppercase print-text-esdm">{student.nama}</h3>
                  <p className="text-base sm:text-xl font-bold text-[#CA8A04] tracking-widest">
                    ID PESERTA: {student.id_peserta} • {student.instansi || 'BDTBT ESDM'}
                  </p>
                </div>

                <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">
                  Dinyatakan <span className="font-bold text-green-700 text-xl sm:text-2xl print-text-green">KOMPETEN / LULUS</span> dengan tingkat akurasi <span className="font-bold text-xl sm:text-2xl text-[#1D2327]">{accuracy}%</span> <br/>
                  <span className="text-xs sm:text-sm text-slate-500">
                    (Berhasil menyelesaikan {student.benar} soal dengan benar, dan {student.salah} catatan perbaikan)
                  </span>
                </p>
              </div>

              <div className="w-full flex justify-end mt-6 sm:mt-10 pr-4 sm:pr-12">
                <div className="text-center w-48 sm:w-64">
                  <p className="text-sm sm:text-base text-slate-600 mb-1">Sawahlunto, {student.tanggal}</p>
                  <div className="text-base font-bold text-slate-800 border-b border-slate-400 pb-12 sm:pb-14 relative">
                    {/* Ruang tanda tangan resmi BDTBT ESDM */}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-slate-800 mt-2">Kepala Balai Diklat Tambang Bawah Tanah</p>
                  <p className="text-xs sm:text-sm text-slate-500">NIP. 19780515 200312 1 002</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors mr-3"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 text-white bg-[#1D2327] hover:bg-black rounded-xl font-medium transition-colors flex items-center shadow-lg hover:shadow-xl border border-yellow-500/30"
          >
            <Printer className="w-5 h-5 mr-2 text-[#FFF000]" />
            Cetak / Download PDF
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
