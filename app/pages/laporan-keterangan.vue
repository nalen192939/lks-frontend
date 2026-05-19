<template>
  <div class="min-h-screen bg-[#f7f9fc] text-slate-900">
    <header class="border-b border-slate-300 bg-white">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 class="text-2xl font-bold">Laporan Data Keterangan Rak Buku</h1>
          <p class="mt-1 text-sm text-slate-600">Format tabel mengikuti gaya laporan Excel dengan grid jelas dan ringkasan data.</p>
        </div>
        <NuxtLink
          to="/"
          class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Kembali ke CRUD
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <section class="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div class="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Laporan Reservasi Data Keterangan</h2>
            <p class="mt-2 text-sm text-slate-600">Tanggal cetak: {{ printedDate }}</p>
            <p class="mt-1 text-sm text-slate-600">
              Filter aktif:
              <span class="font-semibold text-slate-800">{{ activeFilterLabel }}</span>
            </p>
          </div>

          <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div class="rounded border border-slate-300 bg-slate-50 px-3 py-2">
              <p class="text-xs uppercase tracking-wide text-slate-500">Total Data</p>
              <p class="mt-1 text-lg font-bold">{{ filteredData.length }}</p>
            </div>
            <div class="rounded border border-slate-300 bg-slate-50 px-3 py-2">
              <p class="text-xs uppercase tracking-wide text-slate-500">Total Stok</p>
              <p class="mt-1 text-lg font-bold">{{ filteredTotalStok }}</p>
            </div>
            <div class="rounded border border-slate-300 bg-slate-50 px-3 py-2">
              <p class="text-xs uppercase tracking-wide text-slate-500">Total Halaman</p>
              <p class="mt-1 text-lg font-bold">{{ summaryTotalPages }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              v-model="selectedKelas"
              class="rounded border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
            >
              <option value="">Semua Kelas</option>
              <option v-for="option in kelasOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari data laporan..."
              class="rounded border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
            />
            <select
              v-model="searchCategory"
              class="rounded border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
            >
              <option v-for="option in searchOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <button
              type="button"
              class="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              @click="clearSearch"
            >
              Reset
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              @click="exportToExcel"
            >
              Export Excel (Semua)
            </button>
            <button
              type="button"
              class="rounded border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
              :disabled="!filteredData.length"
              @click="exportFilteredToExcel"
            >
              Export Filter
            </button>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
        <div v-if="loadingData" class="p-8 text-center text-sm text-slate-500">Memuat data laporan...</div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-800 text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th class="border border-slate-300 px-3 py-2">No</th>
                <th class="border border-slate-300 px-3 py-2">ID</th>
                <th class="border border-slate-300 px-3 py-2">Nomor Rak</th>
                <th class="border border-slate-300 px-3 py-2">Nama Buku</th>
                <th class="border border-slate-300 px-3 py-2">Penerbit</th>
                <th class="border border-slate-300 px-3 py-2">Kelas</th>
                <th class="border border-slate-300 px-3 py-2">Semester</th>
                <th class="border border-slate-300 px-3 py-2">Kurikulum</th>
                <th class="border border-slate-300 px-3 py-2">Stok</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!displayedData.length">
                <td colspan="9" class="border border-slate-300 px-3 py-10 text-center text-slate-500">
                  {{ filteredData.length ? 'Halaman ini kosong.' : searchQuery || selectedKelas ? 'Data tidak ditemukan.' : 'Belum ada data laporan.' }}
                </td>
              </tr>

              <tr
                v-for="(item, index) in displayedData"
                v-else
                :key="item.id"
                :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
              >
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ rowStart + index }}</td>
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ item.id }}</td>
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ item.nomor_rak }}</td>
                <td class="border border-slate-300 px-3 py-2">
                  <div class="flex items-start gap-3">
                    <img
                      :src="getImageUrl(item.gambar)"
                      alt="Cover"
                      class="h-14 w-10 rounded border border-slate-300 object-cover"
                      @error="handleImageError"
                    />
                    <span class="font-medium text-slate-900">{{ item.judul }}</span>
                  </div>
                </td>
                <td class="border border-slate-300 px-3 py-2">{{ item.penerbit }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ item.kelas }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ item.semester === 'lanjutan' ? 'LANJUTAN' : `Semester ${item.semester}` }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ formatKurikulum(item.kurikulum) }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ item.stok || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col gap-3 border-t border-slate-300 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-slate-700">
            Halaman {{ currentPage }} / {{ totalPages }} | Menampilkan {{ displayedData.length }} dari {{ filteredData.length }} data
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              Prev
            </button>
            <button
              type="button"
              class="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import * as XLSX from 'xlsx-js-style'

