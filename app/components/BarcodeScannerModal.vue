<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
    <section class="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
      <header class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
        <button
          type="button"
          class="rounded border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          @click="closeScanner"
        >
          Tutup
        </button>
      </header>

      <div class="space-y-3 p-4">
        <div class="overflow-hidden rounded border border-slate-300 bg-slate-950">
          <video
            ref="videoRef"
            class="aspect-video w-full object-cover"
            autoplay
            muted
            playsinline
          />
        </div>

        <input
          ref="fileInputRef"
          class="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          @change="scanImageFile"
        >

        <p v-if="statusMessage" class="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {{ statusMessage }}
        </p>
        <p v-if="errorMessage" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="scanning"
            @click="startScanner"
          >
            {{ scanning ? 'Memindai...' : 'Mulai Scan' }}
          </button>
          <button
            type="button"
            class="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!scanning"
            @click="stopScanner"
          >
            Stop
          </button>
          <button
            type="button"
            class="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="imageScanning"
            @click="openImagePicker"
          >
            {{ imageScanning ? 'Membaca...' : 'Ambil Foto' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { BrowserMultiFormatReader } from '@zxing/browser'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Scan Barcode'
  }
})

const emit = defineEmits(['close', 'detected'])

const videoRef = ref(null)
const fileInputRef = ref(null)
const scanning = ref(false)
const imageScanning = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
let reader = null
let controls = null
let imageObjectUrl = null

const getReader = () => {
  if (!reader) {
    reader = new BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 150,
      delayBetweenScanSuccess: 300
    })
  }

  return reader
}

const finishDetected = (value) => {
  const barcode = String(value || '').trim()
  if (!barcode) return

  emit('detected', barcode)
  statusMessage.value = `Barcode terbaca: ${barcode}`
  closeScanner()
}

const stopScanner = () => {
  scanning.value = false

  if (controls) {
    controls.stop()
    controls = null
  }

  if (reader) {
    reader.reset()
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

const closeScanner = () => {
  stopScanner()
  emit('close')
}

const startScanner = async () => {
  errorMessage.value = ''
  statusMessage.value = 'Meminta izin kamera...'

  if (!import.meta.client) return

  if (!navigator.mediaDevices?.getUserMedia) {
    errorMessage.value = 'Akses kamera langsung tidak tersedia. Gunakan tombol Ambil Foto, scanner fisik, atau input manual.'
    statusMessage.value = ''
    return
  }

  if (!window.isSecureContext) {
    errorMessage.value = 'Akses kamera langsung di device lain biasanya membutuhkan HTTPS. Coba tombol Ambil Foto, scanner fisik, atau input manual.'
    statusMessage.value = ''
    return
  }

  try {
    stopScanner()
    await nextTick()

    const scanner = getReader()
    controls = await scanner.decodeFromConstraints({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }, videoRef.value, (result) => {
      if (result) {
        finishDetected(result.getText())
      }
    })

    scanning.value = true
    statusMessage.value = 'Arahkan kamera ke barcode.'
  } catch (error) {
    console.error('Camera start error:', error)
    errorMessage.value = error?.name === 'NotAllowedError'
      ? 'Izin kamera ditolak. Aktifkan izin kamera di browser.'
      : 'Gagal membuka kamera langsung. Coba tombol Ambil Foto, scanner fisik, atau input manual.'
    statusMessage.value = ''
    stopScanner()
  }
}

const openImagePicker = () => {
  errorMessage.value = ''
  statusMessage.value = ''
  fileInputRef.value?.click()
}

const scanImageFile = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  imageScanning.value = true
  errorMessage.value = ''
  statusMessage.value = 'Membaca barcode dari foto...'

  try {
    if (imageObjectUrl) {
      URL.revokeObjectURL(imageObjectUrl)
    }

    imageObjectUrl = URL.createObjectURL(file)
    const scanner = getReader()
    const result = await scanner.decodeFromImageUrl(imageObjectUrl)
    finishDetected(result.getText())
  } catch (error) {
    console.error('Barcode image scan error:', error)
    errorMessage.value = 'Barcode belum terbaca dari foto. Pastikan gambar terang, fokus, dan barcode memenuhi area foto.'
    statusMessage.value = ''
  } finally {
    imageScanning.value = false
    event.target.value = ''
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      errorMessage.value = ''
      statusMessage.value = ''
    } else {
      stopScanner()
    }
  }
)

onBeforeUnmount(() => {
  stopScanner()
  if (imageObjectUrl) {
    URL.revokeObjectURL(imageObjectUrl)
  }
})
</script>
