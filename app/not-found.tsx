'use client'

import Link from 'next/link'
import { HardHat, Home, ArrowLeft, ShieldAlert } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12 transition-colors duration-300 font-sans">
      <div className="max-w-lg w-full text-center bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
        
        {/* Header Icon & Status Code Badge */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-4 bg-[#1D2327] rounded-2xl shadow-xl border-2 border-[#FFF000]">
              <HardHat className="h-12 w-12 text-[#FFF000]" />
            </div>
            <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full border-2 border-white dark:border-slate-900 shadow">
              404
            </span>
          </div>
        </div>

        {/* Status Error Code */}
        <h1 className="text-6xl font-black text-[#1D2327] dark:text-white tracking-widest font-mono mb-2">
          404
        </h1>
        
        {/* Title & Description */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          Maaf, halaman yang Anda tuju tidak tersedia atau telah dipindahkan di <span className="font-semibold text-gray-900 dark:text-white">Portal Balai Diklat Tambang Bawah Tanah ESDM</span>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-yellow-500/30 rounded-xl shadow-lg text-sm font-bold text-[#FFF000] bg-[#1D2327] hover:bg-black transition-colors uppercase tracking-wider"
          >
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Halaman Sebelumnya
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-center text-xs text-gray-400">
          <ShieldAlert className="w-4 h-4 mr-1 text-amber-500" />
          <span>HTTP 404 NOT FOUND • BDTBT KEMENTERIAN ESDM</span>
        </div>
      </div>
    </div>
  )
}
