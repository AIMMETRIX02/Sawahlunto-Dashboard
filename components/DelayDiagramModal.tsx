'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, Loader2, Globe } from 'lucide-react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'

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
  studentId?: string
  studentName?: string
  isAdminView?: boolean
  isGlobalMode?: boolean
  onDataUpdated?: (updatedDelayData: any) => void
}

export function DelayDiagramModal({
  isOpen,
  onClose,
  title,
  delayData,
  studentId,
  studentName,
  isAdminView,
  isGlobalMode = false,
  onDataUpdated,
}: DelayDiagramModalProps) {
  const [mounted, setMounted] = useState(false)
  const [resolvedIsAdmin, setResolvedIsAdmin] = useState<boolean>(isAdminView ?? false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-detect admin/superadmin role if isAdminView is not explicitly provided
  useEffect(() => {
    if (isAdminView !== undefined) {
      setResolvedIsAdmin(isAdminView)
      return
    }

    const checkRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setResolvedIsAdmin(false)
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        const role = profile?.role
        setResolvedIsAdmin(role === 'admin' || role === 'superadmin')
      } catch (e) {
        setResolvedIsAdmin(false)
      }
    }

    checkRole()
  }, [isAdminView])

  if (!isOpen || !mounted) return null

  const modal = (
    <div className="fixed inset-0 z-[1450] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-950 rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[94vh] border border-yellow-500/40">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1D2327] border-b border-yellow-500/30">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center">
              {isGlobalMode ? (
                <>
                  <Globe className="w-5 h-5 mr-2 text-[#FFF000]" />
                  Pengaturan Standar Delay Acuan Global (Seluruh Peserta)
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2 text-[#FFF000]" />
                  Evaluasi Kesesuaian Delay Peledakan Terhadap Standar
                </>
              )}
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

        {/* Modal Body: Render Interactive UI from delay_data JSONB with dual-value comparison */}
        <div className="p-3 sm:p-6 flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center justify-start">
          <DelayDiagramUI
            delayData={delayData}
            title={title}
            studentId={studentId}
            studentName={studentName}
            isAdminView={resolvedIsAdmin}
            isGlobalMode={isGlobalMode}
            onDataUpdated={onDataUpdated}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#1D2327] border-t border-yellow-500/30 flex justify-between items-center text-xs text-gray-300">
          <span className="font-mono text-[#FFF000] text-[11px]">
            ⚡ BDTBT ESDM Underground Blasting System • Dual Comparison & Standard Matrix
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
