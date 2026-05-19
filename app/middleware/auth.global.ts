export default defineNuxtRouteMiddleware((to) => {
  const publicPaths = ['/login', '/register', '/lupa-password']
  const token = useCookie<string | null>('auth_token')
  const isPublic = publicPaths.includes(to.path)

  if (!token.value && !isPublic) {
    return navigateTo('/login')
  }

  if (token.value && isPublic) {
    return navigateTo('/home')
  }
})
