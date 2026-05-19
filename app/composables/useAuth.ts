export type AuthUser = {
  id: number
  name: string
  email: string
}

const parseUser = (raw: string | null): AuthUser | null => {
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuth = () => {
  const token = useCookie<string | null>('auth_token', { sameSite: 'lax' })
  const userCookie = useCookie<string | null>('auth_user', { sameSite: 'lax' })
  const currentUser = computed(() => parseUser(userCookie.value))

  const setAuth = (authToken: string, user: AuthUser) => {
    token.value = authToken
    userCookie.value = JSON.stringify(user)
  }

  const clearAuth = () => {
    token.value = null
    userCookie.value = null
  }

  const authHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      Accept: 'application/json'
    }

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    return headers
  }

  return {
    token,
    currentUser,
    setAuth,
    clearAuth,
    authHeaders
  }
}
