<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 class="text-2xl font-bold">Data Keterangan</h1>
          <p class="mt-1 text-sm text-slate-600">Daftar data buku. Form tambah dan edit dipisah ke halaman khusus.</p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/tambah-data"
            class="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Tambah Data Baru
          </NuxtLink>
          <NuxtLink
            to="/laporan-keterangan"
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
            <select
              v-model="selectedKelas"
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
            >
              <option value="">Semua Kelas</option>
              <option v-for="option in kelasOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari data..."
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
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
              class="rounded-lg border px-3 py-2 text-sm font-semibold transition"
              :class="groupByRack ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
              @click="groupByRack = !groupByRack"
            >
              Pisah per Rak
            </button>
            <button
              type="button"
              class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="searchingCover"
              @click="openCoverSearch"
            >
              {{ searchingCover ? 'Mencari...' : 'Cari Cover' }}
            </button>
            <button
              v-if="coverMatchIds"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              @click="clearCoverSearch"
            >
              Reset Cover
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
                <th class="border border-slate-300 px-3 py-2">Nomor Rak</th>
                <th class="border border-slate-300 px-3 py-2">Buku</th>
                <th class="border border-slate-300 px-3 py-2">Kelas</th>
                <th class="border border-slate-300 px-3 py-2">Semester</th>
                <th class="border border-slate-300 px-3 py-2">Kurikulum</th>
                <th class="border border-slate-300 px-3 py-2">Stok</th>
                <th class="border border-slate-300 px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredData.length">
                <td colspan="8" class="border border-slate-300 px-3 py-8 text-center text-slate-500">
                  {{ searchQuery || selectedKelas ? 'Data tidak ditemukan.' : 'Belum ada data.' }}
                </td>
              </tr>

              <tr
                v-for="(item, index) in displayedData"
                v-else
                :key="item.id"
                :class="[
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50',
                  shouldShowRackHeader(item, index) ? 'border-t-4 border-t-slate-700' : ''
                ]"
              >
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">{{ item.id }}</td>
                <td class="border border-slate-300 px-3 py-2 font-mono text-xs">
                  <span
                    class="inline-flex rounded px-2 py-1 font-semibold"
                    :class="shouldShowRackHeader(item, index) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'"
                  >
                    {{ item.nomor_rak || '-' }}
                  </span>
                </td>
                <td class="border border-slate-300 px-3 py-2">
                  <div class="flex items-start gap-3">
                    <img
                      :src="getImageUrl(item.gambar)"
                      alt="Cover Buku"
                      class="h-14 w-10 rounded border border-slate-300 object-cover"
                      @error="handleImageError"
                    />
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-slate-900">{{ item.judul }}</p>
                      <p class="truncate text-xs text-slate-600">{{ item.penerbit }}</p>
                    </div>
                  </div>
                </td>
                <td class="border border-slate-300 px-3 py-2">{{ item.kelas }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ item.semester === 'lanjutan' ? 'LANJUTAN' : `Semester ${item.semester}` }}</td>
                <td class="border border-slate-300 px-3 py-2">{{ formatKurikulum(item.kurikulum) }}</td>
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
                <td class="border border-slate-300 px-3 py-2">
                  <div class="flex justify-center gap-2">
                    <NuxtLink
                      :to="`/edit-data/${item.id}`"
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

        <div
          v-if="!loadingData && filteredData.length"
          class="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>
            Halaman {{ currentPage }} / {{ totalPages }} | Menampilkan {{ displayedData.length }} dari {{ filteredData.length }} data
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              class="rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>
    </main>

    <CoverSearchModal
      :open="coverSearchOpen"
      :searching="searchingCover"
      title="Cari Cover Buku"
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useCoverImageSearch } from '../composables/useCoverImageSearch'

const { keteranganApi: API_URL, authApi: API_AUTH, stockHistoriesApi: STOCK_HISTORIES_API } = useApiEndpoints()
const API_ORIGIN = API_URL.replace(/\/api\/keterangan\/?$/, '')
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160"><rect width="120" height="160" fill="#e2e8f0"/><rect x="20" y="32" width="80" height="96" fill="#cbd5e1"/><text x="60" y="82" text-anchor="middle" font-size="12" fill="#475569" font-family="Arial, sans-serif">No Image</text></svg>')}`
const router = useRouter()
const { token, currentUser, clearAuth, authHeaders } = useAuth()

const loadingData = ref(false)
const saving = ref(false)
const dataList = ref([])
const { recognizedCoverText, searchingCover, searchCoverMatches } = useCoverImageSearch()

const searchQuery = ref('')
const searchCategory = ref('all')
const selectedKelas = ref('')
const showLowStockOnly = ref(false)
const groupByRack = ref(false)
const itemsPerPage = ref(10)
const currentPage = ref(1)
const coverSearchOpen = ref(false)
const coverMatchIds = ref(null)
const coverSearchMessage = ref('')
const stockHistoryOpen = ref(false)
const stockHistoryTitle = ref('')
const stockHistories = ref([])
const loadingStockHistories = ref(false)
const LOW_STOCK_LIMIT = 5

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

