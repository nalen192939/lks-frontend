<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <main class="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-6 sm:py-10">
      <section class="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 class="text-2xl font-bold">Lupa Password</h1>
        <p class="mt-1 text-sm text-slate-600">
          {{ isLinkFlow ? 'Link reset terdeteksi. Silakan langsung ubah password baru.' : 'Kirim OTP atau link reset ke email, lalu buat password baru.' }}
        </p>

        <div class="mt-6 space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
              placeholder="contoh@email.com"
              :disabled="otpVerified"
            />
          </div>

          <div v-if="!otpVerified" class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              class="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading || otpVerified"
              @click="sendOtp"
            >
              {{ loading && currentAction === 'send' ? 'Mengirim...' : 'Kirim OTP' }}
            </button>
            <button
              type="button"
              class="w-full rounded-lg border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading || otpVerified"
              @click="sendResetLink"
            >
              {{ loading && currentAction === 'send' ? 'Mengirim...' : 'Kirim Link Reset' }}
            </button>
            <button
              type="button"
              class="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading || otpVerified"
              @click="verifyOtp"
            >
              {{ loading && currentAction === 'verify' ? 'Memverifikasi...' : 'Verifikasi OTP' }}
            </button>
          </div>

          <div v-if="!otpVerified">
            <label class="mb-1 block text-sm font-medium text-slate-700">Kode OTP</label>
            <input
              v-model="form.otp"
              type="text"
              inputmode="numeric"
              maxlength="6"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-[0.24em] outline-none ring-slate-800 transition focus:ring-2 sm:tracking-[0.3em]"
              placeholder="000000"
              :disabled="otpVerified"
            />
          </div>

          <p
            v-if="isLinkFlow"
            class="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700"
          >
            Link reset aktif di perangkat ini. Isi password baru lalu klik Reset Password.
          </p>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-semibold text-slate-800">Reset Password</p>
            <div class="mt-3 space-y-3">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700">Password Baru</label>
                <input
                  v-model="form.password"
                  type="password"
                  autocomplete="new-password"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-800 transition focus:ring-2"
                  placeholder="Minimal 8 karakter"
                  :disabled="!otpVerified"
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
                  :disabled="!otpVerified"
                />
              </div>
              <button
                type="button"
                class="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="loading || !otpVerified"
                @click="resetPassword"
              >
                {{ loading && currentAction === 'reset' ? 'Menyimpan...' : 'Reset Password' }}
              </button>
            </div>
          </div>

          <p v-if="statusMessage" class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {{ statusMessage }}
          </p>
          <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ errorMessage }}
          </p>

          <NuxtLink to="/login" class="inline-block text-sm font-semibold text-sky-700 hover:text-sky-600">
            Kembali ke login
          </NuxtLink>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { authApi: API_AUTH } = useApiEndpoints()

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const currentAction = ref<'send' | 'verify' | 'reset' | ''>('')
const statusMessage = ref('')
const errorMessage = ref('')
const otpVerified = ref(false)
const resetToken = ref('')
const isLinkFlow = ref(false)

const form = ref({
  email: '',
  otp: '',
  password: '',
  password_confirmation: ''
})

const readError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json()
    if (data?.error_detail) {
      return `${data.message || 'Gagal'} (${data.error_detail})`
    }
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

  return 'Permintaan gagal. Silakan coba lagi.'
}

const ensureEmail = (): boolean => {
  if (!form.value.email) {
    errorMessage.value = 'Email wajib diisi.'
    return false
  }
  return true
}

const requestForgotPassword = async (mode: 'otp' | 'link') => {
  errorMessage.value = ''
  statusMessage.value = ''
  if (!ensureEmail()) return

  loading.value = true
  currentAction.value = 'send'

  try {
    const response = await fetch(`${API_AUTH}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ email: form.value.email, mode })
    })

    if (!response.ok) {
      errorMessage.value = await readError(response)
      return
    }

    const data = (await response.json()) as { message?: string; otp_preview?: string; reset_link_preview?: string }
    statusMessage.value = data.message || 'OTP berhasil diproses.'

    if (data.otp_preview) {
      statusMessage.value = `${statusMessage.value} OTP (debug): ${data.otp_preview}`
    }
    if (data.reset_link_preview) {
      statusMessage.value = `${statusMessage.value} Link (debug): ${data.reset_link_preview}`
    }
  } catch (error) {
    console.error('Send OTP error:', error)
    errorMessage.value = 'Gagal terhubung ke server.'
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

const sendOtp = async () => {
  await requestForgotPassword('otp')
}

const sendResetLink = async () => {
  await requestForgotPassword('link')
}

const verifyOtp = async () => {
  errorMessage.value = ''
  statusMessage.value = ''

  if (!ensureEmail()) return
  if (!form.value.otp || form.value.otp.length !== 6) {
    errorMessage.value = 'Kode OTP harus 6 digit.'
    return
  }

  loading.value = true
  currentAction.value = 'verify'

  try {
    const response = await fetch(`${API_AUTH}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        email: form.value.email,
        otp: form.value.otp
      })
    })

    if (!response.ok) {
      errorMessage.value = await readError(response)
      return
    }

    const data = await response.json()
    resetToken.value = data.reset_token
    otpVerified.value = true
    isLinkFlow.value = false
    statusMessage.value = 'OTP terverifikasi. Silakan isi password baru.'
  } catch (error) {
    console.error('Verify OTP error:', error)
    errorMessage.value = 'Gagal terhubung ke server.'
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

const resetPassword = async () => {
  errorMessage.value = ''
  statusMessage.value = ''

  if (!otpVerified.value || !resetToken.value) {
    errorMessage.value = 'Verifikasi OTP terlebih dahulu.'
    return
  }

  if (!form.value.password || form.value.password.length < 8) {
    errorMessage.value = 'Password minimal 8 karakter.'
    return
  }

  if (form.value.password !== form.value.password_confirmation) {
    errorMessage.value = 'Konfirmasi password tidak sama.'
    return
  }

  loading.value = true
  currentAction.value = 'reset'

  try {
    const response = await fetch(`${API_AUTH}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        email: form.value.email,
        reset_token: resetToken.value,
        password: form.value.password,
        password_confirmation: form.value.password_confirmation
      })
    })

    if (!response.ok) {
      errorMessage.value = await readError(response)
      return
    }

    statusMessage.value = 'Password berhasil direset. Anda akan diarahkan ke halaman login.'
    setTimeout(() => {
      router.push('/login')
    }, 1200)
  } catch (error) {
    console.error('Reset password error:', error)
    errorMessage.value = 'Gagal terhubung ke server.'
  } finally {
    loading.value = false
    currentAction.value = ''
  }
}

onMounted(() => {
  const emailFromQuery = typeof route.query.email === 'string' ? route.query.email : ''
  const tokenFromQuery = typeof route.query.token === 'string' ? route.query.token : ''

  if (emailFromQuery) {
    form.value.email = emailFromQuery
  }

  if (tokenFromQuery) {
    resetToken.value = tokenFromQuery
    otpVerified.value = true
    isLinkFlow.value = true
    statusMessage.value = 'Link reset terverifikasi. Silakan isi password baru.'
  }
})
</script>
