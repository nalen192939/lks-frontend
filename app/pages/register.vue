<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <main class="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section class="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 class="text-2xl font-bold">Register</h1>
        <p class="mt-1 text-sm text-slate-600">Buat akun baru untuk mengakses sistem.</p>

        <form class="mt-6 space-y-4" @submit.prevent="submitRegister">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Nama</label>
            <input
              v-model="form.name"
              type="text"
              autocomplete="name"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Nama lengkap"
            />
          </div>

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
              autocomplete="new-password"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Konfirmasi Password</label>
            <input
              v-model="form.password_confirmation"
              type="password"
              autocomplete="new-password"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="Ulangi password"
            />
          </div>

          <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ loading ? 'Memproses...' : 'Register' }}
          </button>
        </form>

        <div class="mt-4 text-sm">
          <NuxtLink to="/login" class="font-semibold text-sky-700 hover:text-sky-600">
            Sudah punya akun? Login
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

type RegisterResponse = {
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
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
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

  return 'Registrasi gagal. Silakan periksa input.'
}

const submitRegister = async () => {
  errorMessage.value = ''

  if (!form.value.name || !form.value.email || !form.value.password || !form.value.password_confirmation) {
    errorMessage.value = 'Semua field wajib diisi.'
    return
  }

  if (form.value.password.length < 8) {
    errorMessage.value = 'Password minimal 8 karakter.'
    return
  }

  if (form.value.password !== form.value.password_confirmation) {
    errorMessage.value = 'Konfirmasi password tidak sama.'
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${API_AUTH}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    if (!response.ok) {
      errorMessage.value = await readError(response)
      return
    }

    const result = (await response.json()) as RegisterResponse
    setAuth(result.token, result.user)
    await router.push('/home')
  } catch (error) {
    console.error('Register error:', error)
    errorMessage.value = 'Gagal terhubung ke server.'
  } finally {
    loading.value = false
  }
}
</script>