const totalStok = computed(() => dataList.value.reduce((total, item) => total + (item.stok || 0), 0))
const lowStockCount = computed(() => dataList.value.filter((item) => isLowStock(item)).length)
const emptyStockCount = computed(() => dataList.value.filter((item) => Number(item?.stok || 0) === 0).length)
const isLowStock = (item) => Number(item?.stok || 0) <= LOW_STOCK_LIMIT
const latestStockActivity = computed(() => {
  const latest = dataList.value
    .filter((item) => item.last_stok_added_at)
    .sort((a, b) => new Date(String(b.last_stok_added_at).replace(' ', 'T')).getTime() - new Date(String(a.last_stok_added_at).replace(' ', 'T')).getTime())[0]

  return latest
    ? { name: latest.judul || `ID ${latest.id}`, time: formatStockAddedAt(latest.last_stok_added_at) }
    : { name: 'Belum ada aktivitas', time: '-' }
})

const sortByRack = (items) => [...items].sort((a, b) => {
  const rackCompare = String(a?.nomor_rak || '').localeCompare(String(b?.nomor_rak || ''), 'id', { numeric: true, sensitivity: 'base' })
  if (rackCompare !== 0) return rackCompare
  return String(a?.judul || '').localeCompare(String(b?.judul || ''), 'id', { numeric: true, sensitivity: 'base' })
})

const shouldShowRackHeader = (item, index) => {
  if (!groupByRack.value) return false
  if (index === 0) return true
  return String(displayedData.value[index - 1]?.nomor_rak || '') !== String(item?.nomor_rak || '')
}

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
  const query = searchQuery.value
  const kelas = selectedKelas.value
  const matchedIds = coverMatchIds.value
  if (matchedIds) {
    const matchedData = dataList.value
      .filter((item) => matchedIds.includes(item.id))
      .filter((item) => !showLowStockOnly.value || isLowStock(item))
      .sort((a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id))

    return groupByRack.value ? sortByRack(matchedData) : matchedData
  }

  const result = dataList.value.filter((item) => {
    if (showLowStockOnly.value && !isLowStock(item)) {
      return false
    }

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

  return groupByRack.value ? sortByRack(result) : result
})

const totalPages = computed(() => {
  const pages = Math.ceil(filteredData.value.length / itemsPerPage.value)
  return pages || 1
})

const displayedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredData.value.slice(start, end)
})

watch([searchQuery, searchCategory, selectedKelas, showLowStockOnly, groupByRack], () => {
  currentPage.value = 1
})

watch(filteredData, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

const normalizeImageUrl = (path) => {
  const raw = String(path || '').trim()
  if (!raw) return ''

  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  if (raw.startsWith('/')) {
    return `${API_ORIGIN}${raw}`
  }

  if (raw.startsWith('storage/')) {
    return `${API_ORIGIN}/${raw}`
  }

  return `${API_ORIGIN}/storage/${raw}`
}

const getImageUrl = (path) => normalizeImageUrl(path) || PLACEHOLDER_IMAGE

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

const handleCoverSearch = async (file) => {
  if (!file) return

  try {
    const matches = await searchCoverMatches(file, dataList.value, API_ORIGIN)
    coverMatchIds.value = matches.map((match) => match.id)
    coverSearchMessage.value = matches.length
      ? `Hasil pencarian cover: ${matches.length} data paling mirip${recognizedCoverText.value ? ` dari teks "${recognizedCoverText.value}"` : ''}.`
      : 'Tidak ada cover yang bisa dibandingkan.'
    currentPage.value = 1
  } catch (error) {
    console.error('Error searching cover:', error)
    alert(error.message || 'Gagal mencari data lewat cover.')
  }
}

const fetchData = async () => {
  loadingData.value = true
  try {
    const response = await fetch(API_URL)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    dataList.value = await response.json()
  } catch (error) {
    console.error('Error fetching data:', error)
    alert('Gagal memuat data dari server.')
  } finally {
    loadingData.value = false
  }
}

const openStockHistory = async (item) => {
  stockHistoryOpen.value = true
  stockHistoryTitle.value = item.judul || `ID ${item.id}`
  stockHistories.value = []
  loadingStockHistories.value = true

  try {
    const url = `${STOCK_HISTORIES_API}?item_type=keterangan&item_id=${encodeURIComponent(item.id)}&limit=50`
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

const deleteData = async (id) => {
  if (!confirm(`Yakin ingin menghapus data dengan ID ${id}?`)) return

  saving.value = true
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Gagal menghapus data')
    }

    await fetchData()
    alert('Data berhasil dihapus.')
  } catch (error) {
    console.error('Error deleting data:', error)
    alert(`Gagal menghapus data: ${error.message}`)
  } finally {
    saving.value = false
  }
}

const updateStok = async (id, newStok) => {
  try {
    const item = dataList.value.find((entry) => entry.id === id)
    if (!item) return

    const formData = new FormData()
    formData.append('nomor_rak', item.nomor_rak)
    formData.append('judul', item.judul)
    formData.append('penerbit', item.penerbit)
    formData.append('kelas', item.kelas)
    formData.append('semester', item.semester)
    formData.append('kurikulum', item.kurikulum)
    formData.append('stok', newStok)
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
    console.error('Error updating stok:', error)
    alert('Gagal mengupdate stok.')
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
    router.push('/login')
  }
}

onMounted(() => {
  fetchData()
})
</script>
