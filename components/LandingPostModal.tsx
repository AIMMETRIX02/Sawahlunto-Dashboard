'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { convertImageToWebP, formatBytes, ConvertedWebPResult } from '@/lib/imageUtils'
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Layers,
  Sparkles,
  Trash2,
  ArrowRight
} from 'lucide-react'

export interface LandingPost {
  id?: string
  type: 'article' | 'block' | 'gallery'
  title: string
  subtitle?: string
  category?: string
  content?: string
  image_url?: string
  author?: string
  is_published?: boolean
  created_at?: string
  updated_at?: string
}

interface LandingPostModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (post: LandingPost) => void
  initialData?: LandingPost | null
  defaultType?: 'article' | 'block' | 'gallery'
}

export function LandingPostModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  defaultType = 'article'
}: LandingPostModalProps) {
  const [mounted, setMounted] = useState(false)
  const [type, setType] = useState<'article' | 'block' | 'gallery'>(defaultType)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [category, setCategory] = useState('Berita Diklat')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadStats, setUploadStats] = useState<ConvertedWebPResult | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || defaultType)
        setTitle(initialData.title || '')
        setSubtitle(initialData.subtitle || '')
        setCategory(initialData.category || (initialData.type === 'gallery' ? 'VR SIMULATOR' : 'Berita Diklat'))
        setContent(initialData.content || '')
        setImageUrl(initialData.image_url || '')
        setUploadStats(null)
      } else {
        setType(defaultType)
        setTitle('')
        setSubtitle('')
        setCategory(defaultType === 'gallery' ? 'VR SIMULATOR' : defaultType === 'block' ? 'FITUR UTAMA' : 'Berita Diklat')
        setContent('')
        setImageUrl('')
        setUploadStats(null)
      }
      setErrorMsg(null)
    }
  }, [isOpen, initialData, defaultType])

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsConverting(true)
      setErrorMsg(null)

      // Convert image to WebP format on the client
      const result = await convertImageToWebP(file, 1600, 1600, 0.82)
      setUploadStats(result)
      setImageUrl(result.dataUrl)
    } catch (err: any) {
      console.error('Error converting image to WebP:', err)
      setErrorMsg(err.message || 'Gagal mengonversi foto ke WebP.')
    } finally {
      setIsConverting(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    setUploadStats(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setErrorMsg('Judul wajib diisi.')
      return
    }

    setIsSaving(true)
    setErrorMsg(null)

    const postPayload: LandingPost = {
      id: initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lp_${Date.now()}`),
      type,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: category.trim(),
      content: content.trim(),
      image_url: imageUrl,
      author: 'Super Admin',
      is_published: true,
      updated_at: new Date().toISOString()
    }

    try {
      // 1. Try to persist to Supabase
      const { data, error } = await supabase
        .from('landing_posts')
        .upsert(postPayload)
        .select()
        .maybeSingle()

      if (error) {
        console.warn('Supabase upsert warning, saving to localStorage as fallback:', error)
      }

      // 2. Also persist in localStorage for resilience & offline fallback
      try {
        const rawLocal = localStorage.getItem('bdtbt_landing_posts')
        const currentList: LandingPost[] = rawLocal ? JSON.parse(rawLocal) : []
        const existingIdx = currentList.findIndex(p => p.id === postPayload.id)
        if (existingIdx >= 0) {
          currentList[existingIdx] = postPayload
        } else {
          currentList.unshift(postPayload)
        }
        localStorage.setItem('bdtbt_landing_posts', JSON.stringify(currentList))
      } catch (storageErr) {
        console.warn('LocalStorage save error:', storageErr)
      }

      onSaved(postPayload)
      onClose()
    } catch (err: any) {
      console.error('Save error:', err)
      // Even if network fails, use local storage fallback
      onSaved(postPayload)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted || !isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-yellow-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
              {type === 'article' ? <FileText className="w-5 h-5" /> : type === 'block' ? <Layers className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {initialData ? 'Edit Konten Landing Page' : 'Tambah Konten Baru Landing Page'}
              </h3>
              <p className="text-xs text-gray-400">
                Khusus Super Admin • Otomatis dikonversi ke format WebP ringan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Tipe Konten
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('article')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  type === 'article'
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                    : 'bg-slate-800/80 text-gray-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Artikel / Berita</span>
              </button>
              <button
                type="button"
                onClick={() => setType('block')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  type === 'block'
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                    : 'bg-slate-800/80 text-gray-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Blok Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setType('gallery')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1.5 ${
                  type === 'gallery'
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                    : 'bg-slate-800/80 text-gray-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Foto Simulator</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Judul {type === 'article' ? 'Artikel' : type === 'block' ? 'Blok Konten' : 'Foto'} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'article'
                  ? 'Contoh: Penerapan Inovasi VR Peledakan di Diklat Sawahlunto'
                  : type === 'block'
                  ? 'Contoh: Fasilitas Laboratorium Virtual Reality BDTBT'
                  : 'Contoh: Suasana Pengujian Tembak Skenario Tambang'
              }
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm"
            />
          </div>

          {/* Category & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Kategori / Tag Badge
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: Berita Diklat, Pengumuman, Modul VR"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Subjudul / Keterangan Singkat
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Contoh: Sawahlunto • Edisi 2024"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-xs"
              />
            </div>
          </div>

          {/* Content / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Isi Konten / Deskripsi Lengkap
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan isi artikel, penjelasan detail blok, atau keterangan foto..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm leading-relaxed"
            />
          </div>

          {/* Image Upload with Automatic WebP Conversion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                Unggah Foto / Gambar <span className="text-yellow-400 font-semibold">(Auto-Convert to WebP)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Foto</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {!imageUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-yellow-400/70 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-950 group"
              >
                {isConverting ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-2">
                    <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                    <p className="text-xs text-yellow-300 font-bold">Mengonversi gambar ke format WebP...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-200">Klik untuk memilih gambar dari perangkat</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Mendukung PNG, JPG, JPEG, GIF. Otomatis dikonversi ke WebP berkualitas tinggi & ringan.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 aspect-video bg-black max-h-56">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-black/80 hover:bg-black text-yellow-400 border border-yellow-400/40 rounded-xl text-xs font-bold backdrop-blur-sm transition-colors"
                    >
                      Ganti Foto
                    </button>
                  </div>
                </div>

                {/* Conversion Stats Banner */}
                {uploadStats && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-400">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Dikonversi ke <strong>WebP</strong>: {formatBytes(uploadStats.originalSize)} ➔{' '}
                        <strong>{formatBytes(uploadStats.webpSize)}</strong>
                      </span>
                    </div>
                    {uploadStats.compressionRatio > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-400/20 rounded-md font-bold text-[10px]">
                        Hemat {uploadStats.compressionRatio}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || isConverting}
              className="px-6 py-2.5 bg-[#FFF000] hover:bg-yellow-400 text-black rounded-xl text-xs font-black transition-all flex items-center space-x-2 shadow-lg disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>Simpan Konten</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
