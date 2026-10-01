import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { StudentData, EVALUATION_FIELDS, getCompletedSteps } from './examHelpers'
import {
  DEFAULT_SIGNER2_JABATAN,
  DEFAULT_SIGNER2_NAMA,
  DEFAULT_SIGNER2_NIP,
} from '@/components/BalaiSettingsModal'

export interface ExportOptions {
  filterModul?: string
  filterStatus?: string
  searchQuery?: string
  totalCount?: number
  passedCount?: number
  pendingCount?: number
  failedCount?: number
}

const formatDateIndo = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const getSignerInfo = () => {
  let jabatan = DEFAULT_SIGNER2_JABATAN
  let nama = DEFAULT_SIGNER2_NAMA
  let nip = DEFAULT_SIGNER2_NIP

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('bdtbt_system_settings')
    if (local) {
      try {
        const parsed = JSON.parse(local)
        if (parsed.signer2_jabatan) jabatan = parsed.signer2_jabatan
        if (parsed.signer2_nama || parsed.kepala_nama) nama = parsed.signer2_nama || parsed.kepala_nama
        if (parsed.signer2_nip || parsed.kepala_nip) nip = parsed.signer2_nip || parsed.kepala_nip
      } catch {}
    }
  }
  return { jabatan, nama, nip }
}

/**
 * Export data peserta ke format Excel (.xlsx) resmi dan terstruktur
 */
export const exportToExcel = (data: StudentData[], options: ExportOptions = {}) => {
  const wb = XLSX.utils.book_new()
  const today = new Date().toISOString().split('T')[0]
  const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  // 1. Title / Kop rows
  const titleRows = [
    ['KEMENTERIAN ENERGI DAN SUMBER DAYA MINERAL REPUBLIK INDONESIA'],
    ['BADAN PENGEMBANGAN SUMBER DAYA MANUSIA ENERGI DAN SUMBER DAYA MINERAL'],
    ['BALAI DIKLAT TAMBANG BAWAH TANAH (BDTBT) - SAWAHLUNTO'],
    ['LAPORAN HASIL EVALUASI SIMULASI UJIAN PELEDAKAN TAMBANG BAWAH TANAH'],
    [
      `Dicetak pada: ${formatDateIndo(today)} ${nowTime} WIB | Total Laporan: ${data.length} Peserta | Modul: ${options.filterModul || 'Semua'} | Status: ${options.filterStatus || 'Semua'}`,
    ],
    [], // empty row separator
  ]

  // 2. Table Headers
  const tableHeaders = [
    'No',
    'NIP / No. Registrasi',
    'Nama Peserta',
    'Instansi',
    'Modul Diklat',
    'Mode Ujian',
    'Tanggal',
    'Waktu (WIB)',
    'SOP Terpenuhi',
    'Tingkat Kepatuhan',
    'Status Kelulusan',
    'Catatan / Alasan Instruktur',
    // 11 Prosedur SOP Peledakan
    '1. Safety Equipment',
    '2. Scaling',
    '3. Primer',
    '4. Tie In',
    '5. Cord/Cable',
    '6. Charging',
    '7. Blasting Cap',
    '8. Cap Line',
    '9. Ignite Blastbox',
    '10. Blasting',
    '11. Motor Fan',
  ]

  // 3. Table Rows
  const rows = data.map((student, idx) => {
    const okCount = getCompletedSteps(student)
    const complianceRate = Math.round((okCount / 11) * 100)
    const statusLabel =
      student.status_approval === 'Disetujui'
        ? 'KOMPETEN'
        : student.status_approval === 'Tidak Disetujui'
        ? 'BELUM KOMPETEN'
        : 'SEDANG DITINJAU'

    return [
      idx + 1,
      student.id_peserta || '-',
      student.nama || '-',
      student.instansi || 'Balai Diklat Tambang Bawah Tanah',
      student.modul || 'Tambang Bawah Tanah',
      student.mode || 'Simulasi VR',
      student.tanggal || '-',
      student.waktu || '-',
      `${okCount} / 11 Prosedur`,
      `${complianceRate}%`,
      statusLabel,
      student.catatan_instruktur || '-',
      student.safety ? '✓ OK' : '- Belum',
      student.scaling ? '✓ OK' : '- Belum',
      student.primer ? '✓ OK' : '- Belum',
      student.tie_in ? '✓ OK' : '- Belum',
      student.cord_cable ? '✓ OK' : '- Belum',
      student.charging ? '✓ OK' : '- Belum',
      student.blasting_cap ? '✓ OK' : '- Belum',
      student.cap_line ? '✓ OK' : '- Belum',
      student.ignite_blastbox ? '✓ OK' : '- Belum',
      student.blasting ? '✓ OK' : '- Belum',
      student.motor_fan ? '✓ OK' : '- Belum',
    ]
  })

  // Combine All AOA
  const allAOA = [...titleRows, tableHeaders, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(allAOA)

  // Set Column Widths for a clean layout
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 20 }, // NIP
    { wch: 28 }, // Nama
    { wch: 32 }, // Instansi
    { wch: 28 }, // Modul
    { wch: 16 }, // Mode
    { wch: 14 }, // Tanggal
    { wch: 12 }, // Waktu
    { wch: 16 }, // SOP
    { wch: 16 }, // Kepatuhan
    { wch: 20 }, // Status
    { wch: 40 }, // Catatan
    // 11 Prosedur SOP
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Hasil Evaluasi Diklat')
  XLSX.writeFile(wb, `Laporan_Evaluasi_Diklat_BDTBT_${today}.xlsx`)
}

