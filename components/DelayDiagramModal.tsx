'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const DelayDiagramUI = dynamic(() => import('./DelayDiagramUI').then(mod => mod.DelayDiagramUI), {
  loading: () => (
    <div className="p-8 text-center text-gray-400 font-mono">
      <Loader2 className="w-6 h-6 mx-auto mb-2 text-yellow-400 animate-spin" />
      Memuat Diagram Delay Realtime...
    </div>
  ),
  ssr: false,
})

interface DelayDiagramModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  delayData?: any
}

export function DelayDiagramModal({
  isOpen,
  onClose,
  title,
  delayData,
}: DelayDiagramModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const modal = (
    <div className="fixed inset-0 z-[1450] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-yellow-500/40">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1D2327] border-b border-yellow-500/30">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center">
              <Eye className="w-5 h-5 mr-2 text-[#FFF000]" />
              Visualisasi Diagram Delay Peledakan (Realtime JSON Data)
            </h3>
            <p className="text-xs text-[#FFF000] font-medium">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body: Render Interactive UI from delay_data JSONB */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center justify-center">
          <DelayDiagramUI delayData={delayData} title={title} />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#1D2327] border-t border-yellow-500/30 flex justify-between items-center text-xs text-gray-300">
          <span className="font-mono text-[#FFF000] text-[11px]">
            ⚡ BDTBT ESDM Underground Blasting System • JSONB Matrix Data
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
