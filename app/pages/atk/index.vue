<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 class="text-2xl font-bold">Data ATK</h1>
          <p class="mt-1 text-sm text-slate-600">Daftar data ATK. Form tambah dan edit dipisah ke halaman khusus.</p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/atk/tambah"
            class="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Tambah Data Baru
          </NuxtLink>
          <NuxtLink
            to="/laporan-atk"
            class="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Buka Halaman Laporan
          </NuxtLink>
          <button
            type="button"
            class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase text-slate-500">Total Data</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">{{ dataList.length }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase text-slate-500">Total Stok</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">{{ totalStok }}</p>
        </div>
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase text-amber-700">Stok Menipis</p>
          <p class="mt-2 text-2xl font-bold text-amber-800">{{ lowStockCount }}</p>
        </div>
        <div class="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase text-red-700">Stok Kosong</p>
          <p class="mt-2 text-2xl font-bold text-red-800">{{ emptyStockCount }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase text-slate-500">Update Terakhir</p>
          <p class="mt-2 truncate text-sm font-semibold text-slate-900">{{ latestStockActivity.name }}</p>
          <p class="text-xs text-slate-500">{{ latestStockActivity.time }}</p>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-lg font-semibold">Daftar Data</h2>
            <p class="text-sm text-slate-600">Total data: {{ dataList.length }} | Total stok: {{ totalStok }} | Stok menipis: {{ lowStockCount }}</p>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Cari data..."
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              @keydown.enter.prevent
            />
            <select
              v-model="searchCategory"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
            >
              <option v-for="option in searchOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <button
              type="button"
              class="rounded-lg border px-3 py-2 text-sm font-semibold transition"
              :class="showLowStockOnly ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
              @click="showLowStockOnly = !showLowStockOnly"
            >
              Perlu Restock
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              @click="barcodeScannerOpen = true"
            >
              Scan Barcode
            </button>
            <button
              type="button"
              class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="searchingCover"
              @click="openCoverSearch"
            >
              {{ searchingCover ? 'Mencari...' : 'Cari ATK' }}
            </button>
            <button
              v-if="coverMatchIds"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              @click="clearCoverSearch"
            >
              Reset Gambar
            </button>
          </div>
        </div>
        <p v-if="coverSearchMessage" class="mt-3 text-sm text-slate-600">{{ coverSearchMessage }}</p>
      </section>

      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div v-if="loadingData" class="p-8 text-center text-sm text-slate-500">Memuat data...</div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <tr class="bg-slate-900 text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th class="border border-slate-300 px-3 py-2">ID</th>
                <th class="border border-slate-300 px-3 py-2">Kode Barang</th>
                <th class="border border-slate-300 px-3 py-2">Barcode</th>
                <th class="border border-slate-300 px-3 py-2">Nama Barang</th>
                <th class="border border-slate-300 px-3 py-2">Kategori</th>
                <th class="border border-slate-300 px-3 py-2">Satuan</th>
                <th class="border border-slate-300 px-3 py-2">Jumlah</th>
                <th class="border border-slate-300 px-3 py-2">Stok</th>
                <th class="border border-slate-300 px-3 py-2">Merk</th>
                <th class="border border-slate-300 px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!displayedData.length">
                <td colspan="10" class="border border-slate-300 px-3 py-8 text-center text-slate-500">
                  {{ filteredData.length ? 'Halaman ini kosong.' : searchQuery ? 'Data tidak ditemukan.' : 'Belum ada data ATK.' }}
                </td>
              </tr>

              <tr
                v-for="(item, index) in displayedData"
                v-else
                :key="item.id"
                :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
              >
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ item.id }}</td>
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ item.kode_barang }}</td>
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ item.barcode || '-' }}</td>
                <td class="border border-slate-300 px-3 py-2">
                  <div class="flex items-start gap-3">
                    <img
                      :src="getImageUrl(item.gambar)"
                      alt="Gambar ATK"
                      class="h-12 w-12 rounded border border-slate-300 object-cover"
                      @error="handleImageError"
                    />
                    <span class="font-semibold text-slate-900">{{ item.nama_barang }}</span>
                  </div>
                </td>
                <td class="border border-slate-300 px-3 py-2">{{ toKategoriLabel(item.kategori) }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ item.satuan }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ item.jumlah || 0 }}</td>
                <td class="border border-slate-300 px-3 py-2">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span
                        class="rounded px-2 py-1 text-xs font-semibold"
                        :class="isLowStock(item) ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-800'"
                      >
                        {{ item.stok || 0 }}
                      </span>
                      <button
                        type="button"
                        class="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        :disabled="saving"
                        @click="kurangiStok(item)"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        class="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        :disabled="saving"
                        @click="tambahStok(item)"
                      >
                        +
                      </button>
                    </div>
                    <p v-if="isLowStock(item)" class="text-xs font-semibold text-red-600">Perlu restock</p>
                    <p class="text-xs text-slate-500">Update stok terakhir: {{ formatStockAddedAt(item.last_stok_added_at) }}</p>
                    <button
                      type="button"
                      class="text-xs font-semibold text-slate-700 underline hover:text-slate-900"
                      @click="openStockHistory(item)"
                    >
                      Riwayat stok
                    </button>
                  </div>
                </td>
                <td class="border border-slate-300 px-3 py-2 text-xs text-slate-700">
                  {{ getMerkValue(item) }}
                </td>
                <td class="border border-slate-300 px-3 py-2">
                  <div class="flex justify-center gap-2">
                    <NuxtLink
                      :to="`/atk/edit/${item.id}`"
                      class="rounded border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Edit
                    </NuxtLink>
                    <button
                      type="button"
                      class="rounded border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      :disabled="saving"
                      @click="deleteData(item.id)"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
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

    <CoverSearchModal
      :open="coverSearchOpen"
      :searching="searchingCover"
      title="Cari ATK"
      @close="coverSearchOpen = false"
      @selected="handleCoverSearch"
    />
    <StockHistoryModal
      :open="stockHistoryOpen"
      :title="stockHistoryTitle"
      :histories="stockHistories"
      :loading="loadingStockHistories"
      :format-date="formatStockAddedAt"
      @close="stockHistoryOpen = false"
    />
    <BarcodeScannerModal
      :open="barcodeScannerOpen"
      title="Scan Barcode untuk Cari ATK"
      @close="barcodeScannerOpen = false"
      @detected="handleBarcodeDetected"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useCoverImageSearch } from '../../composables/useCoverImageSearch'

