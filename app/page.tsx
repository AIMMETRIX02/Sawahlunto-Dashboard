'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import {
  HardHat,
  GraduationCap,
  Download,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Eye,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Layers,
  Radio,
  Zap,
  Flame,
  Fan,
  FileText,
  Monitor,
  HelpCircle,
  ExternalLink,
  X,
  Play,
  Award
} from 'lucide-react'

interface UserSessionState {
  isLoggedIn: boolean
  role: string | null
  fullName: string | null
  email: string | null
}

const SOP_STEPS = [
  { no: '01', title: 'Safety & APD', desc: 'Pengecekan helm, kacamata pelindung, rompi, dan deteksi gas metana/CO.', icon: ShieldCheck },
  { no: '02', title: 'Scaling Loose Rock', desc: 'Pembersihan batuan renggang di atap dan dinding terowongan sebelum pengisian.', icon: Layers },
  { no: '03', title: 'Primer Assembly', desc: 'Perakitan primer dengan memasukkan detonator ke dalam booster dinamit/emulsi.', icon: Zap },
  { no: '04', title: 'Tie-In & Delay Circuit', desc: 'Penyambungan sirkuit lead line dan penyesuaian delay milidetik (ms).', icon: Zap },
  { no: '05', title: 'Cord & Cable Test', desc: 'Pemeriksaan integritas dan nilai tahanan kabel tembak menggunakan ohmmeter.', icon: Radio },
  { no: '06', title: 'ANFO Charging', desc: 'Pengisian bahan peledak butiran ke dalam lubang ledak dan tamping batuan.', icon: Flame },
  { no: '07', title: 'Blasting Cap Check', desc: 'Verifikasi penempatan tutup detonator dan sambungan shock tube nonel.', icon: Sparkles },
  { no: '08', title: 'Cap Line Hookup', desc: 'Penarikan garis tembak utama menuju shelter tempat perlindungan yang aman.', icon: ArrowRight },
  { no: '09', title: 'Blastbox Ignition', desc: 'Pemasangan safety key, pengisian muatan kondensator mesin peledak.', icon: Zap },
  { no: '10', title: 'Controlled Blasting', desc: 'Pemberian sirine peringatan, hitungan mundur, dan eksekusi peledakan aman.', icon: Flame },
  { no: '11', title: 'Exhaust Motor Fan', desc: 'Pengaktifan ventilasi penghisap untuk membersihkan asap dan gas beracun tambang.', icon: Fan }
]

const SCREENSHOTS = [
  {
    id: 'hero',
    title: 'Targeting & Inspeksi Lubang Ledak (Face Tunnel)',
    subtitle: 'First-Person VR View • Telemetri Gas CH4/CO/O2',
    desc: 'Peserta mengarahkan penanda laser pada lubang ledak (blast hole) terowongan tambang bawah tanah sembari memantau level gas metana secara interaktif.',
    image: '/images/simulator/hero.jpg',
    tag: 'VR INTERFACE'
  },
  {
    id: 'wiring',
    title: 'Pemasangan Detonator Delay & Tie-In Nonel',
    subtitle: 'SOP Rangkaian Peledakan • Timing Milidetik',
    desc: 'Simulasi penyambungan kabel detonator non-listrik (shock tube) sesuai diagram delay berurutan untuk meminimalkan getaran batuan dan mengontrol fragmentasi.',
    image: '/images/simulator/wiring.jpg',
    tag: 'RANGKAIAN DELAY'
  },
  {
    id: 'blastbox',
    title: 'Konsol Mesin Peledak (Blast Box Exploder)',
    subtitle: 'Safety Shelter • Kunci Pengaman & Uji Hambatan',
    desc: 'Pengoperasian mesin peledak di ruang pengawas. Meliputi uji sirkuit Ohm, pemutaran saklar pengisian muatan (charge), dan tombol eksekusi tembak (fire).',
    image: '/images/simulator/blastbox.jpg',
    tag: 'CONTROL UNIT'
  },
  {
    id: 'training',
    title: 'Pusat Diklat VR Tambang Bawah Tanah ESDM',
    subtitle: 'Laboratorium Simulasi • Evaluasi Kompetensi',
    desc: 'Siswa diklat BDTBT mempraktikkan skenario peledakan menggunakan perangkat VR dengan pemantauan visual telemetri fragmentasi batuan 3D secara langsung.',
    image: '/images/simulator/training.jpg',
    tag: 'LABORATORIUM ESDM'
  }
]

