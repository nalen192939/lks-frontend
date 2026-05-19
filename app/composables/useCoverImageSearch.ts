type CoverSearchItem = {
  id?: number | string
  gambar?: string
  judul?: string
  nama?: string
  merk?: string
  penerbit?: string
  kelas?: string | number
  semester?: string | number
  kurikulum?: string
}

type CoverSearchMatch = {
  id: number | string
  distance: number
  imageDistance?: number
  score?: number
  titleScore?: number
  subjectScore?: number
  semesterScore?: number
  classScore?: number
  source: 'ocr' | 'image' | 'ocr-image'
}

type VisualDescriptor = {
  hash: string
  colorSignature: number[]
}

const HASH_SIZE = 8
const OCR_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
const OCR_WORKER_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js'
const OCR_CORE_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js'
const OCR_LANG_URL = 'https://tessdata.projectnaptha.com/5'
const OCR_TIMEOUT_MS = 30000
const IMAGE_COMPARE_LIMIT = 500
const IMAGE_COMPARE_CONCURRENCY = 6
const STRONG_TEXT_SCORE = 0.42
const TEXT_ONLY_SCORE = 0.34
const MIN_IMAGE_DISTANCE = 22
const OCR_STOP_WORDS = new Set([
  'dan',
  'yang',
  'untuk',
  'dengan',
  'kelas',
  'buku',
  'tema',
  'semester',
  'kurikulum',
  'edisi',
  'revisi',
  'penerbit',
  'cv',
  'pt',
  'sd',
  'smp',
  'sma',
  'smk'
])

declare global {
  interface Window {
    Tesseract?: {
      createWorker?: (...args: unknown[]) => Promise<{
        recognize: (
          image: string,
          options?: Record<string, unknown>
        ) => Promise<{ data?: { text?: string } }>
        setParameters?: (parameters: Record<string, unknown>) => Promise<void>
      }>
      recognize: (
        image: string,
        languages: string,
        options?: Record<string, unknown>
      ) => Promise<{ data?: { text?: string } }>
    }
  }
}

const loadImageFromBlob = (blob: Blob) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca gambar.'))
    }
    image.src = url
  })
}

const buildAverageHash = async (blob: Blob) => {
  const image = await loadImageFromBlob(blob)
  const canvas = document.createElement('canvas')
  canvas.width = HASH_SIZE
  canvas.height = HASH_SIZE

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Browser tidak mendukung pemrosesan gambar.')
  }

  context.drawImage(image, 0, 0, HASH_SIZE, HASH_SIZE)
  const pixels = context.getImageData(0, 0, HASH_SIZE, HASH_SIZE).data
  const grayscale: number[] = []

  for (let index = 0; index < pixels.length; index += 4) {
    grayscale.push((pixels[index] * 0.299) + (pixels[index + 1] * 0.587) + (pixels[index + 2] * 0.114))
  }

  const average = grayscale.reduce((total, value) => total + value, 0) / grayscale.length
  return grayscale.map((value) => (value >= average ? '1' : '0')).join('')
}

const buildColorSignature = async (blob: Blob) => {
  const image = await loadImageFromBlob(blob)
  const canvas = document.createElement('canvas')
  canvas.width = HASH_SIZE
  canvas.height = HASH_SIZE

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Browser tidak mendukung pemrosesan gambar.')
  }

  context.drawImage(image, 0, 0, HASH_SIZE, HASH_SIZE)
  const pixels = context.getImageData(0, 0, HASH_SIZE, HASH_SIZE).data
  const signature: number[] = []

  for (let index = 0; index < pixels.length; index += 4) {
    signature.push(
      Math.round(pixels[index] / 32),
      Math.round(pixels[index + 1] / 32),
      Math.round(pixels[index + 2] / 32)
    )
  }

  return signature
}

