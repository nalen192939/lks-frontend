<template>
  <div class="min-h-screen bg-[#f7f9fc] text-slate-900">
    <header class="border-b border-slate-300 bg-white">
      <div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 class="text-2xl font-bold">Laporan Data Barang</h1>
          <p class="mt-1 text-sm text-slate-600">Format tabel mengikuti gaya laporan Excel dengan grid jelas dan ringkasan data.</p>
        </div>
        <NuxtLink
          to="/barang"
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
            <h2 class="text-xl font-bold text-slate-900">Laporan Reservasi Data Barang</h2>
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
                <th class="border border-slate-300 px-3 py-2">ID</th>
                <th class="border border-slate-300 px-3 py-2">Nama Barang</th>
                <th class="border border-slate-300 px-3 py-2">Merk</th>
                <th class="border border-slate-300 px-3 py-2">Jumlah</th>
                <th class="border border-slate-300 px-3 py-2">Stok</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!displayedData.length">
                <td colspan="5" class="border border-slate-300 px-3 py-10 text-center text-slate-500">
                  {{ filteredData.length ? 'Halaman ini kosong.' : searchQuery ? 'Data tidak ditemukan.' : 'Belum ada data laporan.' }}
                </td>
              </tr>

              <tr
                v-for="(item, index) in displayedData"
                v-else
                :key="item.id"
                :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
              >
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ item.id }}</td>
                <td class="border border-slate-300 px-3 py-2">
                  <div class="flex items-start gap-3">
                    <img
                      :src="getImageUrl(item.gambar)"
                      alt="Barang"
                      class="h-12 w-12 rounded border border-slate-300 object-cover"
                      @error="handleImageError"
                    />
                    <span class="font-medium text-slate-900">{{ item.nama }}</span>
                  </div>
                </td>
                <td class="border border-slate-300 px-3 py-2">{{ item.merk }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ item.jumlah || 0 }}</td>
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

const { barangApi: API_URL } = useApiEndpoints()
const API_ORIGIN = API_URL.replace(/\/api\/barang\/?$/, '')
const REPORT_TITLE = 'LAPORAN STOK BARANG CV MULTI BELIMA INDO'
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0"/><rect x="24" y="24" width="72" height="72" fill="#cbd5e1"/><text x="60" y="64" text-anchor="middle" font-size="12" fill="#475569" font-family="Arial, sans-serif">No Image</text></svg>')}`

const loadingData = ref(false)
const dataList = ref([])
const { downloadWorkbook } = useExcelExport()

const searchQuery = ref('')
const searchCategory = ref('all')
const itemsPerPage = ref(10)
const currentPage = ref(1)

const searchOptions = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'id', label: 'ID' },
  { value: 'nama', label: 'Nama Barang' },
  { value: 'merk', label: 'Merk' },
  { value: 'jumlah', label: 'Jumlah' },
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
  if (!searchQuery.value.trim()) {
    return dataList.value
  }

  const query = searchQuery.value

  return dataList.value.filter((item) => {
    const searchableText = searchText(
      item.id,
      `ID ${item.id}`,
      item.nama,
      item.merk,
      item.jumlah,
      item.stok
    )

    if (searchCategory.value === 'all') {
      return searchMatches(searchableText, query)
    }

    const fieldText = {
      id: searchText(item.id, `ID ${item.id}`),
      nama: item.nama,
      merk: item.merk,
      jumlah: item.jumlah,
      stok: item.stok
    }[searchCategory.value]

    return searchMatches(fieldText, query)
  })
})

const filteredTotalStok = computed(() => filteredData.value.reduce((total, item) => total + (item.stok || 0), 0))

const totalPages = computed(() => {
  const pages = Math.ceil(filteredData.value.length / itemsPerPage.value)
  return pages > 0 ? pages : 1
})

const summaryTotalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage.value) || 0)

const displayedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredData.value.slice(start, end)
})

const activeFilterLabel = computed(() => {
  const queryText = searchQuery.value.trim() || 'Semua data'
  const categoryText = searchOptions.find((option) => option.value === searchCategory.value)?.label || 'Semua Kategori'
  return `${queryText} (${categoryText})`
})

