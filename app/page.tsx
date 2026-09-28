'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import { LandingPostModal, LandingPost } from '@/components/LandingPostModal'
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
  Award,
  Plus,
  Edit3,
  Trash2,
  Newspaper,
  BookOpen,
  Calendar,
  User,
  Image as ImageIcon
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

const DEFAULT_ARTICLES: LandingPost[] = [
  {
    id: 'art-1',
    type: 'article',
    title: 'Pemberlakuan Standar Uji Kompetensi VR Blasting BDTBT ESDM 2024',
    category: 'PENGUMUMAN RESMI',
    subtitle: 'Sawahlunto • 11 Tahapan K3 Wajib Terpenuhi',
    content: 'Balai Diklat Tambang Bawah Tanah (BDTBT) Kementerian ESDM secara resmi memberlakukan evaluasi simulasi Virtual Reality sebagai syarat kelulusan praktikum peledakan bawah tanah. Setiap peserta diwajibkan menyelesaikan seluruh 11 rangkaian keselamatan kerja mulai dari deteksi gas berbahaya hingga aktivasi ventilasi exhaust fan pasca-peledakan sebelum sertifikat kompetensi diterbitkan.',
    author: 'BDTBT ESDM',
    created_at: '2024-09-01'
  },
  {
    id: 'art-2',
    type: 'article',
    title: 'Digitalisasi Diklat Bawah Tanah Berbasis Imersif & Zero Accident',
    category: 'INOVASI TEKNOLOGI',
    subtitle: 'Teknologi VR Terkini • Unreal Engine 5',
    content: 'Simulasi VR memungkinkan siswa diklat mempraktikkan skenario peledakan berisiko tinggi tanpa bahaya fatal di dunia nyata. Melalui simulasi ini, pemahaman pola delay milidetik dan handling blastbox exploder dapat diuji berulang kali hingga mencapai tingkat akurasi dan kepatuhan prosedur 100%.',
    author: 'BDTBT ESDM',
    created_at: '2024-09-15'
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
  const [activeImage, setActiveImage] = useState<{
    id?: string
    title: string
    subtitle?: string
    desc?: string
    image: string
    tag?: string
  } | null>(null)
  const [downloadToast, setDownloadToast] = useState<string | null>(null)

  // Landing posts & dynamic blocks state
  const [posts, setPosts] = useState<LandingPost[]>(DEFAULT_ARTICLES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDefaultType, setModalDefaultType] = useState<'article' | 'block' | 'gallery'>('article')
  const [editingPost, setEditingPost] = useState<LandingPost | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<LandingPost | null>(null)

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

    const fetchLandingPosts = async () => {
      try {
        // 1. Try local storage cache first
        const local = localStorage.getItem('bdtbt_landing_posts')
        if (local) {
          try {
            const parsed = JSON.parse(local)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPosts(parsed)
            }
          } catch (e) {}
        }

        // 2. Query Supabase landing_posts
        const { data, error } = await supabase
          .from('landing_posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          setPosts(data)
          localStorage.setItem('bdtbt_landing_posts', JSON.stringify(data))
        }
      } catch (err) {
        console.warn('Gagal memuat landing posts:', err)
      }
    }

    fetchSession()
    fetchLandingPosts()
  }, [])

  const isSuperAdmin = sessionState.isLoggedIn && sessionState.role === 'superadmin'

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

  const handleOpenAdd = (type: 'article' | 'block' | 'gallery') => {
    setEditingPost(null)
    setModalDefaultType(type)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (post: LandingPost) => {
    setEditingPost(post)
    setModalDefaultType(post.type)
    setIsModalOpen(true)
  }

  const handleDeletePost = async (id?: string) => {
    if (!id) return
    if (!confirm('Apakah Anda yakin ingin menghapus konten ini dari landing page?')) return

    try {
      await supabase.from('landing_posts').delete().eq('id', id)
    } catch (e) {}

    const updated = posts.filter(p => p.id !== id)
    setPosts(updated)
    try {
      localStorage.setItem('bdtbt_landing_posts', JSON.stringify(updated))
    } catch (e) {}
  }

  const handleSavedPost = (saved: LandingPost) => {
    setPosts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      let nextList: LandingPost[]
      if (idx >= 0) {
        nextList = [...prev]
        nextList[idx] = saved
      } else {
        nextList = [saved, ...prev]
      }
      try {
        localStorage.setItem('bdtbt_landing_posts', JSON.stringify(nextList))
      } catch (e) {}
      return nextList
    })
  }

  // Filter dynamic content
  const dynamicArticles = posts.filter(p => p.type === 'article')
  const dynamicBlocks = posts.filter(p => p.type === 'block')
  const dynamicGalleries = posts.filter(p => p.type === 'gallery')

  // Combined screenshots: default + custom from super admin
  const allScreenshots = [
    ...SCREENSHOTS,
    ...dynamicGalleries.map(g => ({
      id: g.id || `custom_${Math.random()}`,
      title: g.title,
      subtitle: g.subtitle || 'DOKUMENTASI SIMULATOR',
      desc: g.content || '',
      image: g.image_url || '/images/simulator/hero.jpg',
      tag: g.category || 'VR UPDATE',
      isCustom: true,
      originalPost: g
    }))
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#FFF000] selection:text-black">
      <Navbar />

      {/* =========================================================================
          SUPER ADMIN CMS FLOATING ACTION BAR
          ========================================================================= */}
      {isSuperAdmin && (
        <div className="bg-yellow-400 text-black px-4 sm:px-6 py-2.5 shadow-xl border-b-2 border-black flex flex-wrap items-center justify-between gap-3 sticky top-16 z-40 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-wider">Mode Editor Super Admin (Landing Page)</span>
            <span className="hidden md:inline text-xs font-semibold text-slate-800">
              • Foto otomatis dikonversi ke format WebP ringan
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenAdd('article')}
              className="px-3 py-1.5 bg-black hover:bg-slate-900 text-yellow-400 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Artikel</span>
            </button>
            <button
              onClick={() => handleOpenAdd('block')}
              className="px-3 py-1.5 bg-black hover:bg-slate-900 text-yellow-400 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Blok Baru</span>
            </button>
            <button
              onClick={() => handleOpenAdd('gallery')}
              className="px-3 py-1.5 bg-black hover:bg-slate-900 text-yellow-400 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Foto VR</span>
            </button>
          </div>
        </div>
      )}

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
                  {selectedArticle.created_at ? new Date(selectedArticle.created_at).toLocaleDateString('id-ID') : 'Terbaru'}
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
              {selectedArticle.image_url && (
                <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-slate-800 max-h-72">
                  <img
                    src={selectedArticle.image_url}
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
                {selectedArticle.content || 'Belum ada konten detail untuk artikel ini.'}
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

      {/* Landing Post Creator / Editor Modal */}
      <LandingPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSavedPost}
        initialData={editingPost}
        defaultType={modalDefaultType}
      />

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
                <span>Unduh Buku Panduan & SOP</span>
              </a>
            </div>

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
                <span className="text-xs font-semibold text-gray-200">2 Penandatangan Sertifikat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DYNAMIC CUSTOM BLOCKS (Created by Super Admin)
          ========================================================================= */}
      {dynamicBlocks.length > 0 && (
        <section className="py-16 bg-slate-950 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {dynamicBlocks.map((block) => (
              <div
                key={block.id}
                className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 to-[#161B1E] border border-yellow-500/30 flex flex-col lg:flex-row items-center justify-between gap-8 relative group"
              >
                {/* Superadmin Edit Controls */}
                {isSuperAdmin && (
                  <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
                    <button
                      onClick={() => handleOpenEdit(block)}
                      className="p-2 bg-yellow-400 text-black hover:bg-yellow-300 rounded-xl text-xs font-bold flex items-center space-x-1 shadow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Blok</span>
                    </button>
                    <button
                      onClick={() => handleDeletePost(block.id)}
                      className="p-2 bg-red-600/90 text-white hover:bg-red-500 rounded-xl text-xs font-bold flex items-center space-x-1 shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}

                <div className="max-w-2xl flex-1">
                  <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-black rounded-lg uppercase">
                    {block.category || 'INFORMASI KHUSUS'}
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

                {block.image_url ? (
                  <div className="w-full lg:w-96 rounded-2xl overflow-hidden aspect-video border border-yellow-500/40 bg-black flex-shrink-0 shadow-xl">
                    <img
                      src={block.image_url}
                      alt={block.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 text-center">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-yellow-400/10 border-2 border-yellow-400 flex items-center justify-center text-yellow-400 shadow-xl mb-2">
                      <Layers className="w-10 h-10" />
                    </div>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
            <div className="text-center sm:text-left max-w-2xl">
              <span className="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
                Visual Dokumentasi
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2 uppercase tracking-wide">
                Dokumentasi Simulasi Peledakan BDTBT
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Tangkapan layar lingkungan virtual interaktif terowongan tambang bawah tanah Sawahlunto.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => handleOpenAdd('gallery')}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl flex items-center space-x-2 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Foto Simulator</span>
              </button>
            )}
          </div>

          {/* Screenshot Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {allScreenshots.map((item, index) => (
              <div
                key={item.id}
                onClick={() => setActiveImage(item)}
                className="group bg-slate-900 border border-slate-800 hover:border-yellow-400/60 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 cursor-pointer flex flex-col relative"
              >
                {/* Superadmin controls for custom gallery items */}
                {(item as any).isCustom && isSuperAdmin && (
                  <div
                    className="absolute top-3 right-3 z-30 flex items-center space-x-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenEdit((item as any).originalPost)}
                      className="p-1.5 bg-black/80 hover:bg-black text-yellow-400 border border-yellow-400/40 rounded-lg text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(item.id)}
                      className="p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

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
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400">
                    <span>Dokumentasi #0{index + 1}</span>
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
          ARTICLES & ANNOUNCEMENTS SECTION (Bisa Di-edit Super Admin)
          ========================================================================= */}
      <section className="py-20 bg-slate-950 border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-14">
            <div>
              <span className="px-3.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
                Pusat Informasi & Edukasi
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2 uppercase tracking-wide">
                Artikel & Berita Diklat Terkini
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Kajian teknis peledakan, standar K3 tambang bawah tanah, dan pembaruan kegiatan BDTBT ESDM.
              </p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => handleOpenAdd('article')}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl flex items-center space-x-2 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Artikel Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynamicArticles.map((article) => (
              <div
                key={article.id}
                className="bg-slate-900 border border-slate-800 hover:border-yellow-400/50 rounded-3xl overflow-hidden shadow-xl transition-all flex flex-col justify-between group relative"
              >
                {/* Super Admin Edit Controls */}
                {isSuperAdmin && (
                  <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEdit(article)}
                      className="p-1.5 bg-black/80 hover:bg-black text-yellow-400 border border-yellow-400/40 rounded-lg text-xs"
                      title="Edit Artikel"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(article.id)}
                      className="p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-xs"
                      title="Hapus Artikel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div>
                  {article.image_url ? (
                    <div className="relative aspect-video w-full bg-black overflow-hidden">
                      <img
                        src={article.image_url}
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
                      <span>{article.created_at ? new Date(article.created_at).toLocaleDateString('id-ID') : 'Edisi 2024'}</span>
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

      {/* =========================================================================
          DOWNLOAD MODULE SECTION (1 TOMBOL UTAMA: BUKU PANDUAN & SOP)
          ========================================================================= */}
      <section id="download-modul" className="py-20 bg-[#0E1215] border-b border-yellow-500/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-bold uppercase tracking-wider">
              Pusat Unduhan Resmi BDTBT
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 uppercase tracking-wide">
              Unduh Buku Panduan & SOP Blasting VR
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-2">
              Buku pedoman resmi berisikan standar operasional prosedur keselamatan peledakan tambang bawah tanah Sawahlunto.
            </p>
          </div>

          {/* Single Prominent Download Card */}
          <div className="max-w-2xl mx-auto p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 to-[#12161a] border-2 border-yellow-500/40 hover:border-yellow-400 shadow-2xl transition-all flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center font-bold mb-5 shadow-lg group-hover:scale-105 transition-transform">
              <FileText className="w-8 h-8" />
            </div>

            <span className="text-xs font-mono text-yellow-400 font-bold uppercase tracking-wider">
              DOKUMEN RESMI BDTBT ESDM
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white mt-2 group-hover:text-yellow-400 transition-colors">
              Buku Panduan & Standar Operasional Prosedur (SOP) Blasting VR
            </h3>

            <p className="text-sm text-gray-300 mt-3 leading-relaxed max-w-lg">
              Standar Prosedur Operasional lengkap 11 tahapan peledakan bawah tanah, protokol APD, deteksi gas berbahaya (CH4/CO), rangkaian delay nonel, dan prosedur penyalaan mesin blastbox exploder.
            </p>

            <div className="mt-5 flex flex-wrap justify-center items-center gap-3 text-xs text-gray-400">
              <span className="px-3 py-1 bg-black/60 rounded-lg border border-slate-700 text-gray-300 font-mono">Format: PDF</span>
              <span className="px-3 py-1 bg-black/60 rounded-lg border border-slate-700 text-gray-300 font-mono">Ukuran: 14.5 MB</span>
              <span className="px-3 py-1 bg-yellow-400/10 rounded-lg border border-yellow-400/30 text-yellow-300 font-mono">Edisi 2024 • Rev 3.2</span>
            </div>

            <button
              onClick={() => triggerDownload('SOP_Blasting_VR_BDTBT_ESDM.pdf', 'Buku Panduan & SOP Blasting VR (PDF)')}
              className="mt-8 w-full sm:w-auto px-10 py-4 bg-[#FFF000] hover:bg-yellow-400 text-black text-sm sm:text-base font-black rounded-2xl transition-all flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-yellow-300"
            >
              <Download className="w-5 h-5 text-black" />
              <span>Unduh Buku Panduan & SOP (PDF)</span>
            </button>
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
                  KEMENTERIAN ENERGI DAN SUMBER DAYA MINERAL
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  Jl. Saringan No. 1, Kota Sawahlunto, Sumatera Barat 27424
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-center md:text-right">
              <div>
                <p className="text-white font-semibold">Simulator VR Blasting v2.4</p>
                <p className="text-gray-400 text-[11px]">Unreal Engine 5 • OpenXR Standard</p>
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
            © {new Date().getFullYear()} Balai Diklat Tambang Bawah Tanah Sawahlunto. Hak Cipta Dilindungi Undang-Undang.
          </div>
        </div>
      </footer>
    </div>
  )
}
