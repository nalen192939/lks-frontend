export const useApiImageUrl = (placeholderImage = '') => {
  const cleanImagePath = (path: string) => path.trim().replace(/\\/g, '/')

  const buildProxyUrl = (path: string) => {
    return `/api/image-proxy?path=${encodeURIComponent(cleanImagePath(path))}`
  }

  const normalizeImagePath = (path: unknown) => {
    const raw = cleanImagePath(String(path || ''))
    if (!raw) return ''

    if (/^(data|blob):/i.test(raw)) {
      return raw
    }

    try {
      const url = new URL(raw)
      const proxyPath = url.searchParams.get('path')

      if (url.pathname.includes('/api/cover-image') && proxyPath) {
        return buildProxyUrl(cleanImagePath(proxyPath))
      }

      const storageIndex = url.pathname.indexOf('/storage/')
      if (storageIndex >= 0) {
        return buildProxyUrl(url.pathname.slice(storageIndex + '/storage/'.length))
      }

      return `/api/image-proxy?src=${encodeURIComponent(raw)}`
    } catch {
      const normalized = raw
        .replace(/^\/+/, '')
        .replace(/^storage\//, '')

      return buildProxyUrl(normalized)
    }
  }

  const getImageUrl = (path: unknown) => normalizeImagePath(path) || placeholderImage

  return {
    getImageUrl,
    normalizeImagePath,
  }
}