const buildVisualDescriptor = async (blob: Blob): Promise<VisualDescriptor> => {
  const image = await loadImageFromBlob(blob)
  const canvas = document.createElement('canvas')
  canvas.width = HASH_SIZE
  canvas.height = HASH_SIZE

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Browser tidak mendukung pemrosesan gambar.')
  }

  context.drawImage(image, 0, 0, HASH_SIZE, HASH_SIZE)
  const pixels = context.getImageData(0, 0, HASH_SIZE, HASH_SIZE).data
  const grayscale: number[] = []
  const colorSignature: number[] = []

  for (let index = 0; index < pixels.length; index += 4) {
    grayscale.push((pixels[index] * 0.299) + (pixels[index + 1] * 0.587) + (pixels[index + 2] * 0.114))
    colorSignature.push(
      Math.round(pixels[index] / 32),
      Math.round(pixels[index + 1] / 32),
      Math.round(pixels[index + 2] / 32)
    )
  }

  const average = grayscale.reduce((total, value) => total + value, 0) / grayscale.length
  return {
    hash: grayscale.map((value) => (value >= average ? '1' : '0')).join(''),
    colorSignature
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement) => {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal memproses potongan gambar.'))
        return
      }

      resolve(blob)
    }, 'image/jpeg', 0.88)
  })
}

const getCropPositions = (sizeRatio: number) => {
  const maxPosition = Math.max(0, 1 - sizeRatio)
  if (maxPosition === 0) return [0]

  return [0, 0.2, 0.4, 0.6, 0.8, 1]
    .map((position) => Math.min(maxPosition, position * maxPosition))
    .filter((position, index, positions) => positions.indexOf(position) === index)
}

const buildSearchImageCandidates = async (file: File, wideSearch = false) => {
  const image = await loadImageFromBlob(file)
  const candidates: Blob[] = [file]
  const cropPresets: Array<{ x: number; y: number; w: number; h: number }> = []

  if (wideSearch) {
    for (const sizeRatio of [0.22, 0.28, 0.36, 0.48, 0.62, 0.78]) {
      for (const x of getCropPositions(sizeRatio)) {
        for (const y of getCropPositions(sizeRatio)) {
          cropPresets.push({ x, y, w: sizeRatio, h: sizeRatio })
        }
      }
    }

    for (const widthRatio of [0.24, 0.32, 0.42]) {
      const heightRatio = Math.min(0.72, widthRatio * 1.45)
      for (const x of getCropPositions(widthRatio)) {
        for (const y of getCropPositions(heightRatio)) {
          cropPresets.push({ x, y, w: widthRatio, h: heightRatio })
        }
      }
    }
  } else {
    cropPresets.push(
      { x: 0.12, y: 0.12, w: 0.76, h: 0.76 },
      { x: 0.00, y: 0.00, w: 0.58, h: 0.58 },
      { x: 0.42, y: 0.00, w: 0.58, h: 0.58 },
      { x: 0.00, y: 0.42, w: 0.58, h: 0.58 },
      { x: 0.42, y: 0.42, w: 0.58, h: 0.58 }
    )
  }

  for (const crop of cropPresets) {
    const sourceX = Math.round(image.width * crop.x)
    const sourceY = Math.round(image.height * crop.y)
    const sourceWidth = Math.round(image.width * crop.w)
    const sourceHeight = Math.round(image.height * crop.h)
    if (sourceWidth < 80 || sourceHeight < 80) continue

    const maxSide = 900
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(sourceWidth * scale))
    canvas.height = Math.max(1, Math.round(sourceHeight * scale))

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) continue

    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
    candidates.push(await canvasToBlob(canvas))

    if (wideSearch && candidates.length >= 120) break
  }

  return candidates
}

const visualDistance = (left: VisualDescriptor, right: VisualDescriptor) => {
  return Math.round(hammingDistance(left.hash, right.hash) + colorDistance(left.colorSignature, right.colorSignature) * 3)
}

const colorDistance = (left: number[], right: number[]) => {
  const length = Math.min(left.length, right.length)
  if (!length) return 64

  let total = 0
  for (let index = 0; index < length; index += 1) {
    total += Math.abs(left[index] - right[index])
  }

  return total / length
}

const hammingDistance = (left: string, right: string) => {
  let distance = 0
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) distance += 1
  }
  return distance + Math.abs(left.length - right.length)
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

let tesseractLoader: Promise<void> | null = null
let ocrWorkerLoader: Promise<{
  recognize: (
    image: string,
    options?: Record<string, unknown>
  ) => Promise<{ data?: { text?: string } }>
  setParameters?: (parameters: Record<string, unknown>) => Promise<void>
} | null> | null = null

