import { supabase } from '@/lib/supabase'

export interface StudentData {
  id: string
  nama: string
  id_peserta: string
  instansi?: string
  modul: string
  mode?: string
  delay_data?: any
  status_approval?: 'Disetujui' | 'Tidak Disetujui' | 'Sedang Di Tinjau Instruktur' | string
  catatan_instruktur?: string
  tanggal: string
  waktu: string
  benar: number
  salah: number
  safety?: boolean
  scaling?: boolean
  primer?: boolean
  tie_in?: boolean
  cord_cable?: boolean
  charging?: boolean
  blasting_cap?: boolean
  cap_line?: boolean
  ignite_blastbox?: boolean
  blasting?: boolean
  motor_fan?: boolean
  created_at?: string
}

export const EVALUATION_FIELDS = [
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

export const getCompletedSteps = (student: Partial<StudentData>): number => {
  return [
    student.safety,
    student.scaling,
    student.primer,
    student.tie_in,
    student.cord_cable,
    student.charging,
    student.blasting_cap,
    student.cap_line,
    student.ignite_blastbox,
    student.blasting,
    student.motor_fan,
  ].filter(Boolean).length
}

export function getTimeZoneLabel(waktuStr?: string): string {
  if (!waktuStr) return 'WIB'
  const upper = waktuStr.toUpperCase()
  if (upper.includes('WITA')) return 'WITA'
  if (upper.includes('WIT')) return 'WIT'
  if (upper.includes('WIB')) return 'WIB'
  
  if (typeof window !== 'undefined') {
    const offset = -new Date().getTimezoneOffset() / 60
    if (offset === 8) return 'WITA'
    if (offset === 9) return 'WIT'
  }
  return 'WIB'
}

/**
 * Normalizes a raw Supabase hasil_ujian row into StudentData.
 * Extracts status_approval and catatan_instruktur from either dedicated columns
 * or delay_data JSONB.
 */
export function normalizeStudentData(row: any): StudentData {
  if (!row) return row
  const delayData = (row.delay_data && typeof row.delay_data === 'object') ? row.delay_data : {}
  
  const status_approval = 
    row.status_approval || 
    delayData.status_approval || 
    'Sedang Di Tinjau Instruktur'

  const catatan_instruktur = 
    row.catatan_instruktur || 
    delayData.catatan_instruktur || 
    delayData.reason || 
    ''

  return {
    ...row,
    id_peserta: row.id_peserta || '',
    instansi: row.instansi || 'BDTBT ESDM',
    modul: row.modul || 'Tambang Bawah Tanah',
    mode: row.mode || 'Simulasi',
    delay_data: row.delay_data,
    status_approval,
    catatan_instruktur,
  }
}

/**
 * Updates approval status and reason with automatic fallback to JSONB
 * if status_approval / catatan_instruktur columns do not exist in Supabase schema.
 */
export async function updateExamApproval(
  id: string,
  existingDelayData: any,
  status_approval: 'Disetujui' | 'Tidak Disetujui' | 'Sedang Di Tinjau Instruktur',
  catatan_instruktur: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const mergedDelayData = {
      ...(existingDelayData && typeof existingDelayData === 'object' ? existingDelayData : {}),
      status_approval,
      catatan_instruktur,
      reason: catatan_instruktur,
      updated_at: new Date().toISOString()
    }

    // Try updating with dedicated columns first
    const primaryPayload: any = {
      delay_data: mergedDelayData,
      status_approval,
      catatan_instruktur,
    }

    const { error: primaryError } = await supabase
      .from('hasil_ujian')
      .update(primaryPayload)
      .eq('id', id)

    if (!primaryError) {
      return { success: true }
    }

    // If column missing in schema cache, fallback to updating only delay_data JSONB
    if (primaryError.message.includes('schema cache') || primaryError.message.includes('column')) {
      const fallbackPayload = {
        delay_data: mergedDelayData
      }
      const { error: fallbackError } = await supabase
        .from('hasil_ujian')
        .update(fallbackPayload)
        .eq('id', id)

      if (fallbackError) {
        return { success: false, error: fallbackError.message }
      }
      return { success: true }
    }

    return { success: false, error: primaryError.message }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan status evaluasi' }
  }
}

