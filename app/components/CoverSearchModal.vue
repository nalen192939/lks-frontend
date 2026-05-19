<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex flex-col bg-black text-white"
    >
      <div class="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-4">
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-2xl font-light backdrop-blur"
          @click="closeModal"
        >
          X
        </button>
        <div class="rounded-full bg-black/45 px-4 py-2 text-sm font-semibold backdrop-blur">
          {{ searching ? 'Mencari cover...' : title }}
        </div>
        <button
          type="button"
          class="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-sm font-bold backdrop-blur"
          @click="startCamera"
        >
          Ulang
        </button>
      </div>

      <section
        v-if="cropImageUrl"
        class="relative min-h-0 flex-1 overflow-hidden bg-slate-950 px-4 pb-4 pt-24"
      >
        <div class="flex h-full flex-col items-center justify-center gap-4">
          <p class="rounded-full bg-black/55 px-4 py-2 text-center text-sm font-semibold text-white/90">
            Geser kotak tepat di cover buku
          </p>

          <div class="relative max-h-[72vh] max-w-full touch-none select-none">
            <img
              ref="cropImageRef"
              :src="cropImageUrl"
              class="max-h-[72vh] max-w-full rounded-xl object-contain"
              alt="Preview cover"
              @load="resetCropBox"
            />
            <div
              class="absolute border-4 border-white bg-white/10 shadow-[0_0_0_999px_rgba(0,0,0,0.45)]"
              :style="cropBoxStyle"
              @pointerdown.prevent="startCropDrag($event, 'move')"
            >
              <span class="absolute left-2 top-2 rounded bg-black/65 px-2 py-1 text-xs font-bold text-white">
                Area Cover
              </span>
              <button
                type="button"
                class="absolute -bottom-4 -right-4 h-9 w-9 rounded-full border-2 border-white bg-slate-950 text-xs font-bold text-white"
                @pointerdown.stop.prevent="startCropDrag($event, 'resize')"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        v-else
        class="relative min-h-0 flex-1 bg-slate-950"
      >
        <video
          v-show="cameraReady"
          ref="videoRef"
          class="h-full w-full object-cover"
          autoplay
          playsinline
          muted
        />
        <div
          v-if="!cameraReady"
          class="flex h-full flex-col items-center justify-center px-6 text-center"
        >
          <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/10 text-2xl">
            Kamera
          </div>
          <p class="text-base font-semibold">Kamera live tidak tersedia</p>
          <p class="mt-2 max-w-xs text-sm text-white/70">
            Gunakan kamera HP atau pilih foto dari galeri untuk mencari cover.
          </p>
          <button
            type="button"
            class="mt-5 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950"
            :disabled="searching"
            @click="openDeviceCamera"
          >
            Buka Kamera HP
          </button>
        </div>

        <div v-if="cameraReady" class="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center px-6">
          <p class="rounded-full bg-black/55 px-5 py-2 text-center text-sm font-semibold backdrop-blur">
            Posisikan cover di dalam kotak
          </p>
        </div>

        <div v-if="cameraReady" class="pointer-events-none absolute inset-0 flex items-center justify-center px-8 pb-28 pt-20">
          <div class="h-[62%] w-full max-w-sm rounded-2xl border-4 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.28)]">
            <div class="h-full w-full rounded-xl border border-black/20"></div>
          </div>
        </div>

        <div v-if="cameraReady" class="absolute inset-x-0 bottom-5 flex items-center justify-center">
          <button
            type="button"
            class="flex h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-white/20 shadow-2xl disabled:opacity-60"
            :disabled="searching"
            @click="captureFromPreview"
          >
            <span class="block h-16 w-16 rounded-full bg-white"></span>
          </button>
        </div>
      </section>

      <section
        v-if="cropImageUrl"
        class="rounded-t-3xl bg-white px-5 pb-6 pt-5 text-slate-950"
      >
        <p class="mb-4 text-center text-sm font-semibold text-slate-600">
          Pastikan kotak putih hanya menutup area cover buku.
        </p>
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
            :disabled="searching"
            @click="clearCropPreview"
          >
            Foto Ulang
          </button>
          <button
            type="button"
            class="flex-1 rounded-full bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            :disabled="searching"
            @click="submitCroppedCameraFile"
          >
            {{ searching ? 'Mencari...' : 'Cari Cover' }}
          </button>
        </div>
      </section>

      <section
        v-else
        class="rounded-t-3xl bg-white px-5 pb-6 pt-5 text-slate-950"
      >
        <div class="mb-4 flex items-center justify-between gap-4">
          <button
            type="button"
            class="text-left text-2xl font-bold leading-tight"
            :disabled="searching"
            @click="openGallery"
          >
            Cari dari Galeri HP
          </button>
          <button
            type="button"
            class="shrink-0 text-sm font-semibold text-slate-500"
            :disabled="searching"
            @click="openGallery"
          >
            Lihat Semua &gt;
          </button>
        </div>

        <button
          type="button"
          class="flex min-h-28 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-600"
          :disabled="searching"
          @click="openGallery"
        >
          Pilih foto cover dari galeri handphone
        </button>
      </section>

      <input
        ref="cameraInputRef"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="handleFileInput($event, 'camera')"
      />
      <input
        ref="galleryInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileInput($event, 'gallery')"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  searching: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Cari Cover'
  }
})