const loadTesseract = () => {
  if (import.meta.server) return Promise.resolve()
  if (window.Tesseract) return Promise.resolve()

  if (!tesseractLoader) {
    tesseractLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = OCR_SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Gagal memuat OCR. Pastikan perangkat terhubung internet.'))
      document.head.appendChild(script)
    })
  }

  return tesseractLoader
}

const getOcrWorker = async () => {
  await loadTesseract()
  if (!window.Tesseract?.createWorker) return null

  if (!ocrWorkerLoader) {
    ocrWorkerLoader = window.Tesseract.createWorker('eng', 1, {
      workerPath: OCR_WORKER_URL,
      corePath: OCR_CORE_URL,
      langPath: OCR_LANG_URL
    })
      .then(async (worker) => {
        await worker.setParameters?.({
          tessedit_pageseg_mode: '6',
          preserve_interword_spaces: '1'
        })
        return worker
      })
      .catch((error) => {
        ocrWorkerLoader = null
        console.warn('Gagal menyiapkan worker OCR:', error)
        return null
      })
  }

  return ocrWorkerLoader
}

const preloadOcrEngine = async () => {
  if (import.meta.server) return
  await getOcrWorker()
}

const normalizeText = (value?: string) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const normalizeCoverText = normalizeText

const tokenizeText = (value?: string) => {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !OCR_STOP_WORDS.has(token))
}

const levenshteinDistance = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = Array.from({ length: right.length + 1 }, () => 0)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost
      )
    }

    for (let index = 0; index < previous.length; index += 1) {
      previous[index] = current[index]
    }
  }

  return previous[right.length]
}

const getPrimaryItemText = (item: CoverSearchItem) => {
  if (item.judul) return item.judul
  return [item.nama, item.merk].filter(Boolean).join(' ')
}

const ROMAN_CLASS_MAP: Record<string, string> = {
  i: 'I',
  ii: 'II',
  iii: 'III',
  iv: 'IV',
  v: 'V',
  vi: 'VI',
  vii: 'VII',
  viii: 'VIII',
  ix: 'IX',
  x: 'X',
  xi: 'XI',
  xii: 'XII',
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV',
  '5': 'V',
  '6': 'VI',
  '7': 'VII',
  '8': 'VIII',
  '9': 'IX',
  '10': 'X',
  '11': 'XI',
  '12': 'XII'
}

const normalizeClassValue = (value?: string | number) => {
  const normalized = normalizeText(value?.toString())
  if (!normalized) return ''
  if (normalized === 'umum') return 'UMUM'
  return ROMAN_CLASS_MAP[normalized] || normalized.toUpperCase()
}

const normalizeSemesterValue = (value?: string | number) => {
  const normalized = normalizeText(value?.toString())
  if (!normalized) return ''
  if (normalized.includes('lanjut')) return 'lanjutan'
  if (normalized.includes('satu')) return '1'
  if (normalized.includes('dua')) return '2'
  const match = normalized.match(/\b([12])\b/)
  return match?.[1] || normalized
}

export const extractCoverMetadata = (recognizedText: string) => {
  const normalized = normalizeText(recognizedText)
  const tokens = normalized.split(' ').filter(Boolean)
  const classCandidate = tokens.find((token, index) => (
    token === 'umum' ||
    ROMAN_CLASS_MAP[token] ||
    (tokens[index - 1] === 'kelas' && ROMAN_CLASS_MAP[token])
  ))
  const semesterCandidate = normalized.match(/\b(?:semester|sem)\s*(1|2|satu|dua|lanjutan)\b/)?.[1] ||
    tokens.find((token, index) => tokens[index - 1] === 'semester' && ['1', '2', 'satu', 'dua', 'lanjutan'].includes(token))

  return {
    kelas: normalizeClassValue(classCandidate),
    semester: normalizeSemesterValue(semesterCandidate),
    tokens
  }
}

