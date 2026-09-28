import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'
import { StudentData } from './StudentTable'

interface StudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<StudentData>) => Promise<void>
  initialData?: StudentData | null
}

const EVALUATION_FIELDS = [
  { key: 'safety', label: 'Safety Equipment', icon: '🦺' },
  { key: 'scaling', label: 'Scaling', icon: '⛏️' },
  { key: 'primer', label: 'Primer', icon: '💣' },
  { key: 'tie_in', label: 'Tie In', icon: '🔗' },
  { key: 'cord_cable', label: 'Cord/Cable', icon: '🔌' },
  { key: 'charging', label: 'Charging', icon: '⚡' },
  { key: 'blasting_cap', label: 'Blasting Cap', icon: '🧨' },
  { key: 'cap_line', label: 'Cap Line', icon: '🧵' },
  { key: 'ignite_blastbox', label: 'Ignite Blastbox', icon: '📦' },
  { key: 'blasting', label: 'Blasting', icon: '💥' },
  { key: 'motor_fan', label: 'Motor Fan', icon: '🌀' },
] as const

export function StudentModal({ isOpen, onClose, onSave, initialData }: StudentModalProps) {
  const [formData, setFormData] = useState<Partial<StudentData>>({
    nama: '',
    id_peserta: '',
    instansi: 'Balai Diklat Tambang Bawah Tanah',
    modul: 'Tambang Bawah Tanah',
    mode: 'Simulasi VR',
    delay_image: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '08:00',
    benar: 0,
    salah: 0,
    safety: false,
    scaling: false,
    primer: false,
    tie_in: false,
    cord_cable: false,
    charging: false,
    blasting_cap: false,
    cap_line: false,
    ignite_blastbox: false,
    blasting: false,
    motor_fan: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        id_peserta: initialData.id_peserta || '',
        instansi: initialData.instansi || 'Balai Diklat Tambang Bawah Tanah',
        mode: initialData.mode || 'Simulasi VR',
        delay_image: initialData.delay_image || '',
        safety: initialData.safety ?? false,
        scaling: initialData.scaling ?? false,
        primer: initialData.primer ?? false,
        tie_in: initialData.tie_in ?? false,
        cord_cable: initialData.cord_cable ?? false,
        charging: initialData.charging ?? false,
        blasting_cap: initialData.blasting_cap ?? false,
        cap_line: initialData.cap_line ?? false,
        ignite_blastbox: initialData.ignite_blastbox ?? false,
        blasting: initialData.blasting ?? false,
        motor_fan: initialData.motor_fan ?? false,
      })
    } else {
      setFormData({
        nama: '',
        id_peserta: '',
        instansi: 'Balai Diklat Tambang Bawah Tanah',
        modul: 'Tambang Bawah Tanah',
        mode: 'Simulasi VR',
        delay_image: '',
        tanggal: new Date().toISOString().split('T')[0],
        waktu: '08:00',
        benar: 0,
        salah: 0,
        safety: false,
        scaling: false,
        primer: false,
        tie_in: false,
        cord_cable: false,
        charging: false,
        blasting_cap: false,
        cap_line: false,
        ignite_blastbox: false,
        blasting: false,
        motor_fan: false,
      })
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleEvalField = (field: keyof StudentData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors border border-gray-100 dark:border-slate-800">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-[#1D2327]">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider font-sans">
              {initialData ? 'Edit Data Evaluasi Diklat' : 'Tambah Data Evaluasi Diklat'}
            </h2>
            <p className="text-xs text-[#FFF000]">Balai Diklat Tambang Bawah Tanah – ESDM</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          <div>
            <h3 className="text-xs font-bold text-[#CA8A04] dark:text-[#FACC15] uppercase tracking-wider mb-3 flex items-center">
              👤 Identitas Peserta & Modul
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nama Peserta Diklat</label>
                <input
                  required
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all text-sm font-medium"
                  placeholder="Masukkan nama lengkap peserta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">ID Peserta / NIP</label>
                <input
                  required
                  type="text"
                  value={formData.id_peserta || ''}
                  onChange={(e) => setFormData({ ...formData, id_peserta: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-[#EAB308] font-bold rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all uppercase text-sm"
                  placeholder="REG-2026-001"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Instansi / Perusahaan</label>
                <input
                  required
                  type="text"
                  value={formData.instansi || ''}
                  onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all text-sm font-medium"
                  placeholder="Misal: PT Freeport / BDTBT"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Modul Diklat</label>
                <input
                  required
                  type="text"
                  value={formData.modul || ''}
                  onChange={(e) => setFormData({ ...formData, modul: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all text-sm font-medium"
                  placeholder="Misal: Tambang Bawah Tanah"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mode Simulasi / Ujian</label>
                <input
                  type="text"
                  value={formData.mode || ''}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all text-sm font-medium"
                  placeholder="Misal: Mode Praktik VR / Ujian Akhir"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  🖼️ URL / Gambar Diagram Delay (Delay Image)
                </label>
                <input
                  type="text"
                  value={formData.delay_image || ''}
                  onChange={(e) => setFormData({ ...formData, delay_image: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all text-sm font-medium"
                  placeholder="Masukkan URL / Link Gambar Diagram Delay"
                />
                {formData.delay_image && /^(https?:\/\/|data:image\/|\/)/i.test(formData.delay_image.trim()) && (
                  <div className="mt-2 p-2.5 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center space-x-3 border border-gray-200 dark:border-slate-700">
                    <img
                      src={formData.delay_image}
                      alt="Preview Delay Diagram"
                      className="w-16 h-12 object-cover rounded-lg border border-yellow-500/40 shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold truncate">
                      ✓ Diagram Delay Terdeteksi & Siap Dipreview
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
                  <input
                    required
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Waktu</label>
                  <input
                    required
                    type="time"
                    value={formData.waktu}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#1D2327] focus:border-[#EAB308] outline-none transition-all text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#CA8A04] dark:text-[#FACC15] uppercase tracking-wider mb-3 flex items-center">
              📊 Skor Hasil Ujian
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50/50 dark:bg-green-900/10 p-3 rounded-2xl border border-green-200 dark:border-green-900/30">
                <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-1">Jawaban Benar</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.benar}
                  onChange={(e) => setFormData({ ...formData, benar: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 font-bold rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-lg"
                />
              </div>
              <div className="bg-red-50/50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-200 dark:border-red-900/30">
                <label className="block text-xs font-bold text-red-700 dark:text-red-400 mb-1">Jawaban Salah</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.salah}
                  onChange={(e) => setFormData({ ...formData, salah: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 font-bold rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[#CA8A04] dark:text-[#FACC15] uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-500" />
                Checklist Evaluasi Prosedur Peledakan (11 Parameter)
              </h3>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                Klik kartu untuk memilih
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EVALUATION_FIELDS.map(({ key, label, icon }) => {
                const isChecked = !!formData[key as keyof StudentData]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleEvalField(key as keyof StudentData)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      isChecked
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300 shadow-sm ring-1 ring-green-500/50'
                        : 'bg-gray-50/80 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5 min-w-0 pr-1">
                      <span className="text-sm flex-shrink-0">{icon}</span>
                      <span className="text-[11px] leading-tight font-bold whitespace-normal">{label}</span>
                    </span>
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 ml-1" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 flex-shrink-0 ml-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors text-xs uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-[#FFF000] bg-[#1D2327] border border-yellow-500/30 rounded-xl hover:bg-black font-bold transition-colors disabled:opacity-70 flex items-center shadow-lg uppercase tracking-wider text-xs"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#FFF000]" /> : null}
              {initialData ? 'Simpan Perubahan' : 'Tambah Data Evaluasi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
