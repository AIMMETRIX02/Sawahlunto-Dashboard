'use client'

import { useState, useEffect } from 'react'
import { X, Save, ShieldCheck, User, Award, CheckCircle, AlertCircle, Loader2, Briefcase } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BalaiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export const DEFAULT_SIGNER1_JABATAN = 'Instruktur / Penguji Praktik'
export const DEFAULT_SIGNER1_NAMA = 'Ahmad Fauzi, S.T., M.T.'
export const DEFAULT_SIGNER1_NIP = '19820412 200801 1 015'

export const DEFAULT_SIGNER2_JABATAN = 'Kepala Balai Diklat Tambang Bawah Tanah'
export const DEFAULT_SIGNER2_NAMA = 'Drs. H. Hendra Gunawan, M.T.'
export const DEFAULT_SIGNER2_NIP = '19780515 200312 1 002'

// Legacy alias exports for backward compatibility
export const DEFAULT_KEPALA_NAMA = DEFAULT_SIGNER2_NAMA
export const DEFAULT_KEPALA_NIP = DEFAULT_SIGNER2_NIP

export function BalaiSettingsModal({ isOpen, onClose, onSaved }: BalaiSettingsModalProps) {
  // Signer 1 (Kiri)
  const [signer1Jabatan, setSigner1Jabatan] = useState(DEFAULT_SIGNER1_JABATAN)
  const [signer1Nama, setSigner1Nama] = useState(DEFAULT_SIGNER1_NAMA)
  const [signer1Nip, setSigner1Nip] = useState(DEFAULT_SIGNER1_NIP)

  // Signer 2 (Kanan)
  const [signer2Jabatan, setSigner2Jabatan] = useState(DEFAULT_SIGNER2_JABATAN)
  const [signer2Nama, setSigner2Nama] = useState(DEFAULT_SIGNER2_NAMA)
  const [signer2Nip, setSigner2Nip] = useState(DEFAULT_SIGNER2_NIP)

  const [passingThreshold, setPassingThreshold] = useState<number>(35)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadSettings = async () => {
      setLoading(true)
      try {
        // Try localStorage first as immediate cache
        const local = localStorage.getItem('bdtbt_system_settings')
        if (local) {
          try {
            const parsed = JSON.parse(local)
            if (parsed.signer1_jabatan) setSigner1Jabatan(parsed.signer1_jabatan)
            if (parsed.signer1_nama) setSigner1Nama(parsed.signer1_nama)
            if (parsed.signer1_nip) setSigner1Nip(parsed.signer1_nip)

            if (parsed.signer2_jabatan) setSigner2Jabatan(parsed.signer2_jabatan)
            if (parsed.signer2_nama || parsed.kepala_nama) setSigner2Nama(parsed.signer2_nama || parsed.kepala_nama)
            if (parsed.signer2_nip || parsed.kepala_nip) setSigner2Nip(parsed.signer2_nip || parsed.kepala_nip)

            if (parsed.passing_threshold) setPassingThreshold(parsed.passing_threshold)
          } catch (e) {}
        }

        // Fetch from Supabase system_settings
        const { data } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle()

        if (data) {
          if (data.signer1_jabatan) setSigner1Jabatan(data.signer1_jabatan)
          if (data.signer1_nama) setSigner1Nama(data.signer1_nama)
          if (data.signer1_nip) setSigner1Nip(data.signer1_nip)

          if (data.signer2_jabatan) setSigner2Jabatan(data.signer2_jabatan)
          if (data.signer2_nama || data.kepala_nama) setSigner2Nama(data.signer2_nama || data.kepala_nama)
          if (data.signer2_nip || data.kepala_nip) setSigner2Nip(data.signer2_nip || data.kepala_nip)

          if (data.passing_threshold) setPassingThreshold(data.passing_threshold)

          // Update cache
          localStorage.setItem('bdtbt_system_settings', JSON.stringify({
            signer1_jabatan: data.signer1_jabatan || DEFAULT_SIGNER1_JABATAN,
            signer1_nama: data.signer1_nama || DEFAULT_SIGNER1_NAMA,
            signer1_nip: data.signer1_nip || DEFAULT_SIGNER1_NIP,
            signer2_jabatan: data.signer2_jabatan || DEFAULT_SIGNER2_JABATAN,
            signer2_nama: data.signer2_nama || data.kepala_nama || DEFAULT_SIGNER2_NAMA,
            signer2_nip: data.signer2_nip || data.kepala_nip || DEFAULT_SIGNER2_NIP,
            kepala_nama: data.signer2_nama || data.kepala_nama || DEFAULT_SIGNER2_NAMA,
            kepala_nip: data.signer2_nip || data.kepala_nip || DEFAULT_SIGNER2_NIP,
            passing_threshold: data.passing_threshold ?? 35
          }))
        }
      } catch (err: any) {
        console.warn('Gagal memuat pengaturan sertifikat:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)

    const cleanS1Jabatan = signer1Jabatan.trim() || DEFAULT_SIGNER1_JABATAN
    const cleanS1Nama = signer1Nama.trim() || DEFAULT_SIGNER1_NAMA
    const cleanS1Nip = signer1Nip.trim() || DEFAULT_SIGNER1_NIP

    const cleanS2Jabatan = signer2Jabatan.trim() || DEFAULT_SIGNER2_JABATAN
    const cleanS2Nama = signer2Nama.trim() || DEFAULT_SIGNER2_NAMA
    const cleanS2Nip = signer2Nip.trim() || DEFAULT_SIGNER2_NIP
    const cleanThreshold = Number(passingThreshold) || 35

    const payload = {
      signer1_jabatan: cleanS1Jabatan,
      signer1_nama: cleanS1Nama,
      signer1_nip: cleanS1Nip,
      signer2_jabatan: cleanS2Jabatan,
      signer2_nama: cleanS2Nama,
      signer2_nip: cleanS2Nip,
      kepala_nama: cleanS2Nama,
      kepala_nip: cleanS2Nip,
      passing_threshold: cleanThreshold
    }

    // Save locally immediately
    localStorage.setItem('bdtbt_system_settings', JSON.stringify(payload))

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          ...payload,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.warn('Supabase upsert warning:', error.message)
        setToast({
          message: 'Pengaturan tersimpan di sesi browser lokal. Pastikan kolom signer telah ditambahkan di tabel system_settings di Supabase.',
          type: 'success'
        })
      } else {
        setToast({ message: 'Pengaturan tanda tangan sertifikat (2 penandatangan) berhasil disimpan!', type: 'success' })
      }

      onSaved?.()
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      setToast({
        message: 'Pengaturan tersimpan di browser lokal.',
        type: 'success'
      })
      onSaved?.()
      setTimeout(() => {
        onClose()
      }, 1200)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-yellow-400 text-black rounded-xl font-bold shadow-md">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Pengaturan Penandatangan Sertifikat (2 Pihak)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Atur nama, NIP, dan jabatan penandatangan sebelah kiri & kanan sertifikat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 flex-1 overflow-y-auto">
          {toast && (
            <div className={`p-3.5 rounded-xl text-sm flex items-start space-x-2.5 ${
              toast.type === 'success' 
                ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />}
              <span>{toast.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="h-8 w-8 text-yellow-400 animate-spin mb-2" />
              <p className="text-xs">Memuat data pengaturan sertifikat...</p>
            </div>
          ) : (
            <>
              {/* Dua Kolom: Penandatangan Kiri & Kanan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Penandatangan 1 (Sebelah Kiri) */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      Penandatangan Kiri (Pengajar/Penguji)
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Jabatan
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={signer1Jabatan}
                        onChange={(e) => setSigner1Jabatan(e.target.value)}
                        placeholder="Contoh: Instruktur / Pengajar Praktik"
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={signer1Nama}
                        onChange={(e) => setSigner1Nama(e.target.value)}
                        placeholder="Contoh: Ahmad Fauzi, S.T., M.T."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      NIP / ID Instruktur
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={signer1Nip}
                        onChange={(e) => setSigner1Nip(e.target.value)}
                        placeholder="Contoh: 19820412 200801 1 015"
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Penandatangan 2 (Sebelah Kanan) */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2">
                    <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xs font-bold">2</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      Penandatangan Kanan (Kepala Balai/Pimpinan)
                    </h3>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Jabatan
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={signer2Jabatan}
                        onChange={(e) => setSigner2Jabatan(e.target.value)}
                        placeholder="Contoh: Kepala Balai Diklat Tambang Bawah Tanah"
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={signer2Nama}
                        onChange={(e) => setSigner2Nama(e.target.value)}
                        placeholder="Contoh: Drs. H. Hendra Gunawan, M.T."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                      NIP Pejabat
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={signer2Nip}
                        onChange={(e) => setSigner2Nip(e.target.value)}
                        placeholder="Contoh: 19780515 200312 1 002"
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Standar Kelulusan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Standar Kelulusan Nilai Minimal (Passing Grade)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={passingThreshold}
                  onChange={(e) => setPassingThreshold(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>

              {/* Live Preview Blok Tanda Tangan */}
              <div className="p-4 bg-amber-50 dark:bg-slate-800/40 border border-yellow-200 dark:border-yellow-900/40 rounded-2xl">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2.5">
                  Pratinjau Blok 2 Tanda Tangan Sertifikat:
                </p>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Kiri */}
                    <div className="text-center">
                      <p className="text-gray-500">Mengetahui / Menguji,</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{signer1Jabatan || DEFAULT_SIGNER1_JABATAN}</p>
                      <div className="h-10 flex items-center justify-center text-gray-300 dark:text-gray-600 italic text-[10px]">
                        (Tanda Tangan)
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white underline decoration-1 uppercase font-serif text-[11px]">
                        {signer1Nama || DEFAULT_SIGNER1_NAMA}
                      </p>
                      <p className="text-gray-500 text-[10px] font-mono">
                        NIP. {signer1Nip || DEFAULT_SIGNER1_NIP}
                      </p>
                    </div>

                    {/* Kanan */}
                    <div className="text-center">
                      <p className="text-gray-500">Sawahlunto, [Tanggal]</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{signer2Jabatan || DEFAULT_SIGNER2_JABATAN}</p>
                      <div className="h-10 flex items-center justify-center text-gray-300 dark:text-gray-600 italic text-[10px]">
                        (Tanda Tangan & Stempel)
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white underline decoration-1 uppercase font-serif text-[11px]">
                        {signer2Nama || DEFAULT_SIGNER2_NAMA}
                      </p>
                      <p className="text-gray-500 text-[10px] font-mono">
                        NIP. {signer2Nip || DEFAULT_SIGNER2_NIP}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Pengembang: <a href="https://www.aimmetrix.id/en" target="_blank" rel="noopener noreferrer" className="font-bold text-yellow-600 dark:text-yellow-400 hover:underline">AIMMETRIX</a>
            </span>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