export default function LandingPage() {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<UserSessionState>({
    isLoggedIn: false,
    role: null,
    fullName: null,
    email: null
  })
  const [activeImage, setActiveImage] = useState<typeof SCREENSHOTS[0] | null>(null)
  const [downloadToast, setDownloadToast] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, email')
            .eq('id', session.user.id)
            .maybeSingle()

          setSessionState({
            isLoggedIn: true,
            role: profile?.role || 'peserta',
            fullName: profile?.full_name || session.user.email?.split('@')[0] || 'Peserta',
            email: session.user.email || null
          })
        }
      } catch (err) {
        console.error('Error fetching session in landing page:', err)
      }
    }

    fetchSession()
  }, [])

  const handleLmsRedirect = () => {
    if (!sessionState.isLoggedIn) {
      router.push('/login')
    } else if (sessionState.role === 'peserta' || sessionState.role === 'mahasiswa') {
      router.push('/peserta')
    } else {
      router.push('/admin')
    }
  }

  const triggerDownload = (fileName: string, label: string) => {
    setDownloadToast(`Memulai unduhan berkas: ${label}...`)
    setTimeout(() => {
      // Create a dummy download anchor for the demonstration file
      const link = document.createElement('a')
      link.href = '#'
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setDownloadToast(`Unduhan ${label} berhasil disiapkan!`)
      setTimeout(() => setDownloadToast(null), 4000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#FFF000] selection:text-black">
      <Navbar />

      {/* Download Alert Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-[150] bg-yellow-400 text-black px-5 py-3.5 rounded-2xl shadow-2xl font-bold flex items-center space-x-3 border-2 border-black animate-in slide-in-from-bottom-5">
          <Download className="w-5 h-5 animate-bounce" />
          <span className="text-sm">{downloadToast}</span>
          <button onClick={() => setDownloadToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="max-w-5xl w-full bg-slate-900 border border-yellow-500/40 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-yellow-400 text-black text-xs font-black rounded-lg">
                  {activeImage.tag}
                </span>
                <h3 className="font-bold text-white text-sm sm:text-base">{activeImage.title}</h3>
              </div>
              <button
                onClick={() => setActiveImage(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <img
                src={activeImage.image}
                alt={activeImage.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 sm:p-6 bg-slate-900/90 text-sm text-gray-300">
              <p className="font-semibold text-yellow-400 mb-1">{activeImage.subtitle}</p>
              <p>{activeImage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28 border-b border-yellow-500/20 bg-gradient-to-b from-[#14181B] via-slate-950 to-slate-950">

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-yellow-500/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/10 blur-[140px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Institution Header Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-sm">
              <HardHat className="w-4 h-4 text-yellow-400" />
              <span>BALAI DIKLAT TAMBANG BAWAH TANAH</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">KEMENTERIAN ESDM RI</span>
            </div>
            {sessionState.isLoggedIn && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-green-950/60 border border-green-500/40 text-green-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span>Masuk sebagai: <strong>{sessionState.fullName}</strong> ({sessionState.role?.toUpperCase()})</span>
              </div>
            )}
          </div>

          {/* Main Hero Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none uppercase">
              Simulator Peledakan <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500">
                Tambang Bawah Tanah
              </span> <br />
              <span className="text-2xl sm:text-4xl text-gray-300 font-extrabold tracking-normal normal-case">
                Berbasis Virtual Reality (VR)
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto font-normal">
              Platform pembelajaran simulasi 3D interaktif berstandar K3 Pertambangan Nasional.
              Mempraktikkan 11 prosedur kritis peledakan bawah tanah Sawahlunto: dari deteksi gas, perakitan primer,
              sirkuit delay milidetik, hingga pengoperasian mesin blast box tanpa risiko keselamatan fatal di dunia nyata.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleLmsRedirect}
                className="w-full sm:w-auto px-8 py-4 bg-[#FFF000] hover:bg-yellow-400 text-black font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group border-2 border-yellow-300"
              >
                <GraduationCap className="w-6 h-6 text-black group-hover:rotate-12 transition-transform" />
                <span>
                  {sessionState.isLoggedIn
                    ? (sessionState.role === 'peserta' ? 'Buka Dashboard LMS Peserta' : 'Buka Dashboard LMS Admin')
                    : 'Masuk ke Dashboard LMS'}
                </span>
                <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#download-modul"
                className="w-full sm:w-auto px-7 py-4 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-base sm:text-lg rounded-2xl border border-yellow-500/40 hover:border-yellow-400 transition-all flex items-center justify-center space-x-2.5 shadow-lg"
              >
                <Download className="w-5 h-5 text-yellow-400" />
                <span>Unduh Modul & Aplikasi VR</span>
              </a>
            </div>

            {/* Feature Pills */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-200">11 Prosedur Peledakan</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-200">Delay Milidetik (ms)</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-200">Sertifikat Kelulusan Resmi</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          GALLERY / SCREENSHOT SECTION (Tangkapan Layar Simulator)
          ========================================================================= */}
      <section id="galeri-simulator" className="py-20 bg-slate-950 border-b border-yellow-500/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 uppercase tracking-wide">
              Dokumentasi Simulasi Peledakan BDTBT
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2">
              Tangkapan layar lingkungan virtual interaktif terowongan tambang bawah tanah Sawahlunto.
            </p>

            {/* Helper callout for the user */}
          </div>

          {/* Screenshot Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SCREENSHOTS.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setActiveImage(item)}
                className="group bg-slate-900 border border-slate-800 hover:border-yellow-400/60 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/80 backdrop-blur-sm border border-yellow-400/60 text-yellow-300 text-[11px] font-bold rounded-lg">
                      {item.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2.5 py-1 bg-yellow-400 text-black text-xs font-bold rounded-lg shadow-md flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Zoom</span>
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-yellow-400 tracking-wider uppercase">{item.subtitle}</span>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-yellow-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400">
                    <span>SOP Tahap 0{index + 1}</span>
                    <span className="text-yellow-400 font-semibold group-hover:underline flex items-center">
                      Perbesar Screenshot <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          11 SOP EVALUATION PROCEDURES BREAKDOWN
          ========================================================================= */}
      <section className="py-20 bg-[#101417] border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="px-3.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
              Standar Kompetensi Diklat
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 uppercase tracking-wide">
              11 Prosedur Evaluasi Simulasi Peledakan
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2">
              Siswa wajib memenuhi prosedur K3 di bawah ini dalam simulator VR sebelum memperoleh sertifikat kelulusan kompetensi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {SOP_STEPS.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.no}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-yellow-400/40 transition-colors group flex items-start space-x-4"
                >
                  <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-all flex-shrink-0 font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-yellow-400">LANGKAH {step.no}</span>
                    </div>
                    <h4 className="text-base font-bold text-white mt-0.5">{step.title}</h4>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* =========================================================================
          HARDWARE & VR SPECS
          ========================================================================= */}
      <section className="py-16 bg-slate-950 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 to-[#1D2327] border border-yellow-500/30 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-black rounded-lg uppercase">
                Spesifikasi Perangkat
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                Kompatibilitas Perangkat Virtual Reality
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mt-2 leading-relaxed">
                Simulator Blasting Tambang Bawah Tanah BDTBT dikembangkan dengan Unreal Engine & OpenXR.
                Dapat dijalankan langsung pada headset VR mandiri (standalone) maupun tersambung ke komputer grafis tinggi.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-black/40 p-3.5 rounded-xl border border-slate-700">
                  <p className="font-bold text-yellow-400">Standalone VR Headset:</p>
                  <p className="text-gray-300 mt-1">Meta Quest 2, Quest 3, Quest Pro (Format APK langsung tanpa kabel)</p>
                </div>
                <div className="bg-black/40 p-3.5 rounded-xl border border-slate-700">
                  <p className="font-bold text-yellow-400">PC VR (SteamVR / Link Cable):</p>
                  <p className="text-gray-300 mt-1">NVIDIA RTX 2060 / GTX 1660 Ti, RAM 16GB, Intel Core i5 / Ryzen 5 ke atas</p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 text-center">
              <div className="w-28 h-28 mx-auto rounded-3xl bg-yellow-400/10 border-2 border-yellow-400 flex items-center justify-center text-yellow-400 shadow-xl shadow-yellow-500/10 mb-4">
                <Cpu className="w-14 h-14" />
              </div>
              <span className="text-xs font-mono font-bold text-gray-400 uppercase">UNREAL ENGINE 5 • OPENXR</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOWNLOAD MODULE SECTION (Tombol Download Modul VR)
          ========================================================================= */}
      <section id="download-modul" className="py-20 bg-[#0E1215] border-b border-yellow-500/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="px-3.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
              Pusat Unduhan Resmi BDTBT
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 uppercase tracking-wide">
              Unduh Modul & Paket Aplikasi VR Blasting
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2">
              Unduh buku panduan operasional SOP peledakan, dokumen materi ajar, serta paket instalasi simulator VR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Download Card 1: SOP PDF */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-yellow-400 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center font-bold mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-gray-400 uppercase">DOKUMEN RESMI BDTBT</span>
                <h4 className="text-base font-bold text-white mt-1 group-hover:text-yellow-400 transition-colors">
                  Buku Panduan & SOP Blasting VR
                </h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Standar Prosedur Operasional lengkap 11 tahapan peledakan bawah tanah, APD, dan penanganan gas berbahaya.
                </p>
                <div className="mt-4 flex items-center space-x-2 text-[11px] text-gray-400">
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">PDF • 14.5 MB</span>
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">Rev 3.2</span>
                </div>
              </div>

              <button
                onClick={() => triggerDownload('SOP_Blasting_VR_BDTBT_ESDM.pdf', 'Buku Panduan & SOP Blasting VR (PDF)')}
                className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Modul PDF</span>
              </button>
            </div>

            {/* Download Card 2: Delay Timing E-Book */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-yellow-400 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-gray-400 uppercase">MATERI TEKNIS</span>
                <h4 className="text-base font-bold text-white mt-1 group-hover:text-yellow-400 transition-colors">
                  Modul Delay Sequence & Nonel
                </h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Kalkulasi interval waktu ledak milidetik, pola rangkaian cut hole, stoping hole, dan perimeter tunnel.
                </p>
                <div className="mt-4 flex items-center space-x-2 text-[11px] text-gray-400">
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">PDF • 9.8 MB</span>
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">2024 Ed.</span>
                </div>
              </div>

              <button
                onClick={() => triggerDownload('Modul_Delay_Sequence_BDTBT.pdf', 'Modul Delay Sequence & Nonel (PDF)')}
                className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Materi PDF</span>
              </button>
            </div>

            {/* Download Card 3: Meta Quest APK */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-yellow-400 transition-all flex flex-col justify-between group border-l-4 border-l-yellow-400">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center font-bold mb-4">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-yellow-400 uppercase font-bold">STANDALONE VR BUILD</span>
                <h4 className="text-base font-bold text-white mt-1 group-hover:text-yellow-400 transition-colors">
                  Installer VR Meta Quest (APK)
                </h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Paket instalasi mandiri untuk headset Meta Quest 2 / Quest 3. Sideload langsung via SideQuest atau USB-C.
                </p>
                <div className="mt-4 flex items-center space-x-2 text-[11px] text-gray-400">
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">APK • 1.45 GB</span>
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">v2.4.0</span>
                </div>
              </div>

              <button
                onClick={() => triggerDownload('BDTBT_BlastingSimulator_v2.4_Quest.apk', 'Paket APK Meta Quest VR (1.45 GB)')}
                className="mt-6 w-full py-2.5 bg-[#FFF000] hover:bg-yellow-400 text-black text-xs font-black rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Unduh APK Meta Quest</span>
              </button>
            </div>

            {/* Download Card 4: PC VR Build */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-yellow-400 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold mb-4">
                  <Monitor className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-gray-400 uppercase">PC VR WINDOWS 64-BIT</span>
                <h4 className="text-base font-bold text-white mt-1 group-hover:text-yellow-400 transition-colors">
                  Paket Simulator PC VR (ZIP)
                </h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Build fidelitas tinggi DirectX 12 untuk laboratorium komputer diklat. Mendukung SteamVR dan link cable.
                </p>
                <div className="mt-4 flex items-center space-x-2 text-[11px] text-gray-400">
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">ZIP • 3.8 GB</span>
                  <span className="px-2 py-0.5 bg-black/60 rounded border border-slate-800">Win64</span>
                </div>
              </div>

              <button
                onClick={() => triggerDownload('BDTBT_BlastingSimulator_PCVR_Win64.zip', 'Paket Simulator PC VR Windows (3.8 GB)')}
                className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Paket PC VR</span>
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          FOOTER (Khas BDTBT ESDM)
          ========================================================================= */}
      <footer className="bg-black text-gray-400 text-xs py-10 border-t-4 border-[#FFF000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3.5">
              <div className="p-2 bg-[#FFF000] text-black rounded-lg">
                <HardHat className="h-6 w-6 text-black stroke-[2.5]" />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-white uppercase tracking-wider text-sm">
                  BALAI DIKLAT TAMBANG BAWAH TANAH
                </p>
                <p className="text-[#FFF000] text-xs">
                  Kementerian Energi dan Sumber Daya Mineral Republik Indonesia
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Jl. Saringan, Lembah Segar, Kota Sawahlunto, Sumatera Barat 25422
                </p>
              </div>
            </div>

            <div className="text-center md:text-right text-gray-500">
              <p>© {new Date().getFullYear()} BDTBT ESDM. Hak Cipta Dilindungi Undang-Undang.</p>
              <p className="mt-1 text-[11px]">Sistem Evaluasi Simulasi Peledakan Tambang Bawah Tanah Terintegrasi</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
