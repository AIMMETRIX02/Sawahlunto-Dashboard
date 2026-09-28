'use client'

import { useState, useEffect } from 'react'
import { X, Save, ShieldCheck, Building2, User, Award, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BalaiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export const DEFAULT_KEPALA_NAMA = 'Drs. H. Hendra Gunawan, M.T.'
export const DEFAULT_KEPALA_NIP = '19780515 200312 1 002'

export function BalaiSettingsModal({ isOpen, onClose, onSaved }: BalaiSettingsModalProps) {
  const [kepalaNama, setKepalaNama] = useState(DEFAULT_KEPALA_NAMA)
  const [kepalaNip, setKepalaNip] = useState(DEFAULT_KEPALA_NIP)
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
            if (parsed.kepala_nama) setKepalaNama(parsed.kepala_nama)
            if (parsed.kepala_nip) setKepalaNip(parsed.kepala_nip)
            if (parsed.passing_threshold) setPassingThreshold(parsed.passing_threshold)
          } catch (e) {
            // ignore JSON error
          }
        }

        // Fetch from Supabase system_settings
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle()

        if (data) {
          if (data.kepala_nama) setKepalaNama(data.kepala_nama)
          if (data.kepala_nip) setKepalaNip(data.kepala_nip)
          if (data.passing_threshold) setPassingThreshold(data.passing_threshold)

          // Update cache
          localStorage.setItem('bdtbt_system_settings', JSON.stringify({
            kepala_nama: data.kepala_nama || DEFAULT_KEPALA_NAMA,
            kepala_nip: data.kepala_nip || DEFAULT_KEPALA_NIP,
            passing_threshold: data.passing_threshold ?? 35
          }))
        }
      } catch (err: any) {
        console.warn('Gagal memuat pengaturan balai dari Supabase, menggunakan cache lokal:', err)
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

    const cleanNama = kepalaNama.trim() || DEFAULT_KEPALA_NAMA
    const cleanNip = kepalaNip.trim() || DEFAULT_KEPALA_NIP
    const cleanThreshold = Number(passingThreshold) || 35

    // Save locally first
    localStorage.setItem('bdtbt_system_settings', JSON.stringify({
      kepala_nama: cleanNama,
      kepala_nip: cleanNip,
      passing_threshold: cleanThreshold
    }))

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          kepala_nama: cleanNama,
          kepala_nip: cleanNip,
          passing_threshold: cleanThreshold,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.warn('Supabase upsert warning:', error.message)
        // Check if column doesn't exist yet
        if (error.message.includes('column') || error.message.includes('schema')) {
          setToast({
            message: 'Pengaturan disimpan di sesi lokal. Untuk menyimpan permanen di server, pastikan kolom kepala_nama & kepala_nip sudah ditambahkan di tabel system_settings di Supabase.',
            type: 'success'
          })
        } else {
          throw error
        }
      } else {
        setToast({ message: 'Pengaturan Kepala Balai dan Sertifikat berhasil disimpan!', type: 'success' })
      }

      onSaved?.()
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      // Even if database update fails, local storage holds the value
      setToast({
        message: 'Pengaturan tersimpan di browser lokal. (Supabase: ' + (err.message || 'Koneksi error') + ')',
        type: 'success'
      })
      onSaved?.()
      setTimeout(() => {
        onClose()
      }, 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-yellow-400 text-black rounded-xl font-bold shadow-md">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Pengaturan Kepala Balai & Sertifikat
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Data penandatangan resmi sertifikat kelulusan diklat BDTBT
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
        <form onSubmit={handleSave} className="p-6 space-y-4 flex-1 overflow-y-auto">
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
              <p className="text-xs">Memuat data pengaturan...</p>
            </div>
          ) : (
            <>
              {/* Field 1: Nama Kepala Balai */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Nama Kepala Balai Diklat & Gelar
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={kepalaNama}
                    onChange={(e) => setKepalaNama(e.target.value)}
                    placeholder="Contoh: Drs. H. Hendra Gunawan, M.T."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Nama ini akan dicetak di bawah tanda tangan sertifikat kelulusan peserta.
                </p>
              </div>

              {/* Field 2: NIP */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Nomor Induk Pegawai (NIP)
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={kepalaNip}
                    onChange={(e) => setKepalaNip(e.target.value)}
                    placeholder="Contoh: 19780515 200312 1 002"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Nomor Induk Pegawai (NIP) resmi penandatangan sertifikat.
                </p>
              </div>

              {/* Field 3: Standar Kelulusan */}
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
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Ambang batas minimal evaluasi teori/praktik untuk dinyatakan lulus sertifikasi.
                </p>
              </div>

              {/* Certificate Preview Box */}
              <div className="p-3.5 bg-amber-50 dark:bg-slate-800/40 border border-yellow-200 dark:border-yellow-900/40 rounded-2xl">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2">
                  Pratinjau Blok Tanda Tangan:
                </p>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-center text-xs">
                  <p className="text-gray-500">Sawahlunto, [Tanggal Evaluasi]</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">Kepala Balai Diklat Tambang Bawah Tanah</p>
                  <div className="h-10 flex items-center justify-center text-gray-300 dark:text-gray-600 italic text-[11px]">
                    (Tanda Tangan & Stempel Resmi)
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white underline decoration-1 uppercase font-serif">
                    {kepalaNama || DEFAULT_KEPALA_NAMA}
                  </p>
                  <p className="text-gray-500 text-[11px] font-mono">
                    NIP. {kepalaNip || DEFAULT_KEPALA_NIP}
                  </p>
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
