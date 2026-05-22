export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  const source = String(query.src || '').trim()
  const rawPath = String(query.path || '').trim().replace(/\\/g, '/')

  let imageUrl = ''

  if (source) {
    const sourceUrl = new URL(source)
    const apiUrl = new URL(apiBase)

    if (sourceUrl.host !== apiUrl.host) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid image source' })
    }

    imageUrl = sourceUrl.href
  } else {
    const path = rawPath
      .replace(/^\/+/, '')
      .replace(/^storage\//, '')

    if (!path || path.includes('..') || !path.startsWith('uploads/')) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid image path' })
    }

    imageUrl = `${apiBase}/api/cover-image?path=${encodeURIComponent(path)}`
  }

  const response = await fetch(imageUrl, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      Accept: 'image/*',
    },
  })

  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: 'Image not found' })
  }

  const contentType = response.headers.get('content-type')
  const cacheControl = response.headers.get('cache-control') || 'public, max-age=300'

  if (contentType) {
    setHeader(event, 'content-type', contentType)
  }
  setHeader(event, 'cache-control', cacheControl)

  return new Uint8Array(await response.arrayBuffer())
})