const drawOcrCrop = (
  sourceImage: HTMLImageElement,
  targetContext: CanvasRenderingContext2D,
  crop: { x: number; y: number; w: number; h: number },
  target: { x: number; y: number; w: number; h: number }
) => {
  targetContext.drawImage(
    sourceImage,
    Math.round(sourceImage.width * crop.x),
    Math.round(sourceImage.height * crop.y),
    Math.round(sourceImage.width * crop.w),
    Math.round(sourceImage.height * crop.h),
    target.x,
    target.y,
    target.w,
    target.h
  )
}

const enhanceOcrCanvas = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Browser tidak mendukung OCR gambar.')
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

  for (let index = 0; index < imageData.data.length; index += 4) {
    const gray = (imageData.data[index] * 0.299) + (imageData.data[index + 1] * 0.587) + (imageData.data[index + 2] * 0.114)
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.35 + 128))
    const sharpened = contrasted > 205 ? 255 : contrasted < 52 ? 0 : contrasted
    imageData.data[index] = sharpened
    imageData.data[index + 1] = sharpened
    imageData.data[index + 2] = sharpened
  }

  context.putImageData(imageData, 0, 0)
}

const prepareFastImageForOcr = async (file: File) => {
  const image = await loadImageFromBlob(file)
  const canvas = document.createElement('canvas')
  const width = 640
  const gap = 8
  const titleHeight = 170
  const fullHeight = 300
  const detailHeight = 150
  canvas.width = width
  canvas.height = titleHeight + fullHeight + detailHeight + (gap * 4)

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Browser tidak mendukung OCR gambar.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)

  drawOcrCrop(image, context, { x: 0, y: 0, w: 1, h: 0.44 }, { x: 0, y: gap, w: width, h: titleHeight })
  drawOcrCrop(image, context, { x: 0.06, y: 0.04, w: 0.88, h: 0.90 }, { x: 0, y: titleHeight + (gap * 2), w: width, h: fullHeight })
  drawOcrCrop(image, context, { x: 0.38, y: 0.50, w: 0.62, h: 0.48 }, { x: 0, y: titleHeight + fullHeight + (gap * 3), w: width, h: detailHeight })

  enhanceOcrCanvas(canvas)
  return canvas.toDataURL('image/jpeg', 0.82)
}

const prepareFullImageForOcr = async (file: File) => {
  const image = await loadImageFromBlob(file)
  const maxSide = 1100
  const scale = Math.min(1.25, maxSide / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('Browser tidak mendukung OCR gambar.')
  }

  context.drawImage(image, 0, 0, width, height)
  enhanceOcrCanvas(canvas)
  return canvas.toDataURL('image/jpeg', 0.84)
}

const readTextFromCover = async (
  file: File,
  options: { timeoutMs?: number; timeoutMessage?: string; fullImage?: boolean } = {}
) => {
  const timeoutMs = options.timeoutMs ?? OCR_TIMEOUT_MS
  const timeoutMessage = options.timeoutMessage || 'OCR terlalu lama, pencarian dialihkan ke pembanding gambar.'

  const result = await withTimeout((async () => {
    const preparedImage = options.fullImage
      ? await prepareFullImageForOcr(file)
      : await prepareFastImageForOcr(file)

    const worker = await getOcrWorker()
    if (worker) {
      return worker.recognize(preparedImage)
    }

    await loadTesseract()
    if (!window.Tesseract) return { data: { text: '' } }

    return window.Tesseract.recognize(preparedImage, 'eng', {
      workerPath: OCR_WORKER_URL,
      corePath: OCR_CORE_URL,
      langPath: OCR_LANG_URL,
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1'
    })
  })(), timeoutMs, timeoutMessage)

  return result.data?.text || ''
}