const { atkApi: API_URL, authApi: API_AUTH, stockHistoriesApi: STOCK_HISTORIES_API } = useApiEndpoints()
const API_ORIGIN = API_URL.replace(/\/api\/atk\/?$/, '')
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0"/><rect x="24" y="24" width="72" height="72" fill="#cbd5e1"/><text x="60" y="64" text-anchor="middle" font-size="12" fill="#475569" font-family="Arial, sans-serif">No Image</text></svg>')}`

const router = useRouter()
const { token, currentUser, clearAuth, authHeaders } = useAuth()
const loadingData = ref(false)
const saving = ref(false)
const dataList = ref([])
const { recognizedCoverText, searchingCover, searchCoverMatches } = useCoverImageSearch()

const searchQuery = ref('')
const searchCategory = ref('all')
const showLowStockOnly = ref(false)
const itemsPerPage = ref(10)
const currentPage = ref(1)
const coverSearchOpen = ref(false)
const coverMatchIds = ref(null)
const coverSearchMessage = ref('')
const stockHistoryOpen = ref(false)
const stockHistoryTitle = ref('')
const stockHistories = ref([])
const loadingStockHistories = ref(false)
const barcodeScannerOpen = ref(false)
const searchInputRef = ref(null)
const LOW_STOCK_LIMIT = 5

const searchOptions = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'id', label: 'ID' },
  { value: 'kode_barang', label: 'Kode Barang' },
  { value: 'barcode', label: 'Barcode' },
  { value: 'nama_barang', label: 'Nama Barang' },
  { value: 'kategori', label: 'Kategori' },
  { value: 'satuan', label: 'Satuan' },
  { value: 'jumlah', label: 'Jumlah' },
  { value: 'stok', label: 'Stok' },
  { value: 'merk', label: 'Merk' }
]

