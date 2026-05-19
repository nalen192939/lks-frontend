import type * as XLSXType from 'xlsx-js-style'

type BookSummaryRow = {
  id?: number | string
  judul?: string
  kelas?: string
  semester?: string
  stok?: number
  created_at?: string
  updated_at?: string
  last_stok_added_at?: string
}

type XlsxModule = typeof XLSXType

const toSemesterLabel = (value?: string) => {
  if (value === 'lanjutan') return 'LANJUTAN'
  if (value === '1') return 'Semester 1'
  if (value === '2') return 'Semester 2'
  return value || '-'
}

const toMonthLabel = (row: BookSummaryRow) => {
  const rawDate = row.last_stok_added_at || row.updated_at || row.created_at
  if (!rawDate) return 'Tanpa Tanggal'

  const normalizedValue = String(rawDate).includes('T')
    ? String(rawDate)
    : String(rawDate).replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalizedValue)
  const date = new Date(hasTimezone ? normalizedValue : `${normalizedValue}Z`)

  if (Number.isNaN(date.getTime())) return 'Tanpa Tanggal'

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export const useBookExcelSummary = () => {
  const buildMonthlySummaryRows = (rows: BookSummaryRow[]) => {
    const summary = new Map<string, {
      bulan: string
      kelas: string
      semester: string
      mapel: string
      jumlahData: number
      totalStok: number
    }>()

    rows.forEach((row) => {
      const bulan = toMonthLabel(row)
      const kelas = row.kelas || '-'
      const semester = toSemesterLabel(row.semester)
      const mapel = row.judul || '-'
      const key = [bulan, kelas, semester, mapel].join('||')
      const existing = summary.get(key) || {
        bulan,
        kelas,
        semester,
        mapel,
        jumlahData: 0,
        totalStok: 0
      }

      existing.jumlahData += 1
      existing.totalStok += Number(row.stok || 0)
      summary.set(key, existing)
    })

    const summaryRows = Array.from(summary.values()).sort((a, b) => {
      return `${a.bulan}|${a.kelas}|${a.semester}|${a.mapel}`.localeCompare(`${b.bulan}|${b.kelas}|${b.semester}|${b.mapel}`)
    })
    const maxStok = Math.max(...summaryRows.map((row) => row.totalStok), 1)
    const headers = ['No', 'Bulan', 'Kelas', 'Semester', 'Mata Pelajaran', 'Jumlah Data', 'Total Stok', 'Diagram Batang']
    const tableRows = summaryRows.map((row, index) => {
      const barLength = Math.max(1, Math.round((row.totalStok / maxStok) * 30))
      return [
        index + 1,
        row.bulan,
        row.kelas,
        row.semester,
        row.mapel,
        row.jumlahData,
        row.totalStok,
        `${'█'.repeat(barLength)} ${row.totalStok}`
      ]
    })

    return {
      headers,
      tableRows
    }
  }

  const styleMonthlySummaryRange = (
    XLSX: XlsxModule,
    ws: XLSXType.WorkSheet,
    startRow: number,
    startCol: number,
    rowCount: number,
    titleCellRef: string,
    subtitleCellRef: string
  ) => {
    const thinBorder = {
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }

    if (ws[titleCellRef]) {
      ws[titleCellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 13 },
        fill: { fgColor: { rgb: '047857' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: thinBorder
      }
    }
    if (ws[subtitleCellRef]) {
      ws[subtitleCellRef].s = {
        font: { italic: true, color: { rgb: '064E3B' }, sz: 10 },
        fill: { fgColor: { rgb: 'D1FAE5' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: thinBorder
      }
    }

    for (let rowOffset = 0; rowOffset < rowCount; rowOffset += 1) {
      const row = startRow + rowOffset
      for (let colOffset = 0; colOffset <= 7; colOffset += 1) {
        const col = startCol + colOffset
        const ref = XLSX.utils.encode_cell({ r: row - 1, c: col })
        if (!ws[ref]) continue

        if (rowOffset === 0) {
          ws[ref].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
            fill: { fgColor: { rgb: '065F46' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: thinBorder
          }
          continue
        }

        ws[ref].s = {
          font: { color: { rgb: colOffset === 7 ? '166534' : '0F172A' }, bold: colOffset === 7, sz: 10 },
          fill: { fgColor: { rgb: row % 2 === 0 ? 'FFFFFF' : 'F0FDF4' } },
          alignment: { horizontal: [0, 2, 3, 5, 6].includes(colOffset) ? 'center' : 'left', vertical: 'center', wrapText: true },
          border: thinBorder
        }
        if ([5, 6].includes(colOffset)) ws[ref].z = '#,##0'
      }
    }
  }

  const addMonthlySummaryToSheet = (
    XLSX: XlsxModule,
    ws: XLSXType.WorkSheet,
    rows: BookSummaryRow[],
    reportTitle: string,
    origin = 'K1'
  ) => {
    const { headers, tableRows } = buildMonthlySummaryRows(rows)
    const originCell = XLSX.utils.decode_cell(origin)
    const titleRow = originCell.r + 1
    const subtitleRow = originCell.r + 2
    const tableHeaderRow = originCell.r + 4
    const startCol = originCell.c
    const titleCellRef = XLSX.utils.encode_cell({ r: titleRow - 1, c: startCol })
    const subtitleCellRef = XLSX.utils.encode_cell({ r: subtitleRow - 1, c: startCol })

    XLSX.utils.sheet_add_aoa(ws, [
      [reportTitle],
      ['Rekap bulanan berdasarkan kelas, semester, dan mata pelajaran/judul buku'],
      [],
      headers,
      ...tableRows
    ], { origin })

    ws['!merges'] = [
      ...(ws['!merges'] || []),
      { s: { r: titleRow - 1, c: startCol }, e: { r: titleRow - 1, c: startCol + 7 } },
      { s: { r: subtitleRow - 1, c: startCol }, e: { r: subtitleRow - 1, c: startCol + 7 } }
    ]

    const existingCols = ws['!cols'] || []
    const summaryWidths = [6, 20, 10, 14, 38, 12, 12, 38]
    summaryWidths.forEach((wch, index) => {
      existingCols[startCol + index] = { wch }
    })
    ws['!cols'] = existingCols

    styleMonthlySummaryRange(XLSX, ws, tableHeaderRow, startCol, tableRows.length + 1, titleCellRef, subtitleCellRef)
  }

  const buildMonthlySummarySheet = (XLSX: XlsxModule, rows: BookSummaryRow[], reportTitle: string) => {
    const { headers, tableRows } = buildMonthlySummaryRows(rows)
    const ws = XLSX.utils.aoa_to_sheet([
      [reportTitle],
      ['Rekap stok bulanan berdasarkan kelas, semester, dan mata pelajaran/judul buku'],
      [],
      headers,
      ...tableRows
    ])

    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 12 },
      { wch: 16 },
      { wch: 44 },
      { wch: 14 },
      { wch: 14 },
      { wch: 42 }
    ]
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
    ]

    const totalRows = tableRows.length + 4
    styleMonthlySummaryRange(XLSX, ws, 4, 0, tableRows.length + 1, 'A1', 'A2')

    if (tableRows.length > 0) {
      ws['!autofilter'] = { ref: `A4:H${totalRows}` }
    }
    ws['!freeze'] = { xSplit: 0, ySplit: 4 }

    return ws
  }

  return {
    addMonthlySummaryToSheet,
    buildMonthlySummarySheet
  }
}