const scoreSubjectMatch = (
  recognizedText: string,
  item: CoverSearchItem,
  tokenWeights: Map<string, number>
) => {
  const itemText = getPrimaryItemText(item)
  const itemTokens = tokenizeText(itemText)
  const recognizedTokens = tokenizeText(recognizedText)

  if (!itemTokens.length || !recognizedTokens.length) return 0

  const itemTextNormalized = normalizeText(itemText)
  const recognizedTextNormalized = normalizeText(recognizedText)
  const exactPhrase = itemTextNormalized.length >= 8 && recognizedTextNormalized.includes(itemTextNormalized)

  let matchedWeight = 0
  let totalWeight = 0
  let strongMatches = 0

  for (const token of itemTokens) {
    const weight = tokenWeights.get(token) || 1
    totalWeight += weight

    let tokenScore = 0
    for (const recognizedToken of recognizedTokens) {
      if (recognizedToken === token) {
        tokenScore = 1
        break
      }

      if (token.length >= 5 && (recognizedToken.includes(token) || token.includes(recognizedToken))) {
        tokenScore = Math.max(tokenScore, 0.8)
        continue
      }

      const maxLength = Math.max(token.length, recognizedToken.length)
      const allowedDistance = maxLength >= 8 ? 2 : 1
      if (maxLength >= 5 && levenshteinDistance(token, recognizedToken) <= allowedDistance) {
        tokenScore = Math.max(tokenScore, 0.7)
      }
    }

    if (tokenScore >= 0.7) {
      strongMatches += 1
      matchedWeight += weight * tokenScore
    }
  }

  if (!totalWeight) return 0
  if (!exactPhrase && itemTokens.length > 1 && strongMatches < 2) return 0

  const weightedScore = matchedWeight / totalWeight
  const phraseBonus = exactPhrase ? 0.25 : 0

  return Math.max(0, Math.min(1, weightedScore + phraseBonus))
}

const scoreTextMatch = (
  recognizedText: string,
  item: CoverSearchItem,
  tokenWeights: Map<string, number>,
  metadata = extractCoverMetadata(recognizedText)
) => {
  const subjectScore = scoreSubjectMatch(recognizedText, item, tokenWeights)
  if (!subjectScore) return 0

  const itemClass = normalizeClassValue(item.kelas)
  const itemSemester = normalizeSemesterValue(item.semester)
  let metadataScore = 0

  if (metadata.kelas && itemClass) {
    metadataScore += metadata.kelas === itemClass ? 0.28 : -0.34
  }

  if (metadata.semester && itemSemester) {
    metadataScore += metadata.semester === itemSemester ? 0.24 : -0.3
  }

  return Math.max(0, Math.min(1, subjectScore + metadataScore))
}

const buildTokenWeights = (items: CoverSearchItem[]) => {
  const documentCounts = new Map<string, number>()

  for (const item of items) {
    const uniqueTokens = new Set(tokenizeText(getPrimaryItemText(item)))
    for (const token of uniqueTokens) {
      documentCounts.set(token, (documentCounts.get(token) || 0) + 1)
    }
  }

  const totalItems = Math.max(items.length, 1)
  const weights = new Map<string, number>()
  for (const [token, count] of documentCounts.entries()) {
    weights.set(token, Math.max(0.35, Math.log(totalItems / count)))
  }

  return weights
}

