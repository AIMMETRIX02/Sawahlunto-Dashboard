'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { HardHat, RefreshCw, Home, AlertOctagon } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('System Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12 transition-colors duration-300 font-sans">
      <div className="max-w-lg w-full text-center bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-4 bg-[#1D2327] rounded-2xl shadow-xl border-2 border-red-500">
              <HardHat className="h-12 w-12 text-red-500" />
            </div>
            <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full border-2 border-white dark:border-slate-900 shadow">
              500
            </span>
          </div>
        </div>

        {/* Status Error Code */}
        <h1 className="text-6xl font-black text-red-600 dark:text-red-500 tracking-widest font-mono mb-2">
          500
        </h1>
        
        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
          Terjadi Kesalahan Sistem
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Maaf, terjadi kesalahan tak terduga pada server saat memproses permintaan Anda di <span className="font-semibold text-gray-900 dark:text-white">BDTBT ESDM</span>.
        </p>

        {error?.message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs font-mono text-red-700 dark:text-red-400 text-left overflow-x-auto">
            <p className="font-bold mb-1">Rincian Pesan Error:</p>
            <code>{error.message}</code>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-yellow-500/30 rounded-xl shadow-lg text-sm font-bold text-[#FFF000] bg-[#1D2327] hover:bg-black transition-colors uppercase tracking-wider"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
          
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors uppercase tracking-wider"
          >
            <Home className="w-4 h-4 mr-2" />
            Ke Beranda
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-center text-xs text-gray-400">
          <AlertOctagon className="w-4 h-4 mr-1 text-red-500" />
          <span>HTTP 500 INTERNAL SERVER ERROR • BDTBT ESDM</span>
        </div>
      </div>
    </div>
  )
}