const toKategoriLabel = (value) => {
  const map = {
    alat_tulis: 'Alat Tulis',
    kertas: 'Kertas',
    peralatan: 'Peralatan',
    lainnya: 'Lainnya'
  }
  return map[value] || value || '-'
}

const totalStok = computed(() => dataList.value.reduce((total, item) => total + (item.stok || 0), 0))
const lowStockCount = computed(() => dataList.value.filter((item) => isLowStock(item)).length)
const emptyStockCount = computed(() => dataList.value.filter((item) => Number(item?.stok || 0) === 0).length)
const isLowStock = (item) => Number(item?.stok || 0) <= LOW_STOCK_LIMIT
const latestStockActivity = computed(() => {
  const latest = dataList.value
    .filter((item) => item.last_stok_added_at)
    .sort((a, b) => new Date(String(b.last_stok_added_at).replace(' ', 'T')).getTime() - new Date(String(a.last_stok_added_at).replace(' ', 'T')).getTime())[0]

  return latest
    ? { name: latest.nama_barang || `ID ${latest.id}`, time: formatStockAddedAt(latest.last_stok_added_at) }
    : { name: 'Belum ada aktivitas', time: '-' }
})

const formatStockAddedAt = (value) => {
  if (!value) return '-'
  const normalizedValue = String(value).includes('T')
    ? String(value)
    : String(value).replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalizedValue)
  const date = new Date(hasTimezone ? normalizedValue : `${normalizedValue}Z`)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const filteredData = computed(() => {
  const matchedIds = coverMatchIds.value
  if (matchedIds) {
    return dataList.value
      .filter((item) => matchedIds.includes(item.id))
      .filter((item) => !showLowStockOnly.value || isLowStock(item))
      .sort((a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id))
  }

  const baseData = showLowStockOnly.value ? dataList.value.filter((item) => isLowStock(item)) : dataList.value

  if (!searchQuery.value.trim()) {
    return baseData
  }

  const query = searchQuery.value
  return baseData.filter((item) => {
    const searchableText = searchText(
      item.id,
      `ID ${item.id}`,
      item.kode_barang,
      item.barcode,
      item.nama_barang,
      item.kategori,
      toKategoriLabel(item.kategori),
      item.satuan,
      item.jumlah,
      item.stok,
      getMerkValue(item)
    )

    if (searchCategory.value === 'all') {
      return searchMatches(searchableText, query)
    }

    const fieldText = {
      id: searchText(item.id, `ID ${item.id}`),
      kode_barang: item.kode_barang,
      barcode: item.barcode,
      nama_barang: item.nama_barang,
      kategori: searchText(item.kategori, toKategoriLabel(item.kategori)),
      satuan: item.satuan,
      jumlah: item.jumlah,
      stok: item.stok,
      merk: getMerkValue(item)
    }[searchCategory.value]

    return searchMatches(fieldText, query)
  })
})

const totalPages = computed(() => {
  const pages = Math.ceil(filteredData.value.length / itemsPerPage.value)
  return pages > 0 ? pages : 1
})

const displayedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredData.value.slice(start, end)
})

watch([searchQuery, searchCategory, showLowStockOnly], () => {
  currentPage.value = 1
})

