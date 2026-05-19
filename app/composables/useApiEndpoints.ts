export const useApiEndpoints = () => {
  const config = useRuntimeConfig()
  const configuredApiBase = (config.public.apiBase || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  let apiBase = configuredApiBase

  if (import.meta.client) {
    const pageHost = window.location.hostname
    const isLocalAccess = ['localhost', '127.0.0.1'].includes(pageHost)
    const isLanAccess = pageHost && !isLocalAccess

    try {
      const configuredUrl = new URL(configuredApiBase)
      const isLoopbackApi = ['localhost', '127.0.0.1'].includes(configuredUrl.hostname)
      const isXamppPublicPath = configuredUrl.pathname.includes('/lks/lks/backend/public')
      const isLanApi = /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(configuredUrl.hostname)
      const configuredPort = configuredUrl.port || '8000'

      if (isLocalAccess && isLanApi) {
        apiBase = `${configuredUrl.protocol}//127.0.0.1:${configuredPort}`
      } else if (isLanAccess && (isLoopbackApi || isXamppPublicPath)) {
        apiBase = `${window.location.protocol}//${pageHost}:${configuredPort}`
      }
    } catch {
      if (isLanAccess) {
        apiBase = `${window.location.protocol}//${pageHost}:8001`
      }
    }
  }

  return {
    apiBase,
    authApi: `${apiBase}/api/auth`,
    keteranganApi: `${apiBase}/api/keterangan`,
    tematikApi: `${apiBase}/api/tematik`,
    barangApi: `${apiBase}/api/barang`,
    atkApi: `${apiBase}/api/atk`,
    stockHistoriesApi: `${apiBase}/api/stock-histories`
  }
}
