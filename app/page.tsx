'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import {
  LandingConfig,
  DEFAULT_LANDING_CONFIG,
  ScreenshotItem,
  SopStepItem,
  ArticleItem,
  CustomBlockItem
} from '@/lib/landingConfig'
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
  X,
  Newspaper
} from 'lucide-react'

interface UserSessionState {
  isLoggedIn: boolean
  role: string | null
  fullName: string | null
  email: string | null
}

const SOP_ICONS: { [key: string]: any } = {
  '01': ShieldCheck,
  '02': Layers,
  '03': Zap,
  '04': Zap,
  '05': Radio,
  '06': Flame,
  '07': Sparkles,
  '08': ArrowRight,
  '09': Zap,
  '10': Flame,
  '11': Fan
}

export default function LandingPage() {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<UserSessionState>({
    isLoggedIn: false,
    role: null,
    fullName: null,
    email: null
  })

  // Full Landing Page Configuration (synchronized with Website Editor)
  const [config, setConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG)
  const [activeImage, setActiveImage] = useState<ScreenshotItem | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null)
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

    const fetchLandingConfig = async () => {
      try {
        // 1. LocalStorage cache first
        const local = localStorage.getItem('bdtbt_landing_config')
        if (local) {
          try {
            const parsed = JSON.parse(local)
            setConfig({ ...DEFAULT_LANDING_CONFIG, ...parsed })
          } catch (e) {}
        }

        // 2. Query Supabase system_settings for landing_config
        const { data: settings } = await supabase
          .from('system_settings')
          .select('landing_config')
          .eq('id', 1)
          .maybeSingle()

        if (settings?.landing_config) {
          const remote = typeof settings.landing_config === 'string'
            ? JSON.parse(settings.landing_config)
            : settings.landing_config

          setConfig({ ...DEFAULT_LANDING_CONFIG, ...remote })
          localStorage.setItem('bdtbt_landing_config', JSON.stringify(remote))
        }
      } catch (err) {
        console.warn('Gagal memuat konfigurasi landing page:', err)
      }
    }

    fetchSession()
    fetchLandingConfig()
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

  const triggerDownload = (url: string, fileName: string, label: string) => {
    setDownloadToast(`Memulai unduhan berkas: ${label}...`)
    const targetUrl = url || config.download.fileUrl || 'https://pub-8b89ed0687f548dab4ebe7c8a311ed49.r2.dev/Manual%20Book%20Non%20Electrical%20UG%20Blast%20BDTBT.pdf'
    const targetName = fileName || config.download.fileName || 'Manual Book Non Electrical UG Blast BDTBT.pdf'
    
    const link = document.createElement('a')
    link.href = targetUrl
    link.setAttribute('download', targetName)
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      setDownloadToast(`Unduhan ${label} berhasil disiapkan!`)
      setTimeout(() => setDownloadToast(null), 4000)
    }, 500)
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

      {/* Article Reader Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-[220] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 border border-yellow-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-yellow-400 text-black text-xs font-black rounded-lg uppercase">
                  {selectedArticle.category || 'Berita Diklat'}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {selectedArticle.date}
                </span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              {selectedArticle.image && (
                <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-slate-800 max-h-72">
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {selectedArticle.title}
                </h2>
                {selectedArticle.subtitle && (
                  <p className="text-sm font-semibold text-yellow-400 mt-2">
                    {selectedArticle.subtitle}
                  </p>
                )}
              </div>

              <div className="prose prose-invert max-w-none text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-slate-800 pt-6">
                {selectedArticle.content}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28 border-b border-yellow-500/20 bg-gradient-to-b from-[#14181B] via-slate-950 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-yellow-500/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/10 blur-[140px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-sm">
              <HardHat className="w-4 h-4 text-yellow-400" />
              <span>{config.hero.badge}</span>
            </div>
            {sessionState.isLoggedIn && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-green-950/60 border border-green-500/40 text-green-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span>Masuk sebagai: <strong>{sessionState.fullName}</strong> ({sessionState.role?.toUpperCase()})</span>
              </div>
            )}
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none uppercase">
              {config.hero.headlineTop} <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500">
                {config.hero.headlineHighlight}
              </span> <br />
              <span className="text-2xl sm:text-4xl text-gray-300 font-extrabold tracking-normal normal-case">
                {config.hero.headlineBottom}
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto font-normal">
              {config.hero.description}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleLmsRedirect}
                className="w-full sm:w-auto px-8 py-4 bg-[#FFF000] hover:bg-yellow-400 text-black font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group border-2 border-yellow-300"
              >
                <GraduationCap className="w-6 h-6 text-black group-hover:rotate-12 transition-transform" />
                <span>
                  {sessionState.isLoggedIn
                    ? (sessionState.role === 'peserta' ? 'Buka Dashboard LMS Peserta' : 'Buka Dashboard LMS Admin')
                    : config.hero.ctaPrimaryText}
                </span>
                <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#download-modul"
                className="w-full sm:w-auto px-7 py-4 bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-base sm:text-lg rounded-2xl border border-yellow-500/40 hover:border-yellow-400 transition-all flex items-center justify-center space-x-2.5 shadow-lg"
              >
                <Download className="w-5 h-5 text-yellow-400" />
                <span>{config.hero.ctaSecondaryText}</span>
              </a>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
              {config.hero.pills.map((pill, idx) => (
                <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-gray-200">{pill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DYNAMIC CUSTOM BLOCKS (Created via Website Editor)
          ========================================================================= */}
      {config.customBlocks.length > 0 && (
        <section className="py-16 bg-slate-950 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {config.customBlocks.map((block) => (
              <div
                key={block.id}
                className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 to-[#161B1E] border border-yellow-500/30 flex flex-col lg:flex-row items-center justify-between gap-8 relative"
              >
                <div className="max-w-2xl flex-1">
                  <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-black rounded-lg uppercase">
                    {block.badge || 'INFORMASI'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                    {block.title}
                  </h3>
                  {block.subtitle && (
                    <p className="text-yellow-400 text-sm font-semibold mt-1">
                      {block.subtitle}
                    </p>
                  )}
                  <p className="text-gray-300 text-sm sm:text-base mt-3 leading-relaxed whitespace-pre-line">
                    {block.content}
                  </p>
                </div>

                {block.image && (
                  <div className="w-full lg:w-96 rounded-2xl overflow-hidden aspect-video border border-yellow-500/40 bg-black flex-shrink-0 shadow-xl">
                    <img
                      src={block.image}
                      alt={block.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          GALLERY / SCREENSHOT SECTION (Tangkapan Layar Simulator)
          ========================================================================= */}
      <section id="galeri-simulator" className="py-20 bg-slate-950 border-b border-yellow-500/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
              Visual Dokumentasi
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 uppercase tracking-wide">
              Dokumentasi Simulasi Peledakan BDTBT
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2">
              Tangkapan layar lingkungan virtual interaktif terowongan tambang bawah tanah Sawahlunto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {config.screenshots.map((item, index) => (
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
                    <span>Dokumentasi #{index + 1}</span>
                    <span className="text-yellow-400 font-semibold group-hover:underline flex items-center">
                      Perbesar Foto <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
            {config.sopSteps.map((step) => {
              const Icon = SOP_ICONS[step.no] || ShieldCheck
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
                {config.hardware.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">
                {config.hardware.title}
              </h3>
              <p className="text-gray-300 text-sm sm:text-base mt-2 leading-relaxed">
                {config.hardware.description}
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-black/40 p-3.5 rounded-xl border border-slate-700">
                  <p className="font-bold text-yellow-400">{config.hardware.standaloneTitle}</p>
                  <p className="text-gray-300 mt-1">{config.hardware.standaloneText}</p>
                </div>
                <div className="bg-black/40 p-3.5 rounded-xl border border-slate-700">
                  <p className="font-bold text-yellow-400">{config.hardware.pcTitle}</p>
                  <p className="text-gray-300 mt-1">{config.hardware.pcText}</p>
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
          ARTICLES & ANNOUNCEMENTS SECTION
          ========================================================================= */}
      {config.articles.length > 0 && (
        <section className="py-20 bg-slate-950 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="px-3.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
                Pusat Informasi & Edukasi
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 uppercase tracking-wide">
                Artikel & Berita Diklat Terkini
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mt-2">
                Kajian teknis peledakan, standar K3 tambang bawah tanah, dan pembaruan kegiatan BDTBT ESDM.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-slate-900 border border-slate-800 hover:border-yellow-400/50 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div>
                    {article.image ? (
                      <div className="relative aspect-video w-full bg-black overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="p-6 pb-0">
                        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold">
                          <Newspaper className="w-5 h-5" />
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center space-x-2 text-[11px] text-gray-400 mb-2">
                        <span className="px-2 py-0.5 rounded bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 font-bold uppercase">
                          {article.category || 'Berita Diklat'}
                        </span>
                        <span>•</span>
                        <span>{article.date}</span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors leading-snug">
                        {article.title}
                      </h3>

                      {article.subtitle && (
                        <p className="text-xs text-yellow-400/90 font-medium mt-1">
                          {article.subtitle}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2.5 leading-relaxed line-clamp-3">
                        {article.content}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="w-full py-2 bg-slate-800 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          DOWNLOAD MODULE SECTION (1 TOMBOL UTAMA: BUKU PANDUAN & SOP)
          ========================================================================= */}
      <section id="download-modul" className="py-20 bg-[#0E1215] border-b border-yellow-500/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
              {config.download.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 uppercase tracking-wide">
              {config.download.title}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2">
              {config.download.description}
            </p>
          </div>

          {/* Single Prominent Download Card */}
          <div className="max-w-2xl mx-auto p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-[#12161a] border-2 border-yellow-500/40 hover:border-yellow-400 shadow-2xl transition-all flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center font-bold mb-5 shadow-lg group-hover:scale-105 transition-transform">
              <FileText className="w-8 h-8" />
            </div>

            <span className="text-xs font-mono text-yellow-400 font-bold uppercase tracking-wider">
              {config.download.badge}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white mt-2 group-hover:text-yellow-400 transition-colors">
              {config.download.title}
            </h3>

            <p className="text-sm text-gray-300 mt-3 leading-relaxed max-w-lg">
              {config.download.description}
            </p>

            <div className="mt-5 flex flex-wrap justify-center items-center gap-3 text-xs text-gray-400">
              {config.download.fileMeta.map((meta, i) => (
                <span key={i} className="px-3 py-1 bg-black/60 rounded-lg border border-slate-700 text-gray-300 font-mono">
                  {meta}
                </span>
              ))}
            </div>

            <a
              href={config.download.fileUrl || 'https://pub-8b89ed0687f548dab4ebe7c8a311ed49.r2.dev/Manual%20Book%20Non%20Electrical%20UG%20Blast%20BDTBT.pdf'}
              target="_blank"
              rel="noopener noreferrer"
              download={config.download.fileName || 'Manual Book Non Electrical UG Blast BDTBT.pdf'}
              onClick={() => {
                setDownloadToast(`Memulai unduhan berkas: ${config.download.buttonText}...`)
                setTimeout(() => setDownloadToast(null), 4000)
              }}
              className="mt-8 w-full sm:w-auto px-10 py-4 bg-[#FFF000] hover:bg-yellow-400 text-black text-sm sm:text-base font-black rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-yellow-300 cursor-pointer"
            >
              <Download className="w-5 h-5 text-black" />
              <span>{config.download.buttonText}</span>
            </a>
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
                  {config.footer.institutionName}
                </p>
                <p className="text-[#FFF000] text-xs">
                  {config.footer.ministryName}
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  {config.footer.address}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-center md:text-right">
              <div>
                <p className="text-white font-semibold">{config.footer.version}</p>
                <p className="text-gray-400 text-[11px]">{config.footer.engine}</p>
              </div>
              <div className="border-l border-gray-800 pl-6">
                <Link
                  href="/developer"
                  className="inline-flex items-center space-x-1.5 text-yellow-400 hover:text-yellow-300 font-bold"
                >
                  <span>About Developer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-gray-400 text-[10px]">Aimmetrix Technology</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400 text-[11px]">
            © {new Date().getFullYear()} {config.footer.institutionName}. Hak Cipta Dilindungi Undang-Undang.
          </div>
        </div>
      </footer>
    </div>
  )
}
