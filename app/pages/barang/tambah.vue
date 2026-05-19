<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 class="text-2xl font-bold">Tambah Barang</h1>
          <p class="mt-1 text-sm text-slate-600">Isi form berikut untuk menambahkan data barang baru.</p>
        </div>
        <NuxtLink
          to="/barang"
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
            <label class="mb-1 block text-sm font-medium text-slate-700">Nama</label>
            <input
              v-model="form.nama"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan nama barang"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Merk</label>
            <input
              v-model="form.merk"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan merk barang"
            />
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
            <label class="mb-1 block text-sm font-medium text-slate-700">Jumlah</label>
            <input
              v-model.number="form.jumlah"
              type="number"
              min="0"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan jumlah"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Gambar Barang</label>
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
                class="h-28 w-28 rounded border border-slate-300 object-cover"
                @error="handleImageError"
              />
              <button
                type="button"
                class="mt-2 text-xs font-semibold text-red-600 hover:text-red-500"
                @click="removeImage"
              >
                Hapus gambar
              </button>
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
              to="/barang"
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

const { barangApi: API_URL } = useApiEndpoints()
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0"/><rect x="24" y="24" width="72" height="72" fill="#cbd5e1"/><text x="60" y="64" text-anchor="middle" font-size="12" fill="#475569" font-family="Arial, sans-serif">No Image</text></svg>')}`

const router = useRouter()
const saving = ref(false)
const gambarFile = ref(null)
const { imageUploadHint, prepareImageFile } = useImageUpload()
const cameraInputRef = ref(null)
const galleryInputRef = ref(null)
const desktopInputRef = ref(null)

const form = ref({
  nama: '',
  merk: '',
  stok: 0,
  jumlah: 0,
  gambar: null,
  gambarPreview: null
})

const isMobileDevice = computed(() => {
  if (import.meta.server) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
})

const incrementStok = () => {
  form.value.stok = (form.value.stok || 0) + 1
}

const decrementStok = () => {
  if ((form.value.stok || 0) > 0) {
    form.value.stok -= 1
  }
}

const handleImageError = (event) => {
  const target = event?.target
  if (target && target.src !== PLACEHOLDER_IMAGE) {
    target.src = PLACEHOLDER_IMAGE
    target.onerror = null
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
  if (!form.value.nama || !form.value.merk || form.value.jumlah === null || form.value.jumlah === undefined) {
    alert('Lengkapi semua field terlebih dahulu.')
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('nama', form.value.nama)
    formData.append('merk', form.value.merk)
    formData.append('stok', form.value.stok || 0)
    formData.append('jumlah', form.value.jumlah || 0)

    if (gambarFile.value) {
      formData.append('gambar', gambarFile.value)
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Gagal menambah data barang')
    }

    alert('Data barang berhasil ditambahkan.')
    await router.push('/barang')
  } catch (error) {
    console.error('Error adding data barang:', error)
    alert(error.message)
  } finally {
    saving.value = false
  }
}
</script>
