'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Edit3,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Globe,
  Sparkles,
  Info,
  X,
  Loader2,
  Copy,
  Layers,
  Check,
  Table as TableIcon,
  LayoutGrid,
  CheckSquare,
  Square,
  Search,
  CheckCheck
} from 'lucide-react'
import {
  DEFAULT_BENCHMARK_DELAYS,
  fetchStandardDelayData,
  saveGlobalStandardDelays
} from '@/lib/examHelpers'

export interface DelayDiagramProps {
  delayData?: any // Can be array, matrix, or object from Unreal Engine
  title?: string
  studentId?: string
  studentName?: string
  isAdminView?: boolean
  isGlobalMode?: boolean // True when opened from Dashboard to edit Global Standard
  onDataUpdated?: (updatedDelayData: any) => void
}

export interface FormationSection {
  id: string
  label: string
  shortLabel: string
  description: string
  holes: number[]
  defaultVal: number
}

// Section definitions for batch edits & table grouping (covers all 66 holes)
const SECTIONS: FormationSection[] = [
  {
    id: 'box_cut',
    label: 'Box Cut (Area Tengah / V-Cut)',
    shortLabel: 'Box Cut (11)',
    description: 'Hole 0 sampai 10 di area tengah terowongan',
    holes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    defaultVal: 50,
  },
  {
    id: 'floor',
    label: 'Lantai / Lifters (Dasar Terowongan)',
    shortLabel: 'Lantai (7)',
    description: 'Hole 11 sampai 17 di baris lantai terbawah',
    holes: [11, 12, 13, 14, 15, 16, 17],
    defaultVal: 200,
  },
  {
    id: 'walls_left',
    label: 'Dinding Sisi Kiri (Left Wall)',
    shortLabel: 'Dinding Kiri (6)',
    description: 'Hole 18, 25, 31, 38, 45, 52',
    holes: [18, 25, 31, 38, 45, 52],
    defaultVal: 150,
  },
  {
    id: 'walls_right',
    label: 'Dinding Sisi Kanan (Right Wall)',
    shortLabel: 'Dinding Kanan (6)',
    description: 'Hole 24, 30, 37, 44, 51, 58',
    holes: [24, 30, 37, 44, 51, 58],
    defaultVal: 150,
  },
  {
    id: 'roof',
    label: 'Atap / Roof (Lengkung Terowongan)',
    shortLabel: 'Atap / Roof (7)',
    description: 'Hole 59 sampai 65 kontur kubah atap',
    holes: [59, 60, 61, 62, 63, 64, 65],
    defaultVal: 175,
  },
  {
    id: 'grid_upper',
    label: 'Grid Peledakan Atas (Row 1 - 2)',
    shortLabel: 'Grid Atas (10)',
    description: 'Hole 46-50 (Row 2) & Hole 53-57 (Row 1)',
    holes: [46, 47, 48, 49, 50, 53, 54, 55, 56, 57],
    defaultVal: 125,
  },
  {
    id: 'grid_lower',
    label: 'Grid Peledakan Bawah (Row 3 - 6)',
    shortLabel: 'Grid Bawah (19)',
    description: 'Hole 19-23, 26-29, 32-36, 39-43',
    holes: [19, 20, 21, 22, 23, 26, 27, 28, 29, 32, 33, 34, 35, 36, 39, 40, 41, 42, 43],
    defaultVal: 75,
  },
]

const QUICK_PRESETS = [0, 25, 50, 75, 100, 125, 150, 175, 200, 250]