const emit = defineEmits(['close', 'selected'])

const videoRef = ref(null)
const cameraInputRef = ref(null)
const galleryInputRef = ref(null)
const cropImageRef = ref(null)
const cameraReady = ref(false)
const stream = ref(null)
const cropImageUrl = ref('')
const cropImageFile = ref(null)
const cropBox = ref({ x: 8, y: 14, w: 84, h: 64 })
const cropDrag = ref(null)
const CAMERA_CROP_WIDTH_RATIO = 0.76
const CAMERA_CROP_HEIGHT_RATIO = 0.62

const cropBoxStyle = computed(() => ({
  left: `${cropBox.value.x}%`,
  top: `${cropBox.value.y}%`,
  width: `${cropBox.value.w}%`,
  height: `${cropBox.value.h}%`
}))

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop())
  }
  stream.value = null
  cameraReady.value = false
}

const clearCropPreview = () => {
  if (cropImageUrl.value) {
    URL.revokeObjectURL(cropImageUrl.value)
  }

  cropImageUrl.value = ''
  cropImageFile.value = null
  cropDrag.value = null
  resetCropBox()
}

const resetCropBox = () => {
  cropBox.value = { x: 8, y: 14, w: 84, h: 64 }
}

const startCamera = async () => {
  if (import.meta.server || !props.open) return
  stopCamera()

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      return
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 1920 }
      },
      audio: false
    })

    stream.value = mediaStream
    await nextTick()

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
      cameraReady.value = true
    }
  } catch (error) {
    console.warn('Kamera live tidak bisa dibuka:', error)
    stopCamera()
  }
}

const fileFromCanvas = (canvas) => {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal mengambil foto dari kamera.'))
        return
      }

      resolve(new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  })
}

const cropCanvasToSearchArea = (sourceWidth, sourceHeight, drawSource) => {
  const cropWidth = Math.round(sourceWidth * CAMERA_CROP_WIDTH_RATIO)
  const cropHeight = Math.round(sourceHeight * CAMERA_CROP_HEIGHT_RATIO)
  const cropX = Math.round((sourceWidth - cropWidth) / 2)
  const cropY = Math.round((sourceHeight - cropHeight) / 2)
  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(cropWidth, cropHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(cropWidth * scale))
  canvas.height = Math.max(1, Math.round(cropHeight * scale))

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  drawSource(context, cropX, cropY, cropWidth, cropHeight, canvas.width, canvas.height)
  return canvas
}

const loadImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca foto kamera.'))
    }
    image.src = url
  })
}

const cropCameraFile = async (file) => {
  const image = await loadImageFromFile(file)
  const canvas = cropCanvasToSearchArea(image.width, image.height, (context, cropX, cropY, cropWidth, cropHeight, targetWidth, targetHeight) => {
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight)
  })

  return canvas ? fileFromCanvas(canvas) : file
}

const captureFromPreview = async () => {
  if (!cameraReady.value || !videoRef.value) {
    openDeviceCamera()
    return
  }

  const video = videoRef.value
  const sourceWidth = video.videoWidth || 1280
  const sourceHeight = video.videoHeight || 1920
  const canvas = cropCanvasToSearchArea(sourceWidth, sourceHeight, (context, cropX, cropY, cropWidth, cropHeight, targetWidth, targetHeight) => {
    context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight)
  })

  if (!canvas) {
    openDeviceCamera()
    return
  }

  const file = await fileFromCanvas(canvas)
  file.coverSearchSource = 'cropped-camera'
  emit('selected', file)
  closeModal()
}

const openDeviceCamera = () => {
  cameraInputRef.value?.click()
}

const openGallery = () => {
  galleryInputRef.value?.click()
}

const handleFileInput = async (event, source) => {
  const file = event.target?.files?.[0]
  if (file) {
    if (source === 'camera') {
      cropImageFile.value = file
      cropImageUrl.value = URL.createObjectURL(file)
      stopCamera()
      if (event.target) {
        event.target.value = ''
      }
      return
    }

    const searchFile = file
    searchFile.coverSearchSource = source
    emit('selected', searchFile)
    closeModal()
  }

  if (event.target) {
    event.target.value = ''
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const startCropDrag = (event, mode) => {
  if (!cropImageRef.value) return

  const rect = cropImageRef.value.getBoundingClientRect()
  cropDrag.value = {
    mode,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    rectWidth: rect.width,
    rectHeight: rect.height,
    startBox: { ...cropBox.value }
  }

  event.currentTarget?.setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', updateCropDrag)
  window.addEventListener('pointerup', stopCropDrag, { once: true })
}

const updateCropDrag = (event) => {
  const drag = cropDrag.value
  if (!drag) return

  const deltaX = ((event.clientX - drag.startX) / drag.rectWidth) * 100
  const deltaY = ((event.clientY - drag.startY) / drag.rectHeight) * 100
  const startBox = drag.startBox

  if (drag.mode === 'resize') {
    const width = clamp(startBox.w + deltaX, 24, 100 - startBox.x)
    const height = clamp(startBox.h + deltaY, 24, 100 - startBox.y)
    cropBox.value = { ...startBox, w: width, h: height }
    return
  }

  cropBox.value = {
    ...startBox,
    x: clamp(startBox.x + deltaX, 0, 100 - startBox.w),
    y: clamp(startBox.y + deltaY, 0, 100 - startBox.h)
  }
}

const stopCropDrag = () => {
  cropDrag.value = null
  window.removeEventListener('pointermove', updateCropDrag)
}

const submitCroppedCameraFile = async () => {
  if (!cropImageFile.value) return

  const image = await loadImageFromFile(cropImageFile.value)
  const crop = cropBox.value
  const sourceX = Math.round(image.width * (crop.x / 100))
  const sourceY = Math.round(image.height * (crop.y / 100))
  const sourceWidth = Math.round(image.width * (crop.w / 100))
  const sourceHeight = Math.round(image.height * (crop.h / 100))
  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
  const file = await fileFromCanvas(canvas)
  file.coverSearchSource = 'cropped-camera'
  clearCropPreview()
  emit('selected', file)
  closeModal()
}

const closeModal = () => {
  stopCamera()
  clearCropPreview()
  emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      startCamera()
      return
    }

    stopCamera()
  }
)

onBeforeUnmount(() => {
  stopCamera()
})
</script>