const { keteranganApi: API_URL } = useApiEndpoints()
const API_ORIGIN = API_URL.replace(/\/api\/keterangan\/?$/, '')
const REPORT_TITLE = 'LAPORAN STOK LKS CV MULTI BELIMA INDO'
const REPORT_SUBTITLE = 'LAPORAN DATA KETERANGAN RAK BUKU'
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160"><rect width="120" height="160" fill="#e2e8f0"/><rect x="20" y="32" width="80" height="96" fill="#cbd5e1"/><text x="60" y="82" text-anchor="middle" font-size="12" fill="#475569" font-family="Arial, sans-serif">No Image</text></svg>')}`

const loadingData = ref(false)
const dataList = ref([])
const { downloadWorkbook } = useExcelExport()
const { buildMonthlySummarySheet } = useBookExcelSummary()

const searchQuery = ref('')
const searchCategory = ref('all')
const selectedKelas = ref('')
const itemsPerPage = ref(10)
const currentPage = ref(1)

const kelasOptions = ['UMUM', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map((kelas) => ({
  value: kelas,
  label: kelas === 'UMUM' ? 'UMUM' : `Kelas ${kelas}`
}))

const formatKurikulum = (value) => {
  if (value === 'kurikulum_merdeka') return 'Kurikulum Merdeka'
  if (value === 'kurikulum_2013') return 'Kurikulum 2013'
  if (value === 'umum') return 'UMUM'
  return value || '-'
}

const searchOptions = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'id', label: 'ID' },
  { value: 'nomor_rak', label: 'Nomor Rak' },
  { value: 'judul', label: 'Judul Buku' },
  { value: 'penerbit', label: 'Penerbit' },
  { value: 'kelas', label: 'Kelas' },
  { value: 'semester', label: 'Semester' },
  { value: 'kurikulum', label: 'Kurikulum' },
  { value: 'stok', label: 'Stok' }
]

const printedDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const filteredData = computed(() => {
  const query = searchQuery.value
  const kelas = selectedKelas.value

  return dataList.value.filter((item) => {
    if (kelas && item.kelas?.toString() !== kelas) {
      return false
    }

    if (!normalizeSearchText(query)) {
      return true
    }

    const searchableText = searchText(
      item.id,
      `ID ${item.id}`,
      item.nomor_rak,
      item.judul,
      item.penerbit,
      item.kelas,
      `Kelas ${item.kelas}`,
      item.semester,
      item.semester === 'lanjutan' ? 'LANJUTAN' : `Semester ${item.semester}`,
      item.kurikulum,
      formatKurikulum(item.kurikulum),
      item.stok
    )

    if (searchCategory.value === 'all') {
      return searchMatches(searchableText, query)
    }

    const fieldText = {
      id: searchText(item.id, `ID ${item.id}`),
      nomor_rak: item.nomor_rak,
      judul: item.judul,
      penerbit: item.penerbit,
      kelas: searchText(item.kelas, `Kelas ${item.kelas}`),
      semester: searchText(item.semester, item.semester === 'lanjutan' ? 'LANJUTAN' : `Semester ${item.semester}`),
      kurikulum: searchText(item.kurikulum, formatKurikulum(item.kurikulum)),
      stok: item.stok
    }[searchCategory.value]

    return searchMatches(fieldText, query)
  })
})

const filteredTotalStok = computed(() => {
  return filteredData.value.reduce((total, item) => total + (item.stok || 0), 0)
})

const totalPages = computed(() => {
  const pages = Math.ceil(filteredData.value.length / itemsPerPage.value)
  return pages > 0 ? pages : 1
})

const summaryTotalPages = computed(() => {
  return Math.ceil(filteredData.value.length / itemsPerPage.value) || 0
})

const rowStart = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1)

const displayedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredData.value.slice(start, end)
})

const activeFilterLabel = computed(() => {
  const queryText = searchQuery.value.trim() || 'Semua data'
  const categoryText = searchOptions.find((option) => option.value === searchCategory.value)?.label || 'Semua Kategori'
  const kelasText = kelasOptions.find((option) => option.value === selectedKelas.value)?.label || 'Semua Kelas'
  return `${queryText} (${categoryText}, ${kelasText})`
})