export const DelayDiagramUI = React.memo(function DelayDiagramUI({
  delayData,
  title,
  studentId,
  studentName,
  isAdminView = false,
  isGlobalMode = false,
  onDataUpdated,
}: DelayDiagramProps) {
  // 1. Extract simulation delay values (66 numbers from VR simulator)
  const simulatedFlat: number[] = useMemo(() => {
    let raw = delayData
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch (e) {
        raw = null
      }
    }
    if (!raw) return new Array(66).fill(0)

    if (Array.isArray(raw)) {
      if (typeof raw[0] === 'number' || (raw.length > 1 && typeof raw[1] === 'number')) {
        return raw.map((v) => Number(v) || 0)
      }
    }

    if (typeof raw === 'object') {
      if (Array.isArray(raw.simulation_delays)) {
        return raw.simulation_delays.map((v: any) => Number(v) || 0)
      }
      if (Array.isArray(raw.delay_data)) {
        return raw.delay_data.map((v: any) => Number(v) || 0)
      }
      // Check if numbered keys '0'..'65' exist
      if ('0' in raw && '1' in raw) {
        const arr = []
        for (let i = 0; i < 66; i++) {
          arr.push(Number(raw[i]) || 0)
        }
        return arr
      }
    }

    return new Array(66).fill(0)
  }, [delayData])

  // 2. Target Delays State: Always evaluates against the Global Standard
  const [targetDelays, setTargetDelays] = useState<number[]>(DEFAULT_BENCHMARK_DELAYS)
  
  // In Global Mode, edit is ALWAYS active; in per-exam evaluation, edit is OFF (tidak ada edit per ujian)
  const [selectedHoles, setSelectedHoles] = useState<number[]>([])
  const [manualInputValue, setManualInputValue] = useState<string>('')
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual')
  const [showBatchEditor, setShowBatchEditor] = useState<boolean>(false)
  const [tableSearch, setTableSearch] = useState<string>('')
  
  // Section manual input values
  const [sectionInputs, setSectionInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    SECTIONS.forEach((s) => {
      initial[s.id] = String(s.defaultVal)
    })
    return initial
  })

  // Status message state
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null)

  // Load global standard delay benchmark from Supabase system_settings
  useEffect(() => {
    let isMounted = true
    const loadGlobalStandard = async () => {
      try {
        const standard = await fetchStandardDelayData()
        if (isMounted && standard && standard.length >= 66) {
          setTargetDelays(standard)
        }
      } catch (e) {
        // fallback to default
      }
    }

    loadGlobalStandard()

    return () => {
      isMounted = false
    }
  }, [])

  // Helper to get hole value
  const getHole = useCallback(
    (arr: number[], holeNum: number) => {
      if (holeNum === 0) return arr[65] ?? arr[0] ?? 0
      return arr[holeNum - 1] ?? 0
    },
    []
  )

  // Helper to set single hole value
  const handleSetHoleValue = useCallback((holeNum: number, value: number) => {
    if (!isGlobalMode) return
    setTargetDelays((prev) => {
      const next = [...prev]
      if (holeNum === 0) {
        next[65] = value
      } else {
        next[holeNum - 1] = value
      }
      return next
    })
  }, [isGlobalMode])

  // Helper to set multiple holes value
  const handleSetMultipleHolesValue = useCallback((holes: number[], value: number) => {
    if (!isGlobalMode) return
    setTargetDelays((prev) => {
      const next = [...prev]
      holes.forEach((holeNum) => {
        if (holeNum === 0) {
          next[65] = value
        } else {
          next[holeNum - 1] = value
        }
      })
      return next
    })
  }, [isGlobalMode])

  // Toggle single hole selection (Global Editor Only)
  const handleToggleHoleSelection = useCallback((hole: number) => {
    if (!isGlobalMode) return
    setSelectedHoles((prev) => {
      const isAlready = prev.includes(hole)
      const next = isAlready ? prev.filter((h) => h !== hole) : [...prev, hole]
      if (!isAlready && next.length === 1) {
        setManualInputValue(String(getHole(targetDelays, hole)))
      }
      return next
    })
  }, [isGlobalMode, getHole, targetDelays])

  // Select all 66 holes
  const handleSelectAllHoles = useCallback(() => {
    if (!isGlobalMode) return
    const all = []
    for (let i = 0; i <= 65; i++) all.push(i)
    setSelectedHoles(all)
    if (!manualInputValue) {
      setManualInputValue('50')
    }
  }, [isGlobalMode, manualInputValue])

  // Deselect all
  const handleClearSelection = useCallback(() => {
    setSelectedHoles([])
  }, [])

  // Toggle selection for a whole section
  const handleToggleSectionSelection = useCallback((sectionHoles: number[]) => {
    if (!isGlobalMode) return
    setSelectedHoles((prev) => {
      const allSelected = sectionHoles.every((h) => prev.includes(h))
      if (allSelected) {
        return prev.filter((h) => !sectionHoles.includes(h))
      } else {
        const union = new Set([...prev, ...sectionHoles])
        return Array.from(union)
      }
    })
  }, [isGlobalMode])

  // Apply manual input value to all selected holes
  const handleApplyManualToSelected = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isGlobalMode || selectedHoles.length === 0) return
    const num = parseInt(manualInputValue, 10)
    if (isNaN(num) || num < 0) return
    handleSetMultipleHolesValue(selectedHoles, num)
  }

  // Adjust manual input value by delta
  const handleAdjustManual = (delta: number) => {
    if (!isGlobalMode) return
    const current = parseInt(manualInputValue, 10) || 0
    const nextVal = Math.max(0, current + delta)
    setManualInputValue(String(nextVal))
    if (selectedHoles.length > 0) {
      handleSetMultipleHolesValue(selectedHoles, nextVal)
    }
  }

  // Set section value from manual input
  const handleApplySectionManual = (sectionId: string, sectionHoles: number[]) => {
    if (!isGlobalMode) return
    const valStr = sectionInputs[sectionId] ?? '50'
    const num = parseInt(valStr, 10)
    if (isNaN(num) || num < 0) return
    handleSetMultipleHolesValue(sectionHoles, num)
  }

  // Reset to standard BDTBT default
  const handleResetToDefault = () => {
    if (!isGlobalMode) return
    setTargetDelays([...DEFAULT_BENCHMARK_DELAYS])
  }

  // Save as Global Benchmark (Calls saveGlobalStandardDelays)
  const handleSaveAsGlobalStandard = async () => {
    setIsSaving(true)
    setSaveSuccessMsg(null)
    setSaveErrorMsg(null)

    try {
      const res = await saveGlobalStandardDelays(targetDelays)
      if (!res.success) {
        throw new Error(res.error || 'Gagal menyimpan acuan global.')
      }

      setSaveSuccessMsg('Berhasil menetapkan urutan ini sebagai Standar Acuan Global untuk seluruh ujian peserta!')
      if (onDataUpdated) {
        onDataUpdated(targetDelays)
      }
      setTimeout(() => setSaveSuccessMsg(null), 5000)
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan acuan global.')
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate comparison statistics
  const stats = useMemo(() => {
    let matches = 0
    for (let hole = 0; hole <= 65; hole++) {
      const sim = getHole(simulatedFlat, hole)
      const target = getHole(targetDelays, hole)
      if (sim === target) matches++
    }
    const accuracy = Math.round((matches / 66) * 100)
    return {
      matches,
      mismatches: 66 - matches,
      accuracy,
      total: 66,
    }
  }, [simulatedFlat, targetDelays, getHole])

  // Hole Label descriptor
  const getHoleName = (hole: number) => {
    if (hole === 0) return 'Hole 0 (Box Cut Tengah)'
    if (hole === 1) return 'Hole 1 (V-Cut Kiri Atas)'
    if (hole === 2) return 'Hole 2 (V-Cut Kanan Atas)'
    if (hole >= 3 && hole <= 10) return `Hole ${hole} (Box Cut Outer #${hole})`
    if (hole >= 11 && hole <= 17) return `Hole ${hole} (Lantai / Lifter #${hole - 10})`
    if ([18, 25, 31, 38, 45, 52].includes(hole)) return `Hole ${hole} (Dinding Kiri)`
    if ([24, 30, 37, 44, 51, 58].includes(hole)) return `Hole ${hole} (Dinding Kanan)`
    if (hole === 59) return 'Hole 59 (Lengkung Kiri Atas)'
    if (hole === 65) return 'Hole 65 (Lengkung Kanan Atas)'
    if (hole >= 60 && hole <= 64) return `Hole ${hole} (Atap / Roof #${hole - 59})`
    if (hole >= 53 && hole <= 57) return `Hole ${hole} (Grid Row 1 Atas)`
    if (hole >= 46 && hole <= 50) return `Hole ${hole} (Grid Row 2)`
    if (hole >= 39 && hole <= 43) return `Hole ${hole} (Grid Row 3)`
    if (hole >= 32 && hole <= 36) return `Hole ${hole} (Grid Row 4)`
    if (hole >= 26 && hole <= 29) return `Hole ${hole} (Grid Row 5)`
    if (hole >= 19 && hole <= 23) return `Hole ${hole} (Grid Row 6 Bawah)`
    return `Hole ${hole}`
  }

  // RENDER SINGLE HOLE NODE HELPER FOR SVG
  const renderHole = (
    hole: number,
    cx: number,
    cy: number,
    r: number,
    textX: number,
    textYSim: number,
    textYTarget: number,
    textAnchor: 'middle' | 'start' | 'end' = 'middle',
    fontSize = 11
  ) => {
    const simVal = getHole(simulatedFlat, hole)
    const targetVal = getHole(targetDelays, hole)
    const isMatch = simVal === targetVal
    const isSelected = isGlobalMode && selectedHoles.includes(hole)

    // Node fill color:
    // When editing Global Standard: Cyan if selected, Yellow default (#FFF000)
    // When evaluating Student Exam:
    // Green (#22C55E) if Sesuai Standar
    // Red (#EF4444) if Tidak Sesuai Standar!
    const nodeColor = isGlobalMode
      ? isSelected
        ? '#00E5FF'
        : '#FFF000'
      : isMatch
      ? '#22C55E'
      : '#EF4444'

    const glowColor = isGlobalMode
      ? isSelected
        ? '#00E5FF'
        : '#FFF000'
      : isMatch
      ? '#22C55E'
      : '#EF4444'

    return (
      <g
        key={`hole-node-${hole}`}
        className={isGlobalMode ? 'cursor-pointer' : ''}
        onClick={() => {
          if (isGlobalMode) {
            handleToggleHoleSelection(hole)
          }
        }}
      >
        {/* Invisible enlarged hit target for easy clicking (No hover scale to prevent jitter) */}
        {isGlobalMode && (
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(r + 10, 16)}
            fill="transparent"
            className="cursor-pointer"
          />
        )}

        {/* Selection indicator ring when in Global Edit Mode */}
        {isSelected && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 5}
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        )}

        {/* Outer Glow */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 1.5}
          fill="none"
          stroke={glowColor}
          strokeWidth="1.5"
          opacity={isMatch ? '0.4' : '0.7'}
        />

        {/* Blast Hole Circle: Green if match, Red if mismatch! */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={nodeColor}
          stroke={isSelected ? '#FFFFFF' : '#000000'}
          strokeWidth={isSelected ? 2.5 : 1.5}
          className="transition-colors"
        />

        {/* VALUE 1 (TOP): Nilai Simulasi Peserta (atau Acuan Standar jika di Global Editor) */}
        <text
          x={textX}
          y={textYSim}
          fill="#FFFFFF"
          fontSize={fontSize}
          fontWeight="bold"
          fontFamily="monospace"
          textAnchor={textAnchor}
          filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.95))"
        >
          {isGlobalMode ? `${targetVal} ms` : `${simVal} ms`}
        </text>

        {/* VALUE 2 (BOTTOM): Nilai Standar Acuan Global (Merah jika selisih, Hijau jika sesuai) */}
        {!isGlobalMode && (
          <text
            x={textX}
            y={textYTarget}
            fill={isMatch ? '#86EFAC' : '#FCA5A5'}
            fontSize={fontSize - 1.5}
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor={textAnchor}
            filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.95))"
            className="select-none"
          >
            Std: {targetVal} ms
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-[#120418] via-[#090a12] to-[#041214] text-white p-3 sm:p-6 rounded-3xl border border-gray-800 shadow-2xl select-none font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isGlobalMode ? (
              <span className="text-[10px] font-black tracking-widest text-slate-950 uppercase bg-[#FFF000] px-3 py-1 rounded-md border border-yellow-300 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-950" />
                PENGATURAN STANDAR ACUAN GLOBAL (UNTUK SEMUA UJIAN PESERTA)
              </span>
            ) : (
              <span className="text-[10px] font-black tracking-widest text-[#FFF000] uppercase bg-black/60 px-3 py-1 rounded-md border border-yellow-500/30">
                📊 EVALUASI KESESUAIAN TERHADAP STANDAR GLOBAL
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            {isGlobalMode
              ? 'Standar Delay Peledakan BDTBT ESDM (Template Master)'
              : title || 'Diagram Setting Delay Peledakan'}
            {studentName && !isGlobalMode && (
              <span className="text-yellow-400 font-semibold text-sm">({studentName})</span>
            )}
          </h3>
        </div>

        {/* View Mode Switch (Visual vs Table) & Global Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Switch View Mode */}
          <div className="bg-slate-900 p-1 rounded-xl border border-gray-800 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'visual'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Diagram Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              {isGlobalMode ? 'Input Tabel (66 Lubang)' : 'Evaluasi Tabel (66 Lubang)'}
            </button>
          </div>

          {/* In Global Mode: Save Button right in header */}
          {isGlobalMode && (
            <button
              type="button"
              onClick={handleSaveAsGlobalStandard}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Simpan Standar Global
            </button>
          )}
        </div>
      </div>

      {/* EVALUATION COMPARISON SUMMARY BAR (Only in Per-Exam View) */}
      {!isGlobalMode && (
        <div className="mb-5 p-3.5 bg-slate-900/80 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          
          {/* Comparison Legend: Green for Match, Red for Mismatch */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider">Keterangan:</span>
            
            <div className="flex items-center gap-1.5 bg-green-950/60 px-2.5 py-1 rounded-lg border border-green-600/40">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
              <span className="text-green-400 font-bold">Hijau: Sesuai Standar</span>
            </div>

            <div className="flex items-center gap-1.5 bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-600/40">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
              <span className="text-red-400 font-bold">Merah: Tidak Sesuai Standar</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-300 pl-1 border-l border-gray-800">
              <span className="text-gray-400 font-medium text-[11px]">Format Nilai:</span>
              <span className="text-white font-semibold text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-gray-700">Atas = Simulasi</span>
              <span className="text-gray-300 font-semibold text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-gray-700">Bawah = Standar (Std)</span>
            </div>
          </div>

          {/* Quick Accuracy Score */}
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-gray-800">
            <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Tingkat Kesesuaian Standar</div>
              <div className={`text-sm font-black font-mono ${stats.mismatches === 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.matches} / {stats.total} Sesuai ({stats.accuracy}%)
              </div>
            </div>
            <div className={`p-1.5 rounded-lg border ${
              stats.mismatches === 0 
                ? 'bg-green-950/80 text-green-400 border-green-600/50' 
                : 'bg-red-950/80 text-red-400 border-red-600/50'
            }`}>
              {stats.mismatches === 0 ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            </div>
          </div>

        </div>
      )}

      {/* NOTIFICATION MESSAGES */}
      {saveSuccessMsg && (
        <div className="mb-4 p-3 bg-green-950/80 border border-green-500/50 rounded-2xl text-xs text-green-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setSaveSuccessMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveErrorMsg && (
        <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span className="font-semibold">{saveErrorMsg}</span>
          </div>
          <button type="button" onClick={() => setSaveErrorMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GLOBAL STANDARD EDITING TOOLBAR (Only shown in Global Standard Mode) */}
      {isGlobalMode && (
        <div className="mb-6 p-4 sm:p-5 bg-slate-950/95 rounded-2xl border border-cyan-500/50 shadow-2xl space-y-4 animate-in slide-in-from-top-3">
          
          {/* Top Row: Information & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800">
            <div>
              <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                Atur Nilai Standar Acuan Global BDTBT
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Pilih lubang (bisa pilih banyak atau per formasi), lalu ketik angka delay acuan yang seharusnya. Nilai ini menjadi standar penilaian untuk seluruh ujian.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded-xl border border-gray-700 font-semibold cursor-pointer flex items-center gap-1"
                title="Kembalikan semua nilai ke acuan default BDTBT ESDM"
              >
                <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />
                Reset Standar BDTBT
              </button>

              <button
                type="button"
                onClick={handleSaveAsGlobalStandard}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Simpan Standar Global
              </button>
            </div>
          </div>

          {/* Quick Selection Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-gray-300 mr-1 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              Pilih Cepat:
            </span>

            <button
              type="button"
              onClick={handleSelectAllHoles}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                selectedHoles.length === 66
                  ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-bold'
                  : 'bg-slate-900 hover:bg-slate-800 text-gray-300 border-gray-700'
              }`}
            >
              Pilih Semua (66 Lubang)
            </button>

            {SECTIONS.map((sec) => {
              const allInSec = sec.holes.every((h) => selectedHoles.includes(h))
              const someInSec = sec.holes.some((h) => selectedHoles.includes(h))
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleToggleSectionSelection(sec.holes)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                    allInSec
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-bold'
                      : someInSec
                      ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 hover:bg-slate-800 text-gray-300 border-gray-700'
                  }`}
                >
                  {sec.shortLabel}
                </button>
              )
            })}

            {selectedHoles.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800 cursor-pointer ml-auto"
              >
                Batal Pilih ({selectedHoles.length})
              </button>
            )}
          </div>

          {/* DEDICATED MANUAL INPUT ACTION BAR */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/40 shadow-inner flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Target Lubang Terpilih:
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/50">
                  {selectedHoles.length} / 66 Lubang
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                {selectedHoles.length === 0
                  ? 'Klik lingkaran lubang pada diagram, atau tombol "Pilih Cepat" di atas untuk mulai memasukkan angka.'
                  : selectedHoles.length === 66
                  ? 'Seluruh 66 lubang ledak dipilih'
                  : selectedHoles.map((h) => `#${h}`).join(', ')}
              </p>
            </div>

            {/* MANUAL NUMBER INPUT & STEPPER */}
            <form onSubmit={handleApplyManualToSelected} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-300 mr-1">Nilai Delay Standar:</span>
              
              <div className="flex items-center bg-slate-950 rounded-xl border border-cyan-500/60 p-1 shadow-md">
                <button
                  type="button"
                  onClick={() => handleAdjustManual(-25)}
                  disabled={selectedHoles.length === 0}
                  className="px-2 py-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-mono disabled:opacity-30 cursor-pointer"
                  title="Kurangi 25"
                >
                  -25
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustManual(-10)}
                  disabled={selectedHoles.length === 0}
                  className="px-2 py-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-mono disabled:opacity-30 cursor-pointer"
                  title="Kurangi 10"
                >
                  -10
                </button>

                <input
                  type="number"
                  min="0"
                  max="5000"
                  step="1"
                  disabled={selectedHoles.length === 0}
                  value={manualInputValue}
                  onChange={(e) => setManualInputValue(e.target.value)}
                  placeholder="Ketik ms..."
                  className="w-24 sm:w-28 text-center bg-transparent text-white font-mono font-extrabold text-sm px-2 py-1 outline-none border-x border-gray-800 disabled:opacity-40"
                />

                <button
                  type="button"
                  onClick={() => handleAdjustManual(10)}
                  disabled={selectedHoles.length === 0}
                  className="px-2 py-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-mono disabled:opacity-30 cursor-pointer"
                  title="Tambah 10"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustManual(25)}
                  disabled={selectedHoles.length === 0}
                  className="px-2 py-1 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-mono disabled:opacity-30 cursor-pointer"
                  title="Tambah 25"
                >
                  +25
                </button>
              </div>

              <span className="text-xs font-mono text-gray-400 font-bold">ms</span>

              <button
                type="submit"
                disabled={selectedHoles.length === 0 || !manualInputValue}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Terapkan ke {selectedHoles.length} Lubang
              </button>
            </form>

          </div>

          {/* Quick Preset Pills as optional shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-gray-400">
            <span className="font-semibold text-[11px] text-gray-400 mr-1">Shortcut Cepat:</span>
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={selectedHoles.length === 0}
                onClick={() => {
                  setManualInputValue(String(preset))
                  handleSetMultipleHolesValue(selectedHoles, preset)
                }}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-cyan-300 rounded-md border border-gray-800 text-[11px] font-mono cursor-pointer disabled:opacity-30 transition-colors"
              >
                {preset} ms
              </button>
            ))}
          </div>

        </div>
      )}

      {/* VIEW MODE 1: VISUAL DIAGRAM (TUNNEL ARCH + BOX CUT DETAIL) */}
      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* LEFT PANEL: Tunnel Arch Cross-Section Profile (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative p-2 min-w-[340px]">
            
            <div className="relative w-full max-w-[460px] aspect-[5/5.5] flex items-center justify-center p-2 bg-gray-950/40 rounded-3xl border border-gray-800/40 shadow-2xl">
              <svg viewBox="0 0 500 550" className="w-full h-full select-none overflow-visible">
                
                {/* Outer Thick Tunnel Arch Line */}
                <path
                  d="M 120 50 Q 50 50 50 120 L 50 490 L 450 490 L 450 120 Q 450 50 380 50 Z"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  filter="drop-shadow(0px 0px 8px rgba(255,255,255,0.15))"
                />

                {/* PERIMETER NODES & LABELS */}

                {/* Top Roof (5 Nodes: Holes 60, 61, 62, 63, 64) */}
                {[
                  { x: 120, hole: 60 },
                  { x: 185, hole: 61 },
                  { x: 250, hole: 62 },
                  { x: 315, hole: 63 },
                  { x: 380, hole: 64 },
                ].map(({ x, hole }) => renderHole(hole, x, 50, 6, x, 24, 37, 'middle'))}

                {/* Top-Left Curve Node (Hole 59) */}
                {renderHole(59, 68, 68, 6, 42, 56, 69, 'end')}

                {/* Top-Right Curve Node (Hole 65) */}
                {renderHole(65, 432, 68, 6, 458, 56, 69, 'start')}

                {/* Left Wall Nodes (6 Nodes: Holes 52, 45, 38, 31, 25, 18) */}
                {[
                  { y: 135, hole: 52 },
                  { y: 195, hole: 45 },
                  { y: 255, hole: 38 },
                  { y: 315, hole: 31 },
                  { y: 375, hole: 25 },
                  { y: 435, hole: 18 },
                ].map(({ y, hole }) => renderHole(hole, 50, y, 6, 35, y - 2, y + 11, 'end'))}

                {/* Right Wall Nodes (6 Nodes: Holes 58, 51, 44, 37, 30, 24) */}
                {[
                  { y: 135, hole: 58 },
                  { y: 195, hole: 51 },
                  { y: 255, hole: 44 },
                  { y: 315, hole: 37 },
                  { y: 375, hole: 30 },
                  { y: 435, hole: 24 },
                ].map(({ y, hole }) => renderHole(hole, 450, y, 6, 465, y - 2, y + 11, 'start'))}

                {/* Bottom Floor Lifter Nodes (7 Nodes: Holes 11..17) */}
                {[
                  { x: 50, hole: 11 },
                  { x: 116, hole: 12 },
                  { x: 183, hole: 13 },
                  { x: 250, hole: 14 },
                  { x: 316, hole: 15 },
                  { x: 383, hole: 16 },
                  { x: 450, hole: 17 },
                ].map(({ x, hole }) => renderHole(hole, x, 490, 6, x, 512, 525, 'middle'))}

                {/* INNER BLAST HOLE GRID (5 Cols x 6 Rows) */}

                {/* Row 1 (y=120) - Holes 53..57 */}
                {[
                  { x: 130, hole: 53 },
                  { x: 190, hole: 54 },
                  { x: 250, hole: 55 },
                  { x: 310, hole: 56 },
                  { x: 370, hole: 57 },
                ].map(({ x, hole }) => renderHole(hole, x, 120, 5, x, 97, 110, 'middle', 10.5))}

                {/* Row 2 (y=190) - Holes 46..50 */}
                {[
                  { x: 130, hole: 46 },
                  { x: 190, hole: 47 },
                  { x: 250, hole: 48 },
                  { x: 310, hole: 49 },
                  { x: 370, hole: 50 },
                ].map(({ x, hole }) => renderHole(hole, x, 190, 5, x, 207, 220, 'middle', 10.5))}

                {/* Row 3 (y=260) - Holes 39..43 */}
                {[
                  { x: 130, hole: 39 },
                  { x: 190, hole: 40 },
                  { x: 250, hole: 41 },
                  { x: 310, hole: 42 },
                  { x: 370, hole: 43 },
                ].map(({ x, hole }) => renderHole(hole, x, 260, 5, x, 277, 290, 'middle', 10.5))}

                {/* Row 4 (y=330) - Holes 32..36 */}
                {[
                  { x: 130, hole: 32 },
                  { x: 190, hole: 33 },
                  { x: 250, hole: 34 },
                  { x: 310, hole: 35 },
                  { x: 370, hole: 36 },
                ].map(({ x, hole }) => renderHole(hole, x, 330, 5, x, 347, 360, 'middle', 10.5))}

                {/* Row 5 (y=400) - Holes 26, 27, 28, 29 */}
                {[
                  { x: 130, hole: 26 },
                  { x: 190, hole: 27 },
                  { x: 310, hole: 28 },
                  { x: 370, hole: 29 },
                ].map(({ x, hole }) => renderHole(hole, x, 400, 5, x, 417, 430, 'middle', 10.5))}

                {/* Row 6 (y=455) - Holes 19..23 */}
                {[
                  { x: 130, hole: 19 },
                  { x: 190, hole: 20 },
                  { x: 250, hole: 21 },
                  { x: 310, hole: 22 },
                  { x: 370, hole: 23 },
                ].map(({ x, hole }) => renderHole(hole, x, 455, 5, x, 472, 485, 'middle', 10.5))}

                {/* OVERLAY BOX CUT AT ROW 5 CENTER (x=250, y=400) */}
                <g id="box-cut-overlay">
                  <rect x="215" y="365" width="70" height="70" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="5 4" rx="2" />
                  
                  {/* 8 Outer Mini Nodes */}
                  <circle cx="215" cy="365" r="4" fill="white" />
                  <circle cx="250" cy="365" r="4" fill="white" />
                  <circle cx="285" cy="365" r="4" fill="white" />
                  <circle cx="215" cy="400" r="4" fill="white" />
                  <circle cx="285" cy="400" r="4" fill="white" />
                  <circle cx="215" cy="435" r="4" fill="white" />
                  <circle cx="250" cy="435" r="4" fill="white" />
                  <circle cx="285" cy="435" r="4" fill="white" />

                  {/* V-Cut Dashed Lines */}
                  <line x1="250" y1="385" x2="233" y2="420" stroke="white" strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="250" y1="385" x2="267" y2="420" stroke="white" strokeWidth="2" strokeDasharray="4 3" />

                  {/* Inner Yellow Nodes */}
                  <circle cx="250" cy="385" r="5" fill="#FFFF00" stroke="#FFF000" strokeWidth="1" />
                  <circle cx="250" cy="420" r="3.5" fill="white" />
                  <circle cx="233" cy="420" r="5" fill="#FFFF00" stroke="#FFF000" strokeWidth="1" />
                  <circle cx="267" cy="420" r="5" fill="#FFFF00" stroke="#FFF000" strokeWidth="1" />
                </g>

              </svg>
            </div>
          </div>

          {/* RIGHT PANEL: DELAY BOX CUT Zoomed Detail View (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-black/40 rounded-3xl border border-gray-800/80">
            
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-widest mb-6 font-sans drop-shadow-md text-center">
              DELAY BOX CUT
            </h2>

            <div className="relative w-[290px] h-[290px] sm:w-[330px] sm:h-[330px] flex items-center justify-center p-2 bg-gray-950/60 rounded-2xl border border-gray-800/50 shadow-2xl">
              <svg viewBox="0 0 320 330" className="w-full h-full select-none overflow-visible">
                
                {/* Outer Bounding Dashed Square */}
                <rect
                  x="50"
                  y="50"
                  width="200"
                  height="200"
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeDasharray="10 8"
                  rx="4"
                />

                {/* Dashed V-Cut Inverted V Lines connecting Apex Yellow to Base Yellows */}
                <line
                  x1="150"
                  y1="100"
                  x2="105"
                  y2="205"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                />
                <line
                  x1="150"
                  y1="100"
                  x2="195"
                  y2="205"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                />

                {/* OUTER PERIMETER NODES */}

                {/* Top Row (Holes 8, 5, 9) */}
                {renderHole(8, 50, 50, 9, 50, 23, 36, 'middle', 12)}
                {renderHole(5, 150, 50, 9, 150, 23, 36, 'middle', 12)}
                {renderHole(9, 250, 50, 9, 250, 23, 36, 'middle', 12)}

                {/* Middle Side Nodes (Holes 6 & 4) */}
                {renderHole(6, 50, 150, 9, 32, 146, 159, 'end', 12)}
                {renderHole(4, 250, 150, 9, 268, 146, 159, 'start', 12)}

                {/* Bottom Row (Holes 7, 3, 10) */}
                {renderHole(7, 50, 250, 9, 50, 272, 285, 'middle', 12)}
                {renderHole(3, 150, 250, 9, 150, 272, 285, 'middle', 12)}
                {renderHole(10, 250, 250, 9, 250, 272, 285, 'middle', 12)}

                {/* INNER V-CUT NODES */}
                
                {/* Apex Yellow Node (Guide only, no text data) */}
                <circle cx="150" cy="100" r="10" fill="#FFFF00" stroke="#FFF000" strokeWidth="2" filter="drop-shadow(0px 0px 6px #FFFF00)" />

                {/* Inner Row 1: Top-Left White (Hole 1) */}
                {renderHole(1, 105, 100, 7.5, 105, 120, 133, 'middle', 11)}

                {/* Inner Row 1: Top-Right White (Hole 2) */}
                {renderHole(2, 195, 100, 7.5, 195, 120, 133, 'middle', 11)}

                {/* Inner Row 2: Center White Node (Hole 0) */}
                {renderHole(0, 150, 190, 7.5, 150, 165, 178, 'middle', 11)}

                {/* Left Base Yellow Node (Guide only, no text data) */}
                <circle cx="105" cy="205" r="10" fill="#FFFF00" stroke="#FFF000" strokeWidth="2" filter="drop-shadow(0px 0px 6px #FFFF00)" />

                {/* Right Base Yellow Node (Guide only, no text data) */}
                <circle cx="195" cy="205" r="10" fill="#FFFF00" stroke="#FFF000" strokeWidth="2" filter="drop-shadow(0px 0px 6px #FFFF00)" />

              </svg>
            </div>

            <div className="mt-6 text-center text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-[#FFF000]">🟡 Formasi Segitiga V-Cut (Initial Box Cut)</p>
              <p>Node Kuning Terhubung Garis Putus-Putus</p>
            </div>
          </div>

        </div>
      ) : (
        /* VIEW MODE 2: TABLE GRID (EDITABLE IN GLOBAL MODE, COMPARISON IN PER-EXAM VIEW) */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Table Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 rounded-2xl border border-gray-800">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari nomor lubang / nama formasi..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {isGlobalMode && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllHoles}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-gray-200 rounded-xl border border-gray-700 cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-gray-200 rounded-xl border border-gray-700 cursor-pointer"
                >
                  Bersihkan Pilihan
                </button>
              </div>
            )}
          </div>

          {/* Formations List */}
          <div className="space-y-4">
            {SECTIONS.map((sec) => {
              const filteredHoles = sec.holes.filter((h) => {
                if (!tableSearch) return true
                const query = tableSearch.toLowerCase()
                return (
                  String(h).includes(query) ||
                  getHoleName(h).toLowerCase().includes(query) ||
                  sec.label.toLowerCase().includes(query)
                )
              })

              if (filteredHoles.length === 0) return null

              const allSecSelected = isGlobalMode && sec.holes.every((h) => selectedHoles.includes(h))

              return (
                <div
                  key={`table-sec-${sec.id}`}
                  className="bg-slate-950/80 rounded-2xl border border-gray-800 overflow-hidden shadow-lg"
                >
                  {/* Section Group Header */}
                  <div className="p-3.5 bg-slate-900 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {isGlobalMode && (
                        <button
                          type="button"
                          onClick={() => handleToggleSectionSelection(sec.holes)}
                          className="text-gray-400 hover:text-cyan-400 cursor-pointer"
                          title={allSecSelected ? 'Batal pilih formasi ini' : 'Pilih semua di formasi ini'}
                        >
                          {allSecSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{sec.label}</span>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          {sec.holes.length} Lubang
                        </span>
                      </h4>
                    </div>

                    {/* Set All in this Section Quick Input (Global Editor Mode Only) */}
                    {isGlobalMode && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-semibold">Set Semua di Bagian Ini:</span>
                        <input
                          type="number"
                          min="0"
                          max="5000"
                          step="1"
                          value={sectionInputs[sec.id] ?? ''}
                          onChange={(e) =>
                            setSectionInputs((prev) => ({
                              ...prev,
                              [sec.id]: e.target.value,
                            }))
                          }
                          placeholder="ms..."
                          className="w-20 px-2 py-1 bg-slate-950 border border-gray-700 text-white font-mono font-bold text-xs rounded-lg outline-none focus:border-cyan-400 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplySectionManual(sec.id, sec.holes)}
                          className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Terapkan
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hole Rows Grid */}
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredHoles.map((hole) => {
                      const simVal = getHole(simulatedFlat, hole)
                      const targetVal = getHole(targetDelays, hole)
                      const isMatch = simVal === targetVal
                      const isSelected = isGlobalMode && selectedHoles.includes(hole)
                      const diff = targetVal - simVal

                      return (
                        <div
                          key={`table-hole-${hole}`}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500/70 shadow-sm'
                              : isGlobalMode
                              ? 'bg-slate-900/60 border-gray-800/80 hover:border-gray-700'
                              : isMatch
                              ? 'bg-green-950/20 border-green-800/40'
                              : 'bg-red-950/25 border-red-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isGlobalMode && (
                              <button
                                type="button"
                                onClick={() => handleToggleHoleSelection(hole)}
                                className="text-gray-400 hover:text-cyan-400 cursor-pointer flex-shrink-0"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-black text-white bg-slate-800 px-1.5 py-0.5 rounded border border-gray-700">
                                  #{hole}
                                </span>
                                <span className="text-[11px] font-semibold text-gray-300 truncate">
                                  {getHoleName(hole).replace(`Hole ${hole} `, '')}
                                </span>
                              </div>
                              
                              {!isGlobalMode && (
                                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                  Simulasi: <strong className="text-white">{simVal} ms</strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Direct Manual Number Input (Global Mode) or Evaluation Badge (Per-Exam Mode) */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isGlobalMode ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="5000"
                                  step="1"
                                  value={targetVal}
                                  onChange={(e) =>
                                    handleSetHoleValue(hole, parseInt(e.target.value, 10) || 0)
                                  }
                                  className="w-20 px-2 py-1 bg-slate-950 border border-cyan-500/50 text-cyan-300 font-mono font-bold text-xs rounded-lg text-center outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
                                />
                                <span className="text-[10px] font-mono text-gray-400">ms</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <div className={`text-xs font-mono font-bold ${isMatch ? 'text-green-300' : 'text-red-300'}`}>
                                  Std: {targetVal} ms
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                    isMatch
                                      ? 'bg-green-950/80 text-green-400 border-green-600/50'
                                      : 'bg-red-950/80 text-red-400 border-red-600/50'
                                  }`}
                                >
                                  {isMatch ? '✓ Sesuai' : `✕ Selisih ${diff > 0 ? `+${diff}` : diff} ms`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

    </div>
  )
})
