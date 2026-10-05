import { supabase } from '@/lib/supabase'

export interface StudentData {
  id: string
  nama: string
  id_peserta: string
  instansi?: string
  modul: string
  mode?: string
  delay_data?: any
  target_delays?: number[]
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

/**
 * Standard Theoretical Benchmark Delay sequence for BDTBT ESDM Underground Blasting.
 * Exactly 66 elements corresponding to Blueprint Holes 1..65 (flat[0..64]) and Hole 0 (flat[65]).
 */
export const DEFAULT_BENCHMARK_DELAYS: number[] = (() => {
  const arr = new Array(66).fill(0)
  // Box Cut Inner (Hole 0, 1, 2)
  arr[65] = 25 // Hole 0 (Center White)
  arr[0] = 25  // Hole 1 (Top-Left White)
  arr[1] = 25  // Hole 2 (Top-Right White)

  // Box Cut Outer (Holes 3 to 10)
  arr[2] = 50  // Hole 3 (Bottom-Center)
  arr[3] = 50  // Hole 4 (Right-Center)
  arr[4] = 50  // Hole 5 (Top-Center)
  arr[5] = 50  // Hole 6 (Left-Center)
  arr[6] = 50  // Hole 7 (Bottom-Left)
  arr[7] = 50  // Hole 8 (Top-Left)
  arr[8] = 50  // Hole 9 (Top-Right)
  arr[9] = 50  // Hole 10 (Bottom-Right)

  // Floor / Lifters (Holes 11 to 17)
  for (let i = 10; i <= 16; i++) arr[i] = 200

  // Left Wall (Holes 18, 25, 31, 38, 45, 52)
  arr[17] = 150 // Hole 18
  arr[24] = 150 // Hole 25
  arr[30] = 150 // Hole 31
  arr[37] = 150 // Hole 38
  arr[44] = 150 // Hole 45
  arr[51] = 150 // Hole 52

  // Right Wall (Holes 24, 30, 37, 44, 51, 58)
  arr[23] = 150 // Hole 24
  arr[29] = 150 // Hole 30
  arr[36] = 150 // Hole 37
  arr[43] = 150 // Hole 44
  arr[50] = 150 // Hole 51
  arr[57] = 150 // Hole 58

  // Top Roof Curves (Holes 59, 65)
  arr[58] = 175 // Hole 59 (Top-Left Curve)
  arr[64] = 175 // Hole 65 (Top-Right Curve)

  // Top Roof Contour (Holes 60 to 64)
  for (let i = 59; i <= 63; i++) arr[i] = 175

  // Grid Row 6 (Holes 19 to 23)
  for (let i = 18; i <= 22; i++) arr[i] = 75

  // Grid Row 5 (Holes 26, 27, 28, 29)
  arr[25] = 50 // Hole 26
  arr[26] = 50 // Hole 27
  arr[27] = 50 // Hole 28
  arr[28] = 50 // Hole 29

  // Grid Row 4 (Holes 32 to 36)
  for (let i = 31; i <= 35; i++) arr[i] = 75

  // Grid Row 3 (Holes 39 to 43)
  for (let i = 38; i <= 42; i++) arr[i] = 100

  // Grid Row 2 (Holes 46 to 50)
  for (let i = 45; i <= 49; i++) arr[i] = 125

  // Grid Row 1 (Holes 53 to 57)
  for (let i = 52; i <= 56; i++) arr[i] = 150

  return arr
})()

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

  const target_delays = 
    Array.isArray(delayData.target_delays) && delayData.target_delays.length >= 66
      ? delayData.target_delays
      : (Array.isArray(row.target_delay_data) ? row.target_delay_data : undefined)

  return {
    ...row,
    id_peserta: row.id_peserta || '',
    instansi: row.instansi || 'BDTBT ESDM',
    modul: row.modul || 'Tambang Bawah Tanah',
    mode: row.mode || 'Simulasi',
    delay_data: row.delay_data,
    target_delays,
    status_approval,
    catatan_instruktur,
  }
}

/**
 * Fetches the global standard delay benchmark from Supabase system_settings.
 * Falls back to DEFAULT_BENCHMARK_DELAYS if not found.
 */
export async function fetchStandardDelayData(): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('standard_delay_data, landing_config')
      .eq('id', 1)
      .maybeSingle()

    if (!error && data) {
      if (Array.isArray(data.standard_delay_data) && data.standard_delay_data.length >= 66) {
        return data.standard_delay_data
      }
      const landingCfg = data.landing_config
      if (landingCfg && Array.isArray(landingCfg.standard_delay_data) && landingCfg.standard_delay_data.length >= 66) {
        return landingCfg.standard_delay_data
      }
    }
    return DEFAULT_BENCHMARK_DELAYS
  } catch (err) {
    console.warn('[Delay Benchmark] Error fetching standard delay, using default fallback:', err)
    return DEFAULT_BENCHMARK_DELAYS
  }
}

/**
 * Saves or updates the target benchmark delays for a specific student's exam.
 * Preserves the original simulation delay array and approval data.
 */
export async function saveExamTargetDelays(
  examId: string,
  existingDelayData: any,
  targetDelays: number[]
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let baseRaw = existingDelayData
    if (typeof baseRaw === 'string') {
      try { baseRaw = JSON.parse(baseRaw) } catch (e) { baseRaw = {} }
    }
    
    const isArray = Array.isArray(baseRaw)
    const isObject = baseRaw && typeof baseRaw === 'object' && !isArray

    let simulation_delays: any = []
    if (isArray) {
      simulation_delays = baseRaw
    } else if (isObject) {
      if (Array.isArray(baseRaw.simulation_delays)) {
        simulation_delays = baseRaw.simulation_delays
      } else if ('0' in baseRaw && '1' in baseRaw) {
        simulation_delays = []
        for (let i = 0; i < 66; i++) {
          simulation_delays.push(baseRaw[i] ?? 0)
        }
      } else {
        simulation_delays = baseRaw
      }
    }

    const mergedDelayData: any = {
      ...(isObject ? baseRaw : {}),
      simulation_delays,
      target_delays: targetDelays,
      target_updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('hasil_ujian')
      .update({ delay_data: mergedDelayData })
      .eq('id', examId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: mergedDelayData }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan delay acuan' }
  }
}

/**
 * Saves the given delay sequence as the global master benchmark for all participants.
 * Stored in system_settings.
 */
export async function saveGlobalStandardDelays(
  targetDelays: number[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: current } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    const landingConfig = current?.landing_config || {}
    const updatedLandingConfig = {
      ...landingConfig,
      standard_delay_data: targetDelays,
      standard_delay_updated_at: new Date().toISOString()
    }

    // Try saving to standard_delay_data column and landing_config JSONB
    const { error: primaryError } = await supabase
      .from('system_settings')
      .update({
        standard_delay_data: targetDelays,
        landing_config: updatedLandingConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (!primaryError) {
      return { success: true }
    }

    // Fallback if column standard_delay_data does not exist in schema cache
    const { error: fallbackError } = await supabase
      .from('system_settings')
      .update({
        landing_config: updatedLandingConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)

    if (fallbackError) {
      return { success: false, error: fallbackError.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan standar acuan global' }
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
    const isArray = Array.isArray(existingDelayData)
    const baseObj = (existingDelayData && typeof existingDelayData === 'object' && !isArray)
      ? existingDelayData
      : { simulation_delays: isArray ? existingDelayData : [] }

    const mergedDelayData = {
      ...baseObj,
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
