<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 class="text-2xl font-bold">Tambah Data Baru</h1>
          <p class="mt-1 text-sm text-slate-600">Isi form berikut untuk menambahkan data buku.</p>
        </div>
        <NuxtLink
          to="/"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Kembali
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <form class="space-y-4 p-5" @submit.prevent="addData" enctype="multipart/form-data">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Nomor Rak</label>
            <input
              v-model="form.nomor_rak"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Contoh: R-01"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Judul Buku</label>
            <input
              v-model="form.judul"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan judul buku"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Penerbit</label>
            <input
              v-model="form.penerbit"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan penerbit"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Kelas</label>
            <select
              v-model="form.kelas"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
            >
              <option value="">Pilih Kelas</option>
              <option v-for="option in kelasOptions" :key="option" :value="option">{{ option === 'UMUM' ? 'UMUM' : `Kelas ${option}` }}</option>
            </select>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p class="mb-1 text-sm font-medium text-slate-700">Semester</p>
              <label class="mb-1 flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.semester" type="radio" value="1" />
                Semester 1
              </label>
              <label class="mb-1 flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.semester" type="radio" value="2" />
                Semester 2
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.semester" type="radio" value="lanjutan" />
                LANJUTAN
              </label>
            </div>

            <div>
              <p class="mb-1 text-sm font-medium text-slate-700">Kurikulum</p>
              <label class="mb-1 flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.kurikulum" type="radio" value="kurikulum_merdeka" />
                Merdeka
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.kurikulum" type="radio" value="kurikulum_2013" />
                2013
              </label>
              <label class="mt-1 flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.kurikulum" type="radio" value="umum" />
                UMUM
              </label>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Stok (pcs)</label>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                @click="decrementStok"
              >
                -
              </button>
              <input
                v-model.number="form.stok"
                type="number"
                min="0"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm outline-none ring-slate-800 transition focus:ring-2"
              />
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                @click="incrementStok"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Gambar Buku</label>
            <div class="space-y-2">
              <template v-if="isMobileDevice">
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    @click="openCameraInput"
                  >
                    Kamera
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    @click="openGalleryInput"
                  >
                    Pilih dari Galeri
                  </button>
                </div>
                <input
                  ref="cameraInputRef"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <input
                  ref="galleryInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <p class="text-xs text-slate-500">
                  Khusus handphone: tombol Kamera membuka aplikasi kamera, tombol Galeri memilih foto dari penyimpanan HP.
                </p>
              </template>
              <input
                v-else
                ref="desktopInputRef"
                type="file"
                accept="image/*"
                class="block w-full cursor-pointer rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm"
                @change="handleFileUpload"
              />
            </div>
            <p class="mt-1 text-xs text-slate-500">{{ imageUploadHint }}</p>
            <div v-if="form.gambarPreview" class="mt-3">
              <img
                :src="form.gambarPreview"
                alt="Preview"
                class="h-28 w-24 rounded border border-slate-300 object-cover"
                @error="handleImageError"
              />
              <div class="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  class="text-xs font-semibold text-red-600 hover:text-red-500"
                  @click="removeImage"
                >
                  Hapus gambar
                </button>
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ saving ? 'Menyimpan...' : 'Simpan Data' }}
            </button>
            <NuxtLink
              to="/"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Batal
            </NuxtLink>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const { keteranganApi: API_URL } = useApiEndpoints()
const API_ORIGIN = API_URL.replace(/\/api\/keterangan\/?$/, '')
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160" viewBox="0 0 120 160"><rect width="120" height="160" fill="#e2e8f0"/><rect x="20" y="32" width="80" height="96" fill="#cbd5e1"/><text x="60" y="82" text-anchor="middle" font-size="12" fill="#475569" font-family="Arial, sans-serif">No Image</text></svg>')}`

const router = useRouter()
const saving = ref(false)
const gambarFile = ref(null)
const { imageUploadHint, prepareImageFile } = useImageUpload()
const cameraInputRef = ref(null)
const galleryInputRef = ref(null)
const desktopInputRef = ref(null)
const kelasOptions = ['UMUM', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const form = ref({
  nomor_rak: '',
  judul: '',
  penerbit: '',
  kelas: '',
  semester: '',
  kurikulum: '',
  stok: 0,
  gambar: null,
  gambarPreview: null
})

const isMobileDevice = computed(() => {
  if (import.meta.server) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
})

const normalizeImageUrl = (path) => {
  const raw = String(path || '').trim()
  if (!raw) return ''

  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/')) return `${API_ORIGIN}${raw}`
  if (raw.startsWith('storage/')) return `${API_ORIGIN}/${raw}`

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

const incrementStok = () => {
  form.value.stok = (form.value.stok || 0) + 1
}

const decrementStok = () => {
  if ((form.value.stok || 0) > 0) {
    form.value.stok -= 1
  }
}

const handleFileUpload = async (event) => {
  const file = event.target?.files?.[0]
  if (!file) return

  try {
    const prepared = await prepareImageFile(file)
    gambarFile.value = prepared.file
    form.value.gambar = prepared.file
    form.value.gambarPreview = prepared.previewDataUrl
  } catch (error) {
    alert(error.message || 'Gagal memproses gambar.')
    if (event.target) event.target.value = ''
  }
}

const openCameraInput = () => {
  cameraInputRef.value?.click()
}

const openGalleryInput = () => {
  galleryInputRef.value?.click()
}

const removeImage = () => {
  form.value.gambar = null
  form.value.gambarPreview = null
  gambarFile.value = null

  ;[cameraInputRef, galleryInputRef, desktopInputRef].forEach((inputRef) => {
    if (inputRef.value) inputRef.value.value = ''
  })
}

const addData = async () => {
  if (!form.value.nomor_rak || !form.value.judul || !form.value.penerbit || !form.value.kelas || !form.value.semester || !form.value.kurikulum) {
    alert('Lengkapi semua field terlebih dahulu.')
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('nomor_rak', form.value.nomor_rak)
    formData.append('judul', form.value.judul)
    formData.append('penerbit', form.value.penerbit)
    formData.append('kelas', form.value.kelas)
    formData.append('semester', form.value.semester)
    formData.append('kurikulum', form.value.kurikulum)
    formData.append('stok', form.value.stok || 0)

    if (gambarFile.value) {
      formData.append('gambar', gambarFile.value)
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Gagal menambah data')
    }

    alert('Data berhasil ditambahkan.')
    router.push('/')
  } catch (error) {
    console.error('Error adding data:', error)
    alert(error.message)
  } finally {
    saving.value = false
  }
}
</script>
