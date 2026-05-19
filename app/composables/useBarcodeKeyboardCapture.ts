import { onBeforeUnmount, onMounted } from 'vue'

type BarcodeCaptureOptions = {
  enabled?: () => boolean
  onScan: (value: string) => void
  minLength?: number
  maxGapMs?: number
  idleCommitMs?: number
}

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null
  if (!element) return false

  const tagName = element.tagName?.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable
}

export const useBarcodeKeyboardCapture = ({
  enabled = () => true,
  onScan,
  minLength = 4,
  maxGapMs = 60,
  idleCommitMs = 140
}: BarcodeCaptureOptions) => {
  let buffer = ''
  let firstAt = 0
  let lastAt = 0
  let idleTimer: ReturnType<typeof window.setTimeout> | null = null

  const reset = () => {
    buffer = ''
    firstAt = 0
    lastAt = 0

    if (idleTimer) {
      window.clearTimeout(idleTimer)
      idleTimer = null
    }
  }

  const isLikelyScan = () => {
    if (buffer.trim().length < minLength) return false
    if (!firstAt || !lastAt) return false

    const duration = Math.max(1, lastAt - firstAt)
    const averageGap = duration / Math.max(1, buffer.length - 1)
    return averageGap <= maxGapMs || duration <= maxGapMs
  }

  const commit = () => {
    if (!enabled() || !isLikelyScan()) {
      reset()
      return false
    }

    const value = buffer.trim()
    reset()
    onScan(value)
    return true
  }

  const scheduleIdleCommit = () => {
    if (idleTimer) window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => {
      commit()
    }, idleCommitMs)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (!enabled() || event.ctrlKey || event.altKey || event.metaKey) return

    const now = Date.now()
    const key = event.key

    if (key === 'Enter' || key === 'Tab') {
      if (commit()) {
        event.preventDefault()
        event.stopPropagation()
      }
      return
    }

    if (key.length !== 1) return

    if (!firstAt || now - lastAt > idleCommitMs) {
      buffer = ''
      firstAt = now
    }

    buffer += key
    lastAt = now
    scheduleIdleCommit()
  }

  const handlePaste = (event: ClipboardEvent) => {
    if (!enabled() || isEditableTarget(event.target)) return

    const value = event.clipboardData?.getData('text')?.trim()
    if (!value || value.length < minLength) return

    event.preventDefault()
    reset()
    onScan(value)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown, true)
    window.addEventListener('paste', handlePaste, true)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown, true)
    window.removeEventListener('paste', handlePaste, true)
    reset()
  })
}
