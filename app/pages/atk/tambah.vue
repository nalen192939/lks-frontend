<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 class="text-2xl font-bold">Tambah Data ATK</h1>
          <p class="mt-1 text-sm text-slate-600">Isi form berikut untuk menambahkan data ATK.</p>
        </div>
        <NuxtLink
          to="/atk"
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
            <label class="mb-1 block text-sm font-medium text-slate-700">Kode Barang</label>
            <input
              v-model="form.kode_barang"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Contoh: ATK-001"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Barcode</label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <input
                ref="barcodeInputRef"
                v-model="form.barcode"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
                placeholder="Scan atau isi manual"
                @keydown.enter.prevent
              />
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                @click="barcodeScannerOpen = true"
              >
                Scan Kamera
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-500">Scanner fisik, Barcode to PC, atau input keyboard cepat akan otomatis masuk ke kolom ini.</p>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Nama Barang</label>
            <input
              v-model="form.nama_barang"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan nama barang"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
              <select
                v-model="form.kategori"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              >
                <option value="alat_tulis">Alat Tulis</option>
                <option value="kertas">Kertas</option>
                <option value="peralatan">Peralatan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Satuan</label>
              <select
                v-model="form.satuan"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              >
                <option value="pcs">pcs</option>
                <option value="box">box</option>
                <option value="pak">pak</option>
                <option value="rim">rim</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Stok</label>
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
            <label class="mb-1 block text-sm font-medium text-slate-700">Merk</label>
            <input
              v-model="form.merk"
              type="text"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan merk"
            />
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
              to="/atk"
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Batal
            </NuxtLink>
          </div>
        </form>
      </section>
    </main>
    <BarcodeScannerModal
      :open="barcodeScannerOpen"
      title="Scan Barcode ATK"
      @close="barcodeScannerOpen = false"
      @detected="handleBarcodeDetected"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const { atkApi: API_URL } = useApiEndpoints()
const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#e2e8f0"/><rect x="24" y="24" width="72" height="72" fill="#cbd5e1"/><text x="60" y="64" text-anchor="middle" font-size="12" fill="#475569" font-family="Arial, sans-serif">No Image</text></svg>')}`

const router = useRouter()
const saving = ref(false)
const gambarFile = ref(null)
const { imageUploadHint, prepareImageFile } = useImageUpload()
const cameraInputRef = ref(null)
const galleryInputRef = ref(null)
const desktopInputRef = ref(null)
const barcodeScannerOpen = ref(false)
const barcodeInputRef = ref(null)

const form = ref({
  kode_barang: '',
  barcode: '',
  nama_barang: '',
  kategori: 'alat_tulis',
  satuan: 'pcs',
  stok: 0,
  merk: '',
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
  if ((form.value.stok || 0) > 0) form.value.stok -= 1
}

const handleBarcodeDetected = (barcode) => {
  form.value.barcode = barcode
  barcodeScannerOpen.value = false
  barcodeInputRef.value?.focus()
}

useBarcodeKeyboardCapture({
  onScan: handleBarcodeDetected
})

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
  if (!form.value.kode_barang || !form.value.nama_barang || !form.value.merk || form.value.jumlah === null || form.value.jumlah === undefined) {
    alert('Kode barang, nama barang, merk, dan jumlah wajib diisi.')
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('kode_barang', form.value.kode_barang)
    formData.append('barcode', form.value.barcode || '')
    formData.append('nama_barang', form.value.nama_barang)
    formData.append('kategori', form.value.kategori)
    formData.append('satuan', form.value.satuan)
    formData.append('stok', form.value.stok || 0)
    formData.append('merk', form.value.merk || '')
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
      throw new Error(error.message || 'Gagal menambah data ATK')
    }

    alert('Data ATK berhasil ditambahkan.')
    await router.push('/atk')
  } catch (error) {
    console.error('Error adding data atk:', error)
    alert(error.message)
  } finally {
    saving.value = false
  }
}
</script>