/**
 * Saves a student exam record (create or update) safely, avoiding schema cache errors
 * by using the standard columns and storing extra fields in delay_data JSONB.
 */
export async function saveStudentExamRecord(
  id: string | null,
  formData: Partial<StudentData>
): Promise<{ data: StudentData | null; error: string | null }> {
  try {
    const idVal = formData.id_peserta || ''
    
    // Safely embed extra properties into delay_data JSONB
    const existingDelayData = formData.delay_data && typeof formData.delay_data === 'object' ? formData.delay_data : {}
    const delayDataObj = {
      ...existingDelayData,
      status_approval: formData.status_approval || existingDelayData.status_approval || 'Sedang Di Tinjau Instruktur',
      catatan_instruktur: formData.catatan_instruktur || existingDelayData.catatan_instruktur || existingDelayData.reason || '',
    }

    const safeBasePayload: any = {
      nama: formData.nama,
      id_peserta: idVal,
      instansi: formData.instansi || 'BDTBT ESDM',
      modul: formData.modul || 'Tambang Bawah Tanah',
      mode: formData.mode || 'Simulasi',
      delay_data: delayDataObj,
      tanggal: formData.tanggal,
      waktu: formData.waktu,
      benar: formData.benar ?? 0,
      salah: formData.salah ?? 0,
      safety: !!formData.safety,
      scaling: !!formData.scaling,
      primer: !!formData.primer,
      tie_in: !!formData.tie_in,
      cord_cable: !!formData.cord_cable,
      charging: !!formData.charging,
      blasting_cap: !!formData.blasting_cap,
      cap_line: !!formData.cap_line,
      ignite_blastbox: !!formData.ignite_blastbox,
      blasting: !!formData.blasting,
      motor_fan: !!formData.motor_fan,
    }

    // Try with full payload first (in case dedicated columns exist in DB)
    const fullPayload: any = {
      ...safeBasePayload,
      status_approval: formData.status_approval || 'Sedang Di Tinjau Instruktur',
      catatan_instruktur: formData.catatan_instruktur || '',
    }

    if (id) {
      // Update
      const { data: updated, error: updateError } = await supabase
        .from('hasil_ujian')
        .update(fullPayload)
        .eq('id', id)
        .select()
        
      if (!updateError && updated && updated[0]) {
        return { data: normalizeStudentData(updated[0]), error: null }
      }

      // If failed due to missing columns in schema cache, fallback to safeBasePayload!
      if (updateError && (updateError.message.includes('schema cache') || updateError.message.includes('column'))) {
        const { data: fallbackUpdated, error: fallbackError } = await supabase
          .from('hasil_ujian')
          .update(safeBasePayload)
          .eq('id', id)
          .select()

        if (fallbackError) {
          return { data: null, error: fallbackError.message }
        }
        return { data: normalizeStudentData(fallbackUpdated?.[0] || { ...safeBasePayload, id }), error: null }
      }

      if (updateError) {
        return { data: null, error: updateError.message }
      }
      return { data: normalizeStudentData({ ...safeBasePayload, id }), error: null }
    } else {
      // Insert
      const { data: inserted, error: insertError } = await supabase
        .from('hasil_ujian')
        .insert([fullPayload])
        .select()

      if (!insertError && inserted && inserted[0]) {
        return { data: normalizeStudentData(inserted[0]), error: null }
      }

      // Fallback if missing column
      if (insertError && (insertError.message.includes('schema cache') || insertError.message.includes('column'))) {
        const { data: fallbackInserted, error: fallbackError } = await supabase
          .from('hasil_ujian')
          .insert([safeBasePayload])
          .select()

        if (fallbackError) {
          return { data: null, error: fallbackError.message }
        }
        return { data: normalizeStudentData(fallbackInserted?.[0]), error: null }
      }

      if (insertError) {
        return { data: null, error: insertError.message }
      }
      return { data: normalizeStudentData(inserted?.[0]), error: null }
    }
  } catch (err: any) {
    return { data: null, error: err.message || 'Gagal menyimpan data ujian' }
  }
}
