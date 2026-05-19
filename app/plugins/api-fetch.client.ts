export default defineNuxtPlugin(() => {
  const originalFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    if (!url.includes('.ngrok-free.')) {
      return originalFetch(input, init)
    }

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
    headers.set('ngrok-skip-browser-warning', 'true')

    return originalFetch(input, {
      ...init,
      headers,
    })
  }
})