watch([searchQuery, searchCategory], () => {
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
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const mapExportRows = (rows) => {
  return rows.map((item) => ({
    ID: item.id,
    'Nama Barang': item.nama,
    Merk: item.merk,
    Jumlah: item.jumlah || 0,
    'Stok (pcs)': item.stok || 0
  }))
}

const applyReportSheetStyle = (ws, headerRowNumber, totalRows) => {
  ws['!cols'] = [
    { wch: 8 },
    { wch: 34 },
    { wch: 24 },
    { wch: 10 },
    { wch: 12 }
  ]

  const thinBorder = {
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }
  }

  if (ws.A1) {
    ws.A1.s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
      fill: { fgColor: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    }
  }

  if (ws.A2) {
    ws.A2.s = {
      font: { bold: true, color: { rgb: '0F172A' }, sz: 11 },
      fill: { fgColor: { rgb: 'E2E8F0' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: thinBorder
    }
  }

  for (let row = 4; row <= 8; row += 1) {
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
        alignment: { horizontal: 'left', vertical: 'center' },
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
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
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
    for (let col = 0; col <= 4; col += 1) {
      const ref = XLSX.utils.encode_cell({ r: row - 1, c: col })
      if (!ws[ref]) continue
      ws[ref].s = {
        font: { color: { rgb: '0F172A' }, sz: 10 },
        fill: { fgColor: { rgb: rowBg } },
        alignment: { horizontal: col === 0 || col === 3 || col === 4 ? 'center' : 'left', vertical: 'center', wrapText: true },
        border: thinBorder
      }
    }
  }
}

const buildReportSheet = ({ rows, filterLabel }) => {
  const exportRows = mapExportRows(rows)
  const exportHeaders = ['ID', 'Nama Barang', 'Merk', 'Jumlah', 'Stok (pcs)']
  const exportTable = [
    exportHeaders,
    ...exportRows.map((row) => exportHeaders.map((header) => row[header]))
  ]
  const ws = XLSX.utils.aoa_to_sheet([])
  const tableHeaderRow = 10
  const tableStart = `A${tableHeaderRow}`
  const tableEndRow = tableHeaderRow + exportRows.length
  const totalStok = rows.reduce((sum, item) => sum + (item.stok || 0), 0)
  const totalPage = Math.ceil(rows.length / itemsPerPage.value) || 0

  ws.A1 = { v: REPORT_TITLE }
  ws.A2 = { v: 'LAPORAN DATA BARANG' }
  ws.A4 = { v: 'Tanggal Laporan' }
  ws.B4 = { v: printedDate.value }
  ws.A5 = { v: 'Filter Data' }
  ws.B5 = { v: filterLabel }
  ws.A6 = { v: 'Jumlah Data' }
  ws.B6 = { v: rows.length }
  ws.A7 = { v: 'Total Stok' }
  ws.B7 = { v: totalStok }
  ws.A8 = { v: 'Total Halaman' }
  ws.B8 = { v: totalPage }

  XLSX.utils.sheet_add_aoa(ws, exportTable, { origin: tableStart })

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ]

  if (exportRows.length > 0) {
    ws['!autofilter'] = { ref: `A${tableHeaderRow}:E${tableEndRow}` }
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

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Data Barang')
    const fileName = `Laporan_Data_Barang_${new Date().toISOString().slice(0, 10)}.xlsx`
    downloadWorkbook(wb, fileName)
    alert(`Berhasil mengekspor ${dataList.value.length} data.`)
  } catch (error) {
    console.error('Error exporting all barang data:', error)
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

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Filter Barang')
    const fileName = `Laporan_Data_Barang_Filter_${new Date().toISOString().slice(0, 10)}.xlsx`
    downloadWorkbook(wb, fileName)
    alert(`Berhasil mengekspor ${filteredData.value.length} data hasil filter.`)
  } catch (error) {
    console.error('Error exporting filtered barang data:', error)
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
    console.error('Error fetching report barang data:', error)
    alert('Gagal memuat data laporan dari server.')
  } finally {
    loadingData.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
