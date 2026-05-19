const MAX_IMAGE_UPLOAD_SIZE = 2 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1600
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif']
const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|gif|webp)$/i

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(String(event.target?.result || ''))
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.readAsDataURL(file)
  })
}

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Gambar terlalu besar dan tidak bisa dikompres otomatis. Coba pilih foto JPG atau PNG.'))
    }

    image.src = objectUrl
  })
}

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Gagal mengompres gambar.'))
      },
      'image/jpeg',
      quality
    )
  })
}

const getCompressedFileName = (name: string) => {
  const baseName = name.replace(/\.[^.]+$/, '') || 'gambar'
  return `${baseName}.jpg`
}

const getCanvasSize = (width: number, height: number, maxDimension: number) => {
  const ratio = Math.min(1, maxDimension / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  }
}

const compressImageFile = async (file: File): Promise<File> => {
  const image = await loadImage(file)
  let maxDimension = MAX_IMAGE_DIMENSION
  let quality = 0.82

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const size = getCanvasSize(image.naturalWidth || image.width, image.naturalHeight || image.height, maxDimension)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Browser tidak mendukung kompres gambar.')

    context.drawImage(image, 0, 0, size.width, size.height)
    const blob = await canvasToBlob(canvas, quality)

    if (blob.size <= MAX_IMAGE_UPLOAD_SIZE) {
      return new File([blob], getCompressedFileName(file.name), {
        type: 'image/jpeg',
        lastModified: Date.now()
      })
    }

    quality = Math.max(0.45, quality - 0.1)
    if (quality <= 0.45) {
      maxDimension = Math.max(800, Math.round(maxDimension * 0.8))
    }
  }

  throw new Error('Ukuran gambar masih lebih dari 2MB setelah dikompres. Coba foto ulang dengan resolusi lebih kecil.')
}

export const useImageUpload = () => {
  const imageUploadHint = 'Format: JPG/PNG/GIF, foto besar otomatis dikompres maksimal 2MB.'

  const prepareImageFile = async (file: File) => {
    const isAllowedUploadType = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isBrowserImage = file.type.startsWith('image/')
    const hasImageExtension = IMAGE_EXTENSION_PATTERN.test(file.name)

    if (!isAllowedUploadType && !isBrowserImage && !hasImageExtension) {
      throw new Error('Format file harus JPEG, PNG, JPG, atau GIF.')
    }

    const shouldCompress = file.size > MAX_IMAGE_UPLOAD_SIZE || !isAllowedUploadType
    const preparedFile = shouldCompress ? await compressImageFile(file) : file
    const previewDataUrl = await readFileAsDataUrl(preparedFile)

    return {
      file: preparedFile,
      previewDataUrl
    }
  }

  return {
    imageUploadHint,
    prepareImageFile
  }
}