watch(filteredData, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

const { getImageUrl } = useApiImageUrl(PLACEHOLDER_IMAGE)

const getMerkValue = (item) => item?.merk || item?.keterangan || '-'

const handleImageError = (event) => {
  const target = event?.target
  if (target && target.src !== PLACEHOLDER_IMAGE) {
    target.src = PLACEHOLDER_IMAGE
    target.onerror = null
  }
}

const openCoverSearch = () => {
  coverSearchOpen.value = true
}

const clearCoverSearch = () => {
  coverMatchIds.value = null
  coverSearchMessage.value = ''
  currentPage.value = 1
}

const handleBarcodeDetected = (barcode) => {
  searchCategory.value = 'barcode'
  searchQuery.value = barcode
  coverMatchIds.value = null
  coverSearchMessage.value = ''
  currentPage.value = 1
  barcodeScannerOpen.value = false
  searchInputRef.value?.focus()
}

useBarcodeKeyboardCapture({
  onScan: handleBarcodeDetected
})

const handleCoverSearch = async (file) => {
  if (!file) return

  try {
    const searchableItems = dataList.value.map((item) => ({
      ...item,
      nama: item.nama_barang,
      merk: [item.kode_barang, item.barcode, getMerkValue(item), item.jumlah, toKategoriLabel(item.kategori), item.satuan].filter(Boolean).join(' ')
    }))
    const matches = await searchCoverMatches(file, searchableItems, API_ORIGIN)
    coverMatchIds.value = matches.map((match) => match.id)
    coverSearchMessage.value = matches.length
      ? `Hasil pencarian gambar ATK: ${matches.length} data paling mirip${recognizedCoverText.value ? ` dari teks "${recognizedCoverText.value}"` : ''}.`
      : 'Tidak ada gambar ATK yang bisa dibandingkan.'
    currentPage.value = 1
  } catch (error) {
    console.error('Error searching atk image:', error)
    alert(error.message || 'Gagal mencari data ATK lewat gambar.')
  }
}

const fetchData = async () => {
  loadingData.value = true
  try {
    const response = await fetch(API_URL)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    dataList.value = await response.json()
  } catch (error) {
    console.error('Error fetching data atk:', error)
    alert('Gagal memuat data ATK dari server.')
  } finally {
    loadingData.value = false
  }
}

const openStockHistory = async (item) => {
  stockHistoryOpen.value = true
  stockHistoryTitle.value = item.nama_barang || `ID ${item.id}`
  stockHistories.value = []
  loadingStockHistories.value = true

  try {
    const url = `${STOCK_HISTORIES_API}?item_type=atk&item_id=${encodeURIComponent(item.id)}&limit=50`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Gagal memuat riwayat stok')
    stockHistories.value = await response.json()
  } catch (error) {
    console.error('Error fetching stock histories:', error)
    alert(error.message || 'Gagal memuat riwayat stok.')
  } finally {
    loadingStockHistories.value = false
  }
}

const updateStok = async (id, newStok) => {
  try {
    const item = dataList.value.find((entry) => entry.id === id)
    if (!item) return

    const formData = new FormData()
    formData.append('kode_barang', item.kode_barang)
    formData.append('barcode', item.barcode || '')
    formData.append('nama_barang', item.nama_barang)
    formData.append('kategori', item.kategori || 'alat_tulis')
    formData.append('satuan', item.satuan || 'pcs')
    formData.append('stok', newStok)
    formData.append('merk', item.merk || item.keterangan || '')
    formData.append('jumlah', item.jumlah || 0)
    formData.append('stock_note', newStok > (item.stok || 0) ? 'Tambah stok cepat' : 'Kurang stok cepat')
    formData.append('updated_by', currentUser.value?.email || 'User')
    formData.append('_method', 'PUT')

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
        Accept: 'application/json',
        'X-User-Email': currentUser.value?.email || 'User'
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Gagal update stok')
    }

    await fetchData()
  } catch (error) {
    console.error('Error updating stok atk:', error)
    alert('Gagal mengupdate stok ATK.')
  }
}

const tambahStok = async (item) => {
  const nextStok = (item.stok || 0) + 1
  await updateStok(item.id, nextStok)
}

const kurangiStok = async (item) => {
  if ((item.stok || 0) <= 0) {
    alert('Stok sudah 0, tidak bisa dikurangi lagi.')
    return
  }

  const nextStok = item.stok - 1
  await updateStok(item.id, nextStok)
}

const deleteData = async (id) => {
  if (!confirm(`Yakin ingin menghapus data ATK dengan ID ${id}?`)) return

  saving.value = true
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Gagal menghapus data ATK')
    }

    await fetchData()
    alert('Data ATK berhasil dihapus.')
  } catch (error) {
    console.error('Error deleting data atk:', error)
    alert(`Gagal menghapus data ATK: ${error.message}`)
  } finally {
    saving.value = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const logout = async () => {
  try {
    if (token.value) {
      await fetch(`${API_AUTH}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          Accept: 'application/json'
        }
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    clearAuth()
    await router.push('/login')
  }
}

onMounted(() => {
  fetchData()
})
</script>