export const useCoverImageSearch = () => {
  const searchingCover = ref(false)
  const recognizedCoverText = ref('')

  const readCoverText = async (file: File, options: { timeoutMs?: number; timeoutMessage?: string; fullImage?: boolean } = {}) => {
    if (import.meta.server) return ''

    searchingCover.value = true
    try {
      const text = await readTextFromCover(file, options)
      recognizedCoverText.value = normalizeText(text)
      return text
    } finally {
      searchingCover.value = false
    }
  }

  const buildCoverProxyUrl = (apiOrigin: string, path?: string) => {
    const raw = String(path || '').trim()
    if (!raw) return ''

    const normalizedPath = raw
      .replace(/^https?:\/\/[^/]+\/storage\//i, '')
      .replace(/^\/?storage\//i, '')
      .replace(/^\/+/, '')

    return `${apiOrigin}/api/cover-image?path=${encodeURIComponent(normalizedPath)}`
  }

  const searchCoverMatches = async (
    file: File,
    items: CoverSearchItem[],
    apiOrigin: string,
    options: { limit?: number; maxDistance?: number; imageCompareLimit?: number } = {}
  ) => {
    if (import.meta.server) return []

    const limit = options.limit ?? 12
    const maxDistance = options.maxDistance ?? 24
    const imageCompareLimit = options.imageCompareLimit ?? IMAGE_COMPARE_LIMIT
    searchingCover.value = true

    try {
      recognizedCoverText.value = ''
      const textMatches: CoverSearchMatch[] = []
      let recognizedMetadata = extractCoverMetadata('')

      try {
        const ocrText = await readTextFromCover(file)
        recognizedCoverText.value = normalizeText(ocrText)
        const tokenWeights = buildTokenWeights(items)
        const metadata = extractCoverMetadata(ocrText)
        recognizedMetadata = metadata

        for (const item of items) {
          if (!item.id) continue

          const score = scoreTextMatch(ocrText, item, tokenWeights, metadata)
          const subjectScore = scoreSubjectMatch(ocrText, item, tokenWeights)
          if (score >= TEXT_ONLY_SCORE) {
            textMatches.push({
              id: item.id,
              distance: Math.round((1 - score) * 64),
              score,
              subjectScore,
              source: 'ocr'
            })
          }
        }
      } catch (error) {
        console.warn('Gagal membaca teks cover:', error)
      }

      const sortedTextMatches = textMatches.sort((a, b) => (b.score || 0) - (a.score || 0))
      const strongTextMatches = sortedTextMatches.filter((match) => (match.score || 0) >= STRONG_TEXT_SCORE)
      const hasBookMetadata = items.some((item) => item.kelas || item.semester)

      if (hasBookMetadata && recognizedCoverText.value) {
        const source = (file as File & { coverSearchSource?: string }).coverSearchSource || ''
        const isCameraSearch = source.includes('camera')
        const uploadedCandidates = await buildSearchImageCandidates(file, isCameraSearch)
        const uploadedDescriptors = await Promise.all(uploadedCandidates.map((candidate) => buildVisualDescriptor(candidate)))
        const imageMatches: CoverSearchMatch[] = []
        const imageItems = items
          .filter((item) => item.id && item.gambar)
          .slice(0, imageCompareLimit)

        let nextIndex = 0

        const compareNextImage = async () => {
          const item = imageItems[nextIndex]
          nextIndex += 1
          if (!item?.id || !item.gambar) return

          try {
            const response = await fetch(buildCoverProxyUrl(apiOrigin, item.gambar))
            if (!response.ok) return

            const imageBlob = await response.blob()
            const itemDescriptor = await buildVisualDescriptor(imageBlob)
            const bestDistance = Math.min(
              ...uploadedDescriptors.map((descriptor) => visualDistance(descriptor, itemDescriptor))
            )

            imageMatches.push({
              id: item.id,
              distance: bestDistance,
              source: 'image'
            })
          } catch (error) {
            console.warn('Gagal membandingkan cover:', item.id, error)
          }
        }

        const workers = Array.from(
          { length: Math.min(IMAGE_COMPARE_CONCURRENCY, imageItems.length) },
          async () => {
            while (nextIndex < imageItems.length) {
              await compareNextImage()
            }
          }
        )
        await Promise.all(workers)

        const imageMatchById = new Map(imageMatches.map((match) => [match.id, match]))
        const itemById = new Map(items.filter((item) => item.id).map((item) => [item.id as number | string, item]))
        const textMatchById = new Map(sortedTextMatches.map((match) => [match.id, match]))
        const rankedCandidateIds = new Set<number | string>([
          ...sortedTextMatches.map((match) => match.id),
          ...imageMatches.map((match) => match.id)
        ])
        const rankedMatches = [...rankedCandidateIds]
          .map((id) => {
            const textMatch = textMatchById.get(id)
            const imageMatch = imageMatchById.get(id)
            const item = itemById.get(id)
            const itemSemester = normalizeSemesterValue(item?.semester)
            const itemClass = normalizeClassValue(item?.kelas)
            const semesterScore = recognizedMetadata.semester && itemSemester
              ? (recognizedMetadata.semester === itemSemester ? 1 : 0)
              : 0
            const classScore = recognizedMetadata.kelas && itemClass
              ? (recognizedMetadata.kelas === itemClass ? 1 : 0)
              : 0

            return {
              id,
              score: textMatch?.score ?? 0,
              subjectScore: textMatch?.subjectScore ?? 0,
              imageDistance: imageMatch?.distance,
              titleScore: textMatch?.subjectScore ?? 0,
              distance: textMatch && imageMatch ? Math.round((textMatch.distance * 0.85) + (imageMatch.distance * 0.15)) : textMatch?.distance ?? imageMatch?.distance ?? 64,
              semesterScore,
              classScore,
              source: textMatch && imageMatch ? 'ocr-image' : textMatch ? 'ocr' : 'image'
            } as CoverSearchMatch
          })
          .sort((a, b) => {
            const aImageDistance = a.imageDistance ?? 64
            const bImageDistance = b.imageDistance ?? 64
            const aCoverScore = Math.max(0, 96 - aImageDistance) / 96
            const bCoverScore = Math.max(0, 96 - bImageDistance) / 96
            const aRank = ((a.titleScore || 0) * 10000) + ((a.subjectScore || 0) * 3000) + ((a.semesterScore || 0) * 700) + ((a.classScore || 0) * 350) + (aCoverScore * 120)
            const bRank = ((b.titleScore || 0) * 10000) + ((b.subjectScore || 0) * 3000) + ((b.semesterScore || 0) * 700) + ((b.classScore || 0) * 350) + (bCoverScore * 120)
            return bRank - aRank || aImageDistance - bImageDistance || a.distance - b.distance
          })

        return rankedMatches.slice(0, limit)
      }

      if (strongTextMatches.length) {
        return strongTextMatches.slice(0, limit)
      }

      const source = (file as File & { coverSearchSource?: string }).coverSearchSource || ''
      const isCameraSearch = source.includes('camera')
      const uploadedCandidates = await buildSearchImageCandidates(file, isCameraSearch)
      const uploadedDescriptors = await Promise.all(uploadedCandidates.map((candidate) => buildVisualDescriptor(candidate)))
      const imageMatches: CoverSearchMatch[] = []
      const imageItems = items
        .filter((item) => item.id && item.gambar)
        .slice(0, imageCompareLimit)

      let nextIndex = 0

      const compareNextImage = async () => {
        const item = imageItems[nextIndex]
        nextIndex += 1
        if (!item?.id || !item.gambar) return

        try {
          const response = await fetch(buildCoverProxyUrl(apiOrigin, item.gambar))
          if (!response.ok) return

          const imageBlob = await response.blob()
          const itemDescriptor = await buildVisualDescriptor(imageBlob)
          const bestDistance = Math.min(
            ...uploadedDescriptors.map((descriptor) => visualDistance(descriptor, itemDescriptor))
          )

          imageMatches.push({
            id: item.id,
            distance: bestDistance,
            source: 'image'
          })
        } catch (error) {
          console.warn('Gagal membandingkan cover:', item.id, error)
        }
      }

      const workers = Array.from(
        { length: Math.min(IMAGE_COMPARE_CONCURRENCY, imageItems.length) },
        async () => {
          while (nextIndex < imageItems.length) {
            await compareNextImage()
          }
        }
      )
      await Promise.all(workers)

      const imageMatchById = new Map(imageMatches.map((match) => [match.id, match]))
      const mergedMatches = new Map<number | string, CoverSearchMatch>()

      for (const textMatch of sortedTextMatches) {
        const imageMatch = imageMatchById.get(textMatch.id)
        mergedMatches.set(textMatch.id, {
          ...textMatch,
          distance: imageMatch ? Math.round((textMatch.distance * 0.65) + (imageMatch.distance * 0.35)) : textMatch.distance,
          source: imageMatch ? 'ocr-image' : 'ocr'
        })
      }

      if (!mergedMatches.size) {
        for (const imageMatch of imageMatches) {
          mergedMatches.set(imageMatch.id, imageMatch)
        }
      }

      const sortedMatches = [...mergedMatches.values()].sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0)
        return scoreDiff || a.distance - b.distance
      })
      const bestImageDistance = sortedMatches.find((match) => match.source === 'image')?.distance ?? 64
      const confidentMatches = sortedMatches.filter((match) => (
        match.source !== 'image' ||
        match.distance <= Math.max(Math.min(maxDistance, MIN_IMAGE_DISTANCE), bestImageDistance <= 26 ? bestImageDistance + 2 : MIN_IMAGE_DISTANCE)
      ))

      return confidentMatches.slice(0, limit)
    } finally {
      searchingCover.value = false
    }
  }

  return {
    recognizedCoverText,
    searchingCover,
    preloadOcrEngine,
    readCoverText,
    searchCoverMatches
  }
}