/**
 * Export data peserta ke format Dokumen PDF resmi siap cetak lengkap Kop Surat ESDM
 */
export const exportToPDF = (data: StudentData[], options: ExportOptions = {}) => {
  // Format Landscape A4: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const today = new Date().toISOString().split('T')[0]
  const todayIndo = formatDateIndo(today)
  const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const signer = getSignerInfo()

  const pageWidth = 297
  const leftMargin = 14
  const rightMargin = 14
  const contentWidth = pageWidth - leftMargin - rightMargin

  // --- Top Branding Color Bar ---
  doc.setFillColor(29, 35, 39) // ESDM Navy #1D2327
  doc.rect(0, 0, pageWidth, 4, 'F')
  doc.setFillColor(255, 240, 0) // ESDM Yellow #FFF000
  doc.rect(0, 4, pageWidth, 1.2, 'F')

  // --- Official Header / Kop Surat ---
  let y = 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(29, 35, 39)
  doc.text('KEMENTERIAN ENERGI DAN SUMBER DAYA MINERAL REPUBLIK INDONESIA', pageWidth / 2, y, {
    align: 'center',
  })

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(55, 65, 81)
  doc.text('BADAN PENGEMBANGAN SUMBER DAYA MANUSIA ENERGI DAN SUMBER DAYA MINERAL', pageWidth / 2, y, {
    align: 'center',
  })

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(29, 35, 39)
  doc.text('BALAI DIKLAT TAMBANG BAWAH TANAH (BDTBT) SAWAHLUNTO', pageWidth / 2, y, {
    align: 'center',
  })

  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'Jl. Saringan No. 1, Desa Kolok Nan Tuo, Kota Sawahlunto, Sumatera Barat | Telp: (0754) 61036',
    pageWidth / 2,
    y,
    { align: 'center' }
  )

  // --- Double Line Divider ---
  y += 3
  doc.setDrawColor(29, 35, 39)
  doc.setLineWidth(0.8)
  doc.line(leftMargin, y, pageWidth - rightMargin, y)
  y += 0.8
  doc.setDrawColor(202, 138, 4) // Gold #CA8A04
  doc.setLineWidth(0.4)
  doc.line(leftMargin, y, pageWidth - rightMargin, y)

  // --- Document Title & Filter Metadata ---
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(29, 35, 39)
  doc.text('REKAPITULASI HASIL EVALUASI UJIAN SIMULASI PELEDAKAN', pageWidth / 2, y, {
    align: 'center',
  })

  y += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(
    `Tanggal Cetak: ${todayIndo} ${nowTime} WIB   |   Modul Diklat: ${options.filterModul || 'Semua'}   |   Filter Status: ${options.filterStatus || 'Semua'}`,
    leftMargin,
    y
  )

  const passed = data.filter((s) => s.status_approval === 'Disetujui').length
  const pending = data.filter((s) => !s.status_approval || s.status_approval === 'Sedang Di Tinjau Instruktur').length
  const failed = data.filter((s) => s.status_approval === 'Tidak Disetujui').length

  doc.setFont('helvetica', 'bold')
  doc.text(
    `Total Data: ${data.length} Peserta (Kompeten: ${passed} | Sedang Ditinjau: ${pending} | Belum Kompeten: ${failed})`,
    pageWidth - rightMargin,
    y,
    { align: 'right' }
  )

  // --- Table Rows & Columns ---
  const tableData = data.map((student, idx) => {
    const okCount = getCompletedSteps(student)
    const complianceRate = Math.round((okCount / 11) * 100)
    const statusText =
      student.status_approval === 'Disetujui'
        ? 'Kompeten'
        : student.status_approval === 'Tidak Disetujui'
        ? 'Belum Kompeten'
        : 'Sedang Ditinjau'

    return [
      idx + 1,
      student.id_peserta || '-',
      student.nama || '-',
      student.instansi || 'BDTBT ESDM',
      student.modul || 'Tambang Bawah Tanah',
      `${student.tanggal}\n${student.waktu} WIB`,
      `${okCount}/11 OK\n(${complianceRate}%)`,
      statusText,
      student.catatan_instruktur || '-',
    ]
  })

  autoTable(doc, {
    startY: y + 3,
    head: [[
      'No',
      'NIP / No. Reg',
      'Nama Peserta',
      'Instansi',
      'Modul Diklat',
      'Tanggal & Waktu',
      'Kepatuhan SOP',
      'Status Kelulusan',
      'Catatan / Alasan Instruktur',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [29, 35, 39], // #1D2327
      textColor: [255, 240, 0], // #FFF000
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.2,
      lineColor: [200, 200, 200],
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      valign: 'middle',
      cellPadding: 2.2,
      lineWidth: 0.15,
      lineColor: [226, 232, 240],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },  // No
      1: { halign: 'center', cellWidth: 26, fontStyle: 'bold' }, // NIP
      2: { halign: 'left', cellWidth: 42, fontStyle: 'bold' },   // Nama
      3: { halign: 'left', cellWidth: 38 },   // Instansi
      4: { halign: 'left', cellWidth: 38 },   // Modul
      5: { halign: 'center', cellWidth: 26 }, // Tanggal & Waktu
      6: { halign: 'center', cellWidth: 24, fontStyle: 'bold' }, // SOP
      7: { halign: 'center', cellWidth: 30, fontStyle: 'bold' }, // Status
      8: { halign: 'left', cellWidth: 35 },   // Catatan
    },
    didParseCell: (hookData) => {
      // Colorize Status column in body
      if (hookData.section === 'body' && hookData.column.index === 7) {
        const val = hookData.cell.raw as string
        if (val === 'Kompeten') {
          hookData.cell.styles.textColor = [21, 128, 61] // green-700
          hookData.cell.styles.fillColor = [240, 253, 244] // green-50
        } else if (val === 'Belum Kompeten') {
          hookData.cell.styles.textColor = [185, 28, 28] // red-700
          hookData.cell.styles.fillColor = [254, 242, 242] // red-50
        } else {
          hookData.cell.styles.textColor = [180, 83, 9] // amber-700
          hookData.cell.styles.fillColor = [254, 243, 199] // amber-50
        }
      }
    },
    didDrawPage: (data) => {
      // Header for subsequent pages if multi-page
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(148, 163, 184)
        doc.text(
          'Rekapitulasi Evaluasi Ujian Diklat Peledakan – Balai Diklat Tambang Bawah Tanah ESDM',
          leftMargin,
          8
        )
      }

      // Page numbers at bottom
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Dokumen Resmi BDTBT ESDM Sawahlunto • Halaman ${data.pageNumber}`,
        leftMargin,
        205
      )
      doc.text(
        `Dicetak secara otomatis pada ${todayIndo}`,
        pageWidth - rightMargin,
        205,
        { align: 'right' }
      )
    },
    margin: { left: leftMargin, right: rightMargin, bottom: 25 },
  })

  // --- Signature Block on Final Page ---
  const finalY = (doc as any).lastAutoTable?.finalY || 150
  const remainingSpace = 205 - finalY

  // If space is tight (< 35mm), add a new page for signature
  if (remainingSpace < 38) {
    doc.addPage()
  }

  const signY = remainingSpace < 38 ? 30 : finalY + 8
  const signX = pageWidth - rightMargin - 65

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  doc.text(`Sawahlunto, ${todayIndo}`, signX, signY)
  doc.text(signer.jabatan, signX, signY + 4.5)

  doc.setFont('helvetica', 'bold')
  doc.text(signer.nama, signX, signY + 22)
  doc.line(signX, signY + 23, signX + 55, signY + 23)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`NIP. ${signer.nip}`, signX, signY + 27)

  doc.save(`Laporan_Evaluasi_Diklat_BDTBT_${today}.pdf`)
}
