<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <main class="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section class="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 class="text-2xl font-bold">Login</h1>
        <p class="mt-1 text-sm text-slate-600">Masuk untuk mengakses manajemen data buku.</p>

        <form class="mt-6 space-y-4" @submit.prevent="submitLogin">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="contoh@email.com"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Masukkan password"
            />
          </div>

          <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ loading ? 'Memproses...' : 'Login' }}
          </button>
        </form>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <NuxtLink to="/lupa-password" class="font-semibold text-sky-700 hover:text-sky-600">
              Lupa password?
            </NuxtLink>
            <NuxtLink to="/register" class="font-semibold text-emerald-700 hover:text-emerald-600">
              Belum punya akun? Register
            </NuxtLink>
          </div>
          <p class="text-slate-500">Test default seed: test@example.com / password</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

type LoginResponse = {
  token: string
  user: {
    id: number
    name: string
    email: string
  }
  message: string
}

const { authApi: API_AUTH } = useApiEndpoints()

const router = useRouter()
const { setAuth } = useAuth()

const loading = ref(false)
const errorMessage = ref('')
const form = ref({
  email: '',
  password: ''
})

const readError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json()
    if (data?.message) return data.message
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0]
      if (firstKey && data.errors[firstKey]?.length) {
        return data.errors[firstKey][0]
      }
    }
  } catch {
    // Ignore parse error.
  }

  return 'Login gagal. Periksa email dan password.'
}

const getLoginEndpoints = () => {
  const endpoints = [API_AUTH]

  if (import.meta.client) {
    const localAuthApi = 'http://127.0.0.1:8000/api/auth'
    const localhostAuthApi = 'http://localhost:8000/api/auth'

    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      endpoints.unshift(localAuthApi)
      endpoints.push(localhostAuthApi)
    }
  }

  return [...new Set(endpoints.map((endpoint) => endpoint.replace(/\/+$/, '')))]
}

const postLogin = async () => {
  let lastError: unknown = null

  for (const endpoint of getLoginEndpoints()) {
    try {
      return await fetch(`${endpoint}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(form.value)
      })
    } catch (error) {
      lastError = error
      console.error(`Login endpoint failed: ${endpoint}/login`, error)
    }
  }

  throw lastError
}

const submitLogin = async () => {
  errorMessage.value = ''

  if (!form.value.email || !form.value.password) {
    errorMessage.value = 'Email dan password wajib diisi.'
    return
  }

  loading.value = true

  try {
    const response = await postLogin()

    if (!response.ok) {
      errorMessage.value = await readError(response)
      return
    }

    const result = (await response.json()) as LoginResponse
    setAuth(result.token, result.user)
    await router.push('/home')
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Gagal terhubung ke server.'
  } finally {
    loading.value = false
  }
}
</script>
