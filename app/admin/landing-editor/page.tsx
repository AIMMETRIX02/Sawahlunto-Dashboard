'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import {
  LandingConfig,
  DEFAULT_LANDING_CONFIG,
  ScreenshotItem,
  SopStepItem,
  CustomBlockItem,
  ArticleItem
} from '@/lib/landingConfig'
import { convertImageToWebP, formatBytes, ConvertedWebPResult } from '@/lib/imageUtils'
import {
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  FileText,
  Image as ImageIcon,
  Cpu,
  Download,
  Info,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Check
} from 'lucide-react'

export default function LandingEditorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'hero' | 'gallery' | 'sop' | 'hardware' | 'download' | 'articles' | 'blocks' | 'footer'>('hero')
  const [config, setConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // WebP conversion state tracking per field
  const [convertingKey, setConvertingKey] = useState<string | null>(null)
  const [conversionStats, setConversionStats] = useState<{ [key: string]: ConvertedWebPResult }>({})

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true)

        // Check authentication & superadmin role
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile?.role !== 'superadmin') {
          setIsSuperAdmin(false)
          setToast({ message: 'Akses ditolak: Halaman ini hanya untuk Super Admin.', type: 'error' })
          return
        }

        setIsSuperAdmin(true)

        // Load config: LocalStorage fallback first
        const local = localStorage.getItem('bdtbt_landing_config')
        if (local) {
          try {
            const parsed = JSON.parse(local)
            setConfig({ ...DEFAULT_LANDING_CONFIG, ...parsed })
          } catch (e) {}
        }

        // Query Supabase system_settings for landing_config
        const { data: settings } = await supabase
          .from('system_settings')
          .select('landing_config')
          .eq('id', 1)
          .maybeSingle()

        if (settings?.landing_config) {
          const remoteConfig = typeof settings.landing_config === 'string'
            ? JSON.parse(settings.landing_config)
            : settings.landing_config

          setConfig({ ...DEFAULT_LANDING_CONFIG, ...remoteConfig })
          localStorage.setItem('bdtbt_landing_config', JSON.stringify(remoteConfig))
        }
      } catch (err: any) {
        console.error('Error loading landing editor config:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Handle image upload and auto-convert to WebP
  const handleImageUpload = async (
    file: File,
    key: string,
    onSuccess: (dataUrl: string) => void
  ) => {
    try {
      setConvertingKey(key)
      const result = await convertImageToWebP(file, 1600, 1600, 0.82)
      setConversionStats(prev => ({ ...prev, [key]: result }))
      onSuccess(result.dataUrl)
      showToast(`Foto berhasil dikonversi ke WebP (${formatBytes(result.originalSize)} ➔ ${formatBytes(result.webpSize)})`, 'success')
    } catch (err: any) {
      console.error('WebP conversion error:', err)
      showToast(err.message || 'Gagal mengonversi foto ke WebP.', 'error')
    } finally {
      setConvertingKey(null)
    }
  }

  // Save changes to Supabase and LocalStorage
  const handleSaveAll = async () => {
    try {
      setSaving(true)

      // 1. Save to LocalStorage immediately
      localStorage.setItem('bdtbt_landing_config', JSON.stringify(config))

      // 2. Save to Supabase system_settings
      const { error } = await supabase
        .from('system_settings')
        .update({
          landing_config: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (error) {
        console.warn('Supabase update warning (fallback to localStorage used):', error)
      }

      showToast('Seluruh konfigurasi Landing Page berhasil disimpan ke database!', 'success')
    } catch (err: any) {
      console.error('Save error:', err)
      showToast('Gagal menyimpan ke database Supabase, konfigurasi tersimpan lokal.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Reset to default ESDM configuration
  const handleReset = () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan semua konten landing page ke pengaturan default ESDM?')) return
    setConfig(DEFAULT_LANDING_CONFIG)
    localStorage.setItem('bdtbt_landing_config', JSON.stringify(DEFAULT_LANDING_CONFIG))
    showToast('Konten telah dikembalikan ke default.', 'success')
  }

  // Add / Remove helpers for dynamic collections
  const handleAddScreenshot = () => {
    const newId = `sc_${Date.now()}`
    const newItem: ScreenshotItem = {
      id: newId,
      title: 'Judul Dokumentasi Simulasi VR Baru',
      subtitle: 'SOP Rangkaian Peledakan • Sawahlunto',
      desc: 'Deskripsi pengujian atau tahapan peledakan yang dipraktikkan pada simulasi Virtual Reality.',
      image: '/images/simulator/hero.jpg',
      tag: 'SIMULASI VR'
    }
    setConfig(prev => ({
      ...prev,
      screenshots: [...prev.screenshots, newItem]
    }))
  }

  const handleDeleteScreenshot = (index: number) => {
    if (!confirm('Hapus foto dokumentasi ini?')) return
    setConfig(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }))
  }

  const handleAddArticle = () => {
    const newItem: ArticleItem = {
      id: `art_${Date.now()}`,
      category: 'BERITA DIKLAT',
      title: 'Judul Artikel / Pengumuman Baru BDTBT',
      subtitle: 'Sawahlunto • Standar Kompetensi Diklat',
      content: 'Tuliskan rincian lengkap artikel, pengumuman, atau kajian teknis di sini...',
      date: new Date().toISOString().split('T')[0],
      author: 'BDTBT ESDM'
    }
    setConfig(prev => ({
      ...prev,
      articles: [newItem, ...prev.articles]
    }))
  }

  const handleDeleteArticle = (id: string) => {
    if (!confirm('Hapus artikel ini?')) return
    setConfig(prev => ({
      ...prev,
      articles: prev.articles.filter(a => a.id !== id)
    }))
  }

  const handleAddCustomBlock = () => {
    const newItem: CustomBlockItem = {
      id: `blk_${Date.now()}`,
      badge: 'BLOK INFORMASI',
      title: 'Judul Blok Kustom Baru',
      subtitle: 'Keterangan Tambahan',
      content: 'Tuliskan deskripsi atau isi lengkap seksi kustom ini di sini...'
    }
    setConfig(prev => ({
      ...prev,
      customBlocks: [...prev.customBlocks, newItem]
    }))
  }

  const handleDeleteCustomBlock = (id: string) => {
    if (!confirm('Hapus blok kustom ini?')) return
    setConfig(prev => ({
      ...prev,
      customBlocks: prev.customBlocks.filter(b => b.id !== id)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
          <p className="text-sm font-semibold text-gray-300">Memuat Website Editor...</p>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Akses Terbatas</h2>
          <p className="text-sm text-gray-400 mb-6">
            Halaman Website Editor khusus untuk akun dengan hak akses Super Admin.
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs rounded-xl inline-block"
          >
            Kembali ke Landing Page
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#FFF000] selection:text-black">
      <Navbar />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[250] px-5 py-3.5 rounded-2xl shadow-2xl font-bold flex items-center space-x-3 border-2 animate-in slide-in-from-bottom-5 text-sm ${
            toast.type === 'success'
              ? 'bg-yellow-400 text-black border-black'
              : 'bg-red-600 text-white border-red-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Editor Sub-Header Toolbar */}
      <div className="bg-[#12161A] border-b border-yellow-500/30 sticky top-20 z-40 px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white transition-colors"
              title="Kembali ke Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-black rounded uppercase tracking-wider">
                  Superadmin CMS
                </span>
                <h1 className="text-base sm:text-lg font-black text-white">
                  Website Editor (Landing Page)
                </h1>
              </div>
              <p className="text-xs text-gray-400">
                Ubah teks, ganti foto (auto WebP), edit 11 SOP, artikel, dan blok landing page
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lihat Halaman</span>
            </Link>

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-800 hover:bg-red-950/40 text-gray-400 hover:text-red-400 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors border border-slate-700 hover:border-red-500/30"
              title="Reset ke template default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-2 bg-[#FFF000] hover:bg-yellow-400 text-black text-xs font-black rounded-xl flex items-center space-x-2 shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] border border-yellow-300 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 border-b border-slate-800 no-scrollbar mb-8">
          {[
            { id: 'hero', label: '1. Hero & Header', icon: FileText },
            { id: 'gallery', label: '2. Galeri Foto VR', icon: ImageIcon },
            { id: 'sop', label: '3. 11 Prosedur SOP', icon: ShieldCheck },
            { id: 'hardware', label: '4. Spesifikasi Hardware', icon: Cpu },
            { id: 'download', label: '5. Unduhan SOP', icon: Download },
            { id: 'articles', label: '6. Artikel & Berita', icon: FileText },
            { id: 'blocks', label: '7. Blok Kustom', icon: Layers },
            { id: 'footer', label: '8. Footer Informasi', icon: Info }
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                  active
                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/10'
                    : 'bg-slate-900/80 text-gray-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* =========================================================================
            TAB 1: HERO & HEADER
            ========================================================================= */}
        {activeTab === 'hero' && (
          <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-white">Seksi Hero (Bagian Atas Landing Page)</h2>
              <p className="text-xs text-gray-400">Atur teks utama, judul, penjelasan, dan tombol pengarah.</p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Teks Badge Institusi
                </label>
                <input
                  type="text"
                  value={config.hero.badge}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, badge: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Judul Utama Baris 1
                  </label>
                  <input
                    type="text"
                    value={config.hero.headlineTop}
                    onChange={(e) => setConfig({ ...config, hero: { ...config.hero, headlineTop: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
                    Teks Highlight Kuning Emas
                  </label>
                  <input
                    type="text"
                    value={config.hero.headlineHighlight}
                    onChange={(e) => setConfig({ ...config, hero: { ...config.hero, headlineHighlight: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Judul Utama Baris 2 (Sub-judul)
                  </label>
                  <input
                    type="text"
                    value={config.hero.headlineBottom}
                    onChange={(e) => setConfig({ ...config, hero: { ...config.hero, headlineBottom: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-yellow-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Paragraf Deskripsi Hero
                </label>
                <textarea
                  rows={4}
                  value={config.hero.description}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, description: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-yellow-400 focus:outline-none leading-relaxed"
                />
              </div>

              {/* 3 Pills */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  3 Indikator Fitur Unggulan (Pills)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {config.hero.pills.map((pill, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={pill}
                      onChange={(e) => {
                        const nextPills = [...config.hero.pills]
                        nextPills[idx] = e.target.value
                        setConfig({ ...config, hero: { ...config.hero, pills: nextPills } })
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-yellow-400 focus:outline-none"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: GALERI FOTO VR (AUTO-CONVERT TO WEBP)
            ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div>
                <h2 className="text-lg font-bold text-white">Galeri Foto Simulasi VR BDTBT</h2>
                <p className="text-xs text-gray-400">
                  Ganti atau tambah foto simulator. Foto otomatis dikonversi ke format <strong>WebP</strong> berukuran sangat ringan sebelum disimpan.
                </p>
              </div>
              <button
                onClick={handleAddScreenshot}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl flex items-center space-x-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Foto Dokumentasi</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.screenshots.map((sc, index) => {
                const stats = conversionStats[`screenshot_${index}`]
                const isConverting = convertingKey === `screenshot_${index}`

                return (
                  <div
                    key={sc.id || index}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview & Upload Button */}
                      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-slate-700 mb-3 group">
                        <img
                          src={sc.image}
                          alt={sc.title}
                          className="w-full h-full object-cover"
                        />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-yellow-400 font-bold text-xs space-y-1">
                          <Upload className="w-6 h-6" />
                          <span>Klik untuk Ganti Foto (Auto WebP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                handleImageUpload(f, `screenshot_${index}`, (newUrl) => {
                                  const nextSc = [...config.screenshots]
                                  nextSc[index].image = newUrl
                                  setConfig({ ...config, screenshots: nextSc })
                                })
                              }
                            }}
                          />
                        </label>

                        {isConverting && (
                          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-yellow-400 text-xs font-bold space-y-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Mengonversi ke WebP...</span>
                          </div>
                        )}
                      </div>

                      {/* WebP Stats info if recently uploaded */}
                      {stats && (
                        <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 flex items-center justify-between">
                          <span>WebP: {formatBytes(stats.originalSize)} ➔ {formatBytes(stats.webpSize)}</span>
                          <span className="font-bold">Hemat {stats.compressionRatio}%</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Tag Badge
                            </label>
                            <input
                              type="text"
                              value={sc.tag}
                              onChange={(e) => {
                                const next = [...config.screenshots]
                                next[index].tag = e.target.value
                                setConfig({ ...config, screenshots: next })
                              }}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Subjudul / Keterangan
                            </label>
                            <input
                              type="text"
                              value={sc.subtitle}
                              onChange={(e) => {
                                const next = [...config.screenshots]
                                next[index].subtitle = e.target.value
                                setConfig({ ...config, screenshots: next })
                              }}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Judul Foto
                          </label>
                          <input
                            type="text"
                            value={sc.title}
                            onChange={(e) => {
                              const next = [...config.screenshots]
                              next[index].title = e.target.value
                              setConfig({ ...config, screenshots: next })
                            }}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Deskripsi Lengkap
                          </label>
                          <textarea
                            rows={2}
                            value={sc.desc}
                            onChange={(e) => {
                              const next = [...config.screenshots]
                              next[index].desc = e.target.value
                              setConfig({ ...config, screenshots: next })
                            }}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">Foto #{index + 1}</span>
                      {config.screenshots.length > 1 && (
                        <button
                          onClick={() => handleDeleteScreenshot(index)}
                          className="text-red-400 hover:text-red-300 flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: 11 PROSEDUR SOP
            ========================================================================= */}
        {activeTab === 'sop' && (
          <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-white">11 Prosedur Evaluasi Peledakan Bawah Tanah</h2>
              <p className="text-xs text-gray-400">
                Ubah judul dan deskripsi dari masing-masing 11 tahapan SOP keselamatan peledakan Sawahlunto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.sopSteps.map((step, index) => (
                <div key={step.no} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 bg-yellow-400/20 text-yellow-300 font-mono font-bold text-xs rounded">
                      Langkah {step.no}
                    </span>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const next = [...config.sopSteps]
                        next[index].title = e.target.value
                        setConfig({ ...config, sopSteps: next })
                      }}
                      className="flex-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-bold"
                    />
                  </div>

                  <textarea
                    rows={2}
                    value={step.desc}
                    onChange={(e) => {
                      const next = [...config.sopSteps]
                      next[index].desc = e.target.value
                      setConfig({ ...config, sopSteps: next })
                    }}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-gray-300 text-xs leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: SPESIFIKASI HARDWARE
            ========================================================================= */}
        {activeTab === 'hardware' && (
          <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-white">Spesifikasi Kompatibilitas Perangkat VR</h2>
              <p className="text-xs text-gray-400">Atur rincian kebutuhan perangkat keras untuk simulator VR.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Judul Seksi
                  </label>
                  <input
                    type="text"
                    value={config.hardware.title}
                    onChange={(e) => setConfig({ ...config, hardware: { ...config.hardware, title: e.target.value } })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Badge Kategori
                  </label>
                  <input
                    type="text"
                    value={config.hardware.badge}
                    onChange={(e) => setConfig({ ...config, hardware: { ...config.hardware, badge: e.target.value } })}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Paragraf Pengantar
                </label>
                <textarea
                  rows={2}
                  value={config.hardware.description}
                  onChange={(e) => setConfig({ ...config, hardware: { ...config.hardware, description: e.target.value } })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-yellow-400">Spesifikasi Standalone VR:</label>
                  <input
                    type="text"
                    value={config.hardware.standaloneText}
                    onChange={(e) => setConfig({ ...config, hardware: { ...config.hardware, standaloneText: e.target.value } })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-gray-200 text-xs"
                  />
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-bold text-yellow-400">Spesifikasi PC VR (Komputer Diklat):</label>
                  <input
                    type="text"
                    value={config.hardware.pcText}
                    onChange={(e) => setConfig({ ...config, hardware: { ...config.hardware, pcText: e.target.value } })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-gray-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: UNDUHAN SOP (1 TOMBOL UTAMA)
            ========================================================================= */}
        {activeTab === 'download' && (
          <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-white">Seksi Unduhan Resmi (Buku Panduan & SOP)</h2>
              <p className="text-xs text-gray-400">Atur judul, deskripsi, dan tombol unduh berkas pedoman operasional.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Judul Seksi Unduhan
                </label>
                <input
                  type="text"
                  value={config.download.title}
                  onChange={(e) => setConfig({ ...config, download: { ...config.download, title: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Deskripsi Berkas SOP
                </label>
                <textarea
                  rows={3}
                  value={config.download.description}
                  onChange={(e) => setConfig({ ...config, download: { ...config.download, description: e.target.value } })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Label Tombol Unduh
                  </label>
                  <input
                    type="text"
                    value={config.download.buttonText}
                    onChange={(e) => setConfig({ ...config, download: { ...config.download, buttonText: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nama Berkas Unduhan
                  </label>
                  <input
                    type="text"
                    value={config.download.fileName}
                    onChange={(e) => setConfig({ ...config, download: { ...config.download, fileName: e.target.value } })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: ARTIKEL & BERITA (CMS DENGAN WEBP)
            ========================================================================= */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div>
                <h2 className="text-lg font-bold text-white">Artikel & Berita Diklat</h2>
                <p className="text-xs text-gray-400">
                  Kelola konten edukasi atau pengumuman resmi. Foto otomatis dikonversi ke WebP ringan.
                </p>
              </div>
              <button
                onClick={handleAddArticle}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl flex items-center space-x-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tulis Artikel Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.articles.map((art, index) => {
                const stats = conversionStats[`article_${art.id}`]
                const isConverting = convertingKey === `article_${art.id}`

                return (
                  <div
                    key={art.id}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Image uploader */}
                      {art.image && (
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-slate-700 max-h-48 group">
                          <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-yellow-400 text-xs font-bold space-y-1">
                            <Upload className="w-5 h-5" />
                            <span>Ganti Foto (WebP)</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) {
                                  handleImageUpload(f, `article_${art.id}`, (url) => {
                                    const next = [...config.articles]
                                    next[index].image = url
                                    setConfig({ ...config, articles: next })
                                  })
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {!art.image && (
                        <label className="border border-dashed border-slate-700 hover:border-yellow-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-yellow-400 text-xs transition-colors">
                          <Upload className="w-5 h-5 mb-1" />
                          <span>Unggah Foto Artikel (Auto WebP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                handleImageUpload(f, `article_${art.id}`, (url) => {
                                  const next = [...config.articles]
                                  next[index].image = url
                                  setConfig({ ...config, articles: next })
                                })
                              }
                            }}
                          />
                        </label>
                      )}

                      {stats && (
                        <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[10px] text-emerald-400 flex items-center justify-between">
                          <span>WebP: {formatBytes(stats.originalSize)} ➔ {formatBytes(stats.webpSize)}</span>
                          <span className="font-bold">Hemat {stats.compressionRatio}%</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Kategori</label>
                          <input
                            type="text"
                            value={art.category}
                            onChange={(e) => {
                              const next = [...config.articles]
                              next[index].category = e.target.value
                              setConfig({ ...config, articles: next })
                            }}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase">Subjudul</label>
                          <input
                            type="text"
                            value={art.subtitle}
                            onChange={(e) => {
                              const next = [...config.articles]
                              next[index].subtitle = e.target.value
                              setConfig({ ...config, articles: next })
                            }}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Judul Artikel</label>
                        <input
                          type="text"
                          value={art.title}
                          onChange={(e) => {
                            const next = [...config.articles]
                            next[index].title = e.target.value
                            setConfig({ ...config, articles: next })
                          }}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase">Isi Artikel</label>
                        <textarea
                          rows={4}
                          value={art.content}
                          onChange={(e) => {
                            const next = [...config.articles]
                            next[index].content = e.target.value
                            setConfig({ ...config, articles: next })
                          }}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs leading-relaxed"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">{art.date}</span>
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="text-red-400 hover:text-red-300 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Artikel</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: BLOK KUSTOM TAMBAHAN
            ========================================================================= */}
        {activeTab === 'blocks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div>
                <h2 className="text-lg font-bold text-white">Blok Kustom Tambahan</h2>
                <p className="text-xs text-gray-400">
                  Buat seksi atau blok baru semau Anda pada landing page (fasilitas, pengumuman, materi khusus, dll).
                </p>
              </div>
              <button
                onClick={handleAddCustomBlock}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl flex items-center space-x-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Blok Baru</span>
              </button>
            </div>

            {config.customBlocks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-gray-400">
                <Layers className="w-10 h-10 mx-auto text-gray-500 mb-3" />
                <p className="font-bold text-sm text-gray-300">Belum ada blok kustom tambahan</p>
                <p className="text-xs text-gray-500 mt-1">
                  Klik tombol "+ Buat Blok Baru" di atas untuk menambahkan seksi baru ke landing page.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {config.customBlocks.map((blk, index) => (
                  <div
                    key={blk.id}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Badge</label>
                        <input
                          type="text"
                          value={blk.badge}
                          onChange={(e) => {
                            const next = [...config.customBlocks]
                            next[index].badge = e.target.value
                            setConfig({ ...config, customBlocks: next })
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Judul Blok</label>
                        <input
                          type="text"
                          value={blk.title}
                          onChange={(e) => {
                            const next = [...config.customBlocks]
                            next[index].title = e.target.value
                            setConfig({ ...config, customBlocks: next })
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Subjudul</label>
                      <input
                        type="text"
                        value={blk.subtitle}
                        onChange={(e) => {
                          const next = [...config.customBlocks]
                          next[index].subtitle = e.target.value
                          setConfig({ ...config, customBlocks: next })
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Isi Konten Blok</label>
                      <textarea
                        rows={3}
                        value={blk.content}
                        onChange={(e) => {
                          const next = [...config.customBlocks]
                          next[index].content = e.target.value
                          setConfig({ ...config, customBlocks: next })
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs leading-relaxed"
                      />
                    </div>

                    {/* Image uploader */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                        Foto Blok (Opsional - Auto WebP)
                      </label>
                      {blk.image ? (
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-slate-700 max-h-48 group">
                          <img src={blk.image} alt={blk.title} className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-yellow-400 text-xs font-bold space-y-1">
                            <Upload className="w-5 h-5" />
                            <span>Ganti Foto (WebP)</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) {
                                  handleImageUpload(f, `blk_${blk.id}`, (url) => {
                                    const next = [...config.customBlocks]
                                    next[index].image = url
                                    setConfig({ ...config, customBlocks: next })
                                  })
                                }
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="border border-dashed border-slate-700 hover:border-yellow-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer text-gray-400 hover:text-yellow-400 text-xs transition-colors">
                          <Upload className="w-5 h-5 mb-1" />
                          <span>Unggah Foto Pendukung Blok (WebP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) {
                                handleImageUpload(f, `blk_${blk.id}`, (url) => {
                                  const next = [...config.customBlocks]
                                  next[index].image = url
                                  setConfig({ ...config, customBlocks: next })
                                })
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleDeleteCustomBlock(blk.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Blok Ini</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 8: FOOTER
            ========================================================================= */}
        {activeTab === 'footer' && (
          <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div>
              <h2 className="text-lg font-bold text-white">Informasi Footer</h2>
              <p className="text-xs text-gray-400">Atur teks institusi, kementerian, dan alamat kantor.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Balai</label>
                <input
                  type="text"
                  value={config.footer.institutionName}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, institutionName: e.target.value } })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nama Kementerian</label>
                <input
                  type="text"
                  value={config.footer.ministryName}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, ministryName: e.target.value } })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Alamat Kantor</label>
                <input
                  type="text"
                  value={config.footer.address}
                  onChange={(e) => setConfig({ ...config, footer: { ...config.footer, address: e.target.value } })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
