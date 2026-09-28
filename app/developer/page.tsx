'use client'

import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { Sparkles, Globe, ExternalLink, ArrowLeft, CheckCircle2, Award, Cpu, ShieldCheck } from 'lucide-react'

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Back navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center text-xs font-semibold text-gray-400 hover:text-yellow-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali ke Beranda
        </Link>

        {/* Hero Header */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-[#1D2327] to-slate-900 border border-yellow-500/30 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Lead Developer Profile</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
                AIMMETRIX
              </h1>
              <p className="text-sm sm:text-base text-yellow-400/90 font-medium mt-1">
                PT Anugrah Interaktif Mandiri • Immersive Tech Solutions
              </p>
              <p className="text-sm text-gray-300 mt-3 max-w-2xl leading-relaxed">
                Penyedia aplikasi simulator <em>Virtual Reality (VR)</em> dan <em>Digital Twin</em> No. 1 di Indonesia. 
                Pengembang resmi sistem Simulator Peledakan Tambang Bawah Tanah serta Dashboard LMS Terintegrasi Balai Diklat Tambang Bawah Tanah (BDTBT) Kementerian ESDM RI.
              </p>
            </div>

            <a
              href="https://www.aimmetrix.id/en"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-[#FFF000] hover:bg-yellow-400 text-black text-xs sm:text-sm font-black rounded-2xl shadow-xl transition-all flex items-center space-x-2 flex-shrink-0"
            >
              <Globe className="w-4 h-4" />
              <span>Kunjungi www.aimmetrix.id</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-2xl sm:text-4xl font-black text-yellow-400">25+</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">Klien Industri & Kampus</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-2xl sm:text-4xl font-black text-yellow-400">60+</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">Simulator Terpasang</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <p className="text-2xl sm:text-4xl font-black text-yellow-400">27+</p>
            <p className="text-xs text-gray-400 font-semibold mt-1">Proyek Aktif Nasional</p>
          </div>
        </div>

        {/* Details & Portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Kolom 1: Core Values */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center text-yellow-400">
              <Cpu className="w-4 h-4 mr-2" /> Keunggulan Teknologi
            </h3>
            
            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <p className="font-bold text-white mb-0.5">High Fidelity Graphics (Unreal Engine)</p>
                <p className="text-gray-400">Simulasi lingkungan tambang dengan pencahayaan dan fisika fotorealistis.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <p className="font-bold text-white mb-0.5">Virtual Physics & Realtime Telemetry</p>
                <p className="text-gray-400">Kalkulasi delay milidetik (ms), uji ohm kabel, dan sensor gas berbahaya tanpa risiko kecelakaan fatal.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <p className="font-bold text-white mb-0.5">Integrated LMS Platform</p>
                <p className="text-gray-400">Pencatatan skor, diagram delay, dan otomatisasi penerbitan sertifikat kelulusan.</p>
              </div>
            </div>
          </div>

          {/* Kolom 2: Rekam Jejak Portofolio */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center text-yellow-400">
              <Award className="w-4 h-4 mr-2" /> Klien & Portofolio Ternama
            </h3>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">PT Freeport Indonesia:</strong> Underground Mine Blasting Simulator
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">PT Ceria Metalindo Prima:</strong> Smelter Operator VR Training
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">PT Ceria JasaTambang Pratama:</strong> Dump Truck Simulator
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Kemenperin SMAK Makassar:</strong> Simulator Spektrofotometer VR
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Universitas Hasanuddin (UNHAS):</strong> Anatomy & Medical Lab VR
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">BDTBT Kementerian ESDM:</strong> VR Blasting & Integrated LMS Portal
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