watch([searchQuery, searchCategory, selectedKelas], () => {
  currentPage.value = 1
})

watch(filteredData, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

const { getImageUrl } = useApiImageUrl(PLACEHOLDER_IMAGE)

const handleImageError = (event) => {
  const target = event?.target
  if (target && target.src !== PLACEHOLDER_IMAGE) {
    target.src = PLACEHOLDER_IMAGE
    target.onerror = null
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  searchCategory.value = 'all'
  selectedKelas.value = ''
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

const mapExportRows = (rows) => {
  return rows.map((item, index) => ({
    No: index + 1,
    ID: item.id,
    'Nomor Rak': item.nomor_rak,
    'Judul Buku': item.judul,
    Penerbit: item.penerbit,
    Kelas: item.kelas,
    Semester: item.semester === 'lanjutan' ? 'LANJUTAN' : item.semester === '1' ? 'Semester 1' : 'Semester 2',
    Kurikulum: formatKurikulum(item.kurikulum),
    'Stok (pcs)': item.stok || 0
  }))
}

const applyReportSheetStyle = (ws, headerRowNumber, totalRows) => {
  ws['!cols'] = [
    { wch: 6 },
    { wch: 10 },
    { wch: 18 },
    { wch: 44 },
    { wch: 24 },
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 }
  ]

  ws['!rows'] = [
    { hpx: 30 },
    { hpx: 24 },
    { hpx: 8 },
    { hpx: 22 },
    { hpx: 22 },
    { hpx: 22 },
    { hpx: 22 },
    { hpx: 22 },
    { hpx: 22 },
    { hpx: 8 },
    { hpx: 28 }
  ]

  const thinBorder = {
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }
  }

  if (ws.A1) {
    ws.A1.s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 15 },
      fill: { fgColor: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    }
  }

  if (ws.A2) {
    ws.A2.s = {
      font: { bold: true, color: { rgb: '0F172A' }, sz: 12 },
      fill: { fgColor: { rgb: 'E2E8F0' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    }
  }

  for (let row = 4; row <= 9; row += 1) {
    const keyCell = `A${row}`
    const valueCell = `B${row}`
    if (ws[keyCell]) {
      ws[keyCell].s = {
        font: { bold: true, color: { rgb: '0F172A' }, sz: 10 },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: thinBorder
      }
    }
    if (ws[valueCell]) {
      ws[valueCell].s = {
        font: { color: { rgb: '0F172A' }, sz: 10 },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
        border: thinBorder
      }
    }
  }

  const range = XLSX.utils.decode_range(ws['!ref'])
  const headerRowIndex = Math.max(0, headerRowNumber - 1)
  for (let c = range.s.c; c <= range.e.c; c += 1) {
    const headerCell = XLSX.utils.encode_cell({ r: headerRowIndex, c })
    if (!ws[headerCell]) continue

    ws[headerCell].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: '1E293B' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        left: { style: 'medium', color: { rgb: '1E293B' } },
        right: { style: 'medium', color: { rgb: '1E293B' } },
        top: { style: 'medium', color: { rgb: '1E293B' } },
        bottom: { style: 'medium', color: { rgb: '1E293B' } }
      }
    }
  }

  for (let row = headerRowNumber + 1; row <= totalRows; row += 1) {
    const rowBg = row % 2 === 0 ? 'FFFFFF' : 'F8FAFC'
    for (let col = 0; col <= 8; col += 1) {
      const ref = XLSX.utils.encode_cell({ r: row - 1, c: col })
      if (!ws[ref]) continue
      let cellBg = rowBg
      let cellFont = '0F172A'
      const centeredColumns = [0, 1, 5, 6, 7, 8]

      // Conditional color for stok column.
      if (col === 8) {
        const stokValue = Number(ws[ref].v || 0)
        if (stokValue >= 100) {
          cellBg = 'DCFCE7'
          cellFont = '166534'
        } else if (stokValue >= 50) {
          cellBg = 'FEF9C3'
          cellFont = '854D0E'
        } else if (stokValue > 0) {
          cellBg = 'FEE2E2'
          cellFont = '991B1B'
        } else {
          cellBg = 'FCA5A5'
          cellFont = '7F1D1D'
        }
      }

      ws[ref].s = {
        font: { color: { rgb: cellFont }, sz: 10 },
        fill: { fgColor: { rgb: cellBg } },
        alignment: { horizontal: centeredColumns.includes(col) ? 'center' : 'left', vertical: 'center', wrapText: true },
        border: thinBorder
      }
      if (col === 8) ws[ref].z = '#,##0'
    }
  }
}

const buildReportSheet = ({ rows, filterLabel }) => {
  const exportRows = mapExportRows(rows)
  const exportHeaders = ['No', 'ID', 'Nomor Rak', 'Judul Buku', 'Penerbit', 'Kelas', 'Semester', 'Kurikulum', 'Stok (pcs)']
  const exportTable = [
    exportHeaders,
    ...exportRows.map((row) => exportHeaders.map((header) => row[header]))
  ]
  const ws = XLSX.utils.aoa_to_sheet([])
  const tableHeaderRow = 11
  const tableStart = `A${tableHeaderRow}`
  const tableEndRow = tableHeaderRow + exportRows.length
  const totalStok = rows.reduce((sum, item) => sum + (item.stok || 0), 0)
  const totalPage = Math.ceil(rows.length / itemsPerPage.value) || 0

  ws.A1 = { v: REPORT_TITLE }
  ws.A2 = { v: REPORT_SUBTITLE }
  ws.A4 = { v: 'Tanggal Laporan' }
  ws.B4 = { v: printedDate.value }
  ws.A5 = { v: 'Filter Data' }
  ws.B5 = { v: filterLabel }
  ws.A6 = { v: 'Jumlah Data' }
  ws.B6 = { v: rows.length }
  ws.A7 = { v: 'Jumlah Kolom' }
  ws.B7 = { v: '9 field' }
  ws.A8 = { v: 'Total Stok' }
  ws.B8 = { v: totalStok }
  ws.A9 = { v: 'Total Halaman' }
  ws.B9 = { v: totalPage }

  XLSX.utils.sheet_add_aoa(ws, exportTable, { origin: tableStart })

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } },
    { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } },
    { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } },
    { s: { r: 7, c: 1 }, e: { r: 7, c: 3 } },
    { s: { r: 8, c: 1 }, e: { r: 8, c: 3 } }
  ]

  if (exportRows.length > 0) {
    ws['!autofilter'] = { ref: `A${tableHeaderRow}:I${tableEndRow}` }
  }
  ws['!freeze'] = { xSplit: 0, ySplit: tableHeaderRow }

  applyReportSheetStyle(ws, tableHeaderRow, Math.max(tableEndRow, tableHeaderRow))

  return ws
}

const exportToExcel = () => {
  try {
    const wb = XLSX.utils.book_new()
    const ws = buildReportSheet({
      rows: dataList.value,
      filterLabel: 'Semua Data'
    })

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Data Keterangan')
    XLSX.utils.book_append_sheet(wb, buildMonthlySummarySheet(XLSX, dataList.value, 'DIAGRAM BULANAN STOK LKS'), 'Diagram Bulanan')

    const fileName = `Laporan_Data_Keterangan_${new Date().toISOString().slice(0, 10)}.xlsx`
    downloadWorkbook(wb, fileName)

    alert(`Berhasil mengekspor ${dataList.value.length} data.`)
  } catch (error) {
    console.error('Error exporting all data:', error)
    alert('Gagal mengekspor data ke Excel.')
  }
}

const exportFilteredToExcel = () => {
  try {
    const wb = XLSX.utils.book_new()
    const ws = buildReportSheet({
      rows: filteredData.value,
      filterLabel: activeFilterLabel.value
    })

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Filter')
    XLSX.utils.book_append_sheet(wb, buildMonthlySummarySheet(XLSX, filteredData.value, 'DIAGRAM BULANAN STOK LKS FILTER'), 'Diagram Bulanan')

    const fileName = `Laporan_Data_Keterangan_Filter_${new Date().toISOString().slice(0, 10)}.xlsx`
    downloadWorkbook(wb, fileName)

    alert(`Berhasil mengekspor ${filteredData.value.length} data hasil filter.`)
  } catch (error) {
    console.error('Error exporting filtered data:', error)
    alert('Gagal mengekspor data hasil filter ke Excel.')
  }
}

const fetchData = async () => {
  loadingData.value = true
  try {
    const response = await fetch(API_URL)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    dataList.value = await response.json()
  } catch (error) {
    console.error('Error fetching report data:', error)
    alert('Gagal memuat data laporan dari server.')
  } finally {
    loadingData.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
