<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Dashboard</p>
          <h1 class="text-xl font-bold">{{ pageTitle }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <p class="hidden text-sm text-slate-600 sm:block">
            {{ currentUser?.name || 'User' }}
          </p>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <section class="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="bg-gradient-to-b from-slate-100 to-white px-4 py-4 sm:px-6 sm:py-5">
          <div class="mx-auto w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
            <div class="aspect-[4.25/1] overflow-hidden rounded-lg bg-white">
              <img
                src="/images/mbi.jpeg"
                alt="Logo Multi Belima Indo"
                class="block h-full w-full scale-[1.03] object-cover object-center"
              />
            </div>
          </div>

          <nav class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <NuxtLink
              v-for="item in menuItems"
              :key="item.key"
              :to="item.to"
              class="rounded-lg border px-3 py-2 text-center text-sm font-semibold transition"
              :class="activeMenu === item.key
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
      </section>
    </section>

    <main class="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { authApi: API_AUTH } = useApiEndpoints()
const route = useRoute()
const router = useRouter()
const { token, currentUser, clearAuth } = useAuth()

const menuItems = [
  { key: 'lks', label: 'Lks', to: '/home?menu=lks' },
  { key: 'tematik', label: 'Tematik', to: '/home?menu=tematik' },
  { key: 'atk', label: 'ATK', to: '/home?menu=atk' },
  { key: 'barang', label: 'Barang', to: '/home?menu=barang' }
] as const

const activeMenu = computed(() => {
  if (route.path.startsWith('/atk') || route.path === '/laporan-atk') return 'atk'
  if (route.path.startsWith('/barang') || route.path === '/laporan-barang') return 'barang'
  if (route.path.startsWith('/tematik') || route.path === '/laporan-tematik') return 'tematik'

  if (route.path === '/home') {
    const queryMenu = typeof route.query.menu === 'string' ? route.query.menu.toLowerCase() : 'lks'
    const valid = menuItems.some((item) => item.key === queryMenu)
    return valid ? queryMenu : 'lks'
  }

  if (
    route.path === '/' ||
    route.path === '/laporan-keterangan' ||
    route.path === '/tambah-data' ||
    route.path.startsWith('/edit-data/')
  ) {
    return 'lks'
  }

  return 'lks'
})

const pageTitle = computed(() => {
  if (route.path.startsWith('/atk/edit/')) return 'Edit ATK'
  if (route.path === '/atk/tambah') return 'Tambah ATK'
  if (route.path === '/atk') return 'Data ATK'
  if (route.path === '/laporan-atk') return 'Laporan ATK'
  if (route.path.startsWith('/tematik/edit/')) return 'Edit Tematik'
  if (route.path === '/tematik/tambah') return 'Tambah Tematik'
  if (route.path === '/tematik') return 'Data Tematik'
  if (route.path === '/laporan-tematik') return 'Laporan Tematik'
  if (route.path.startsWith('/barang/edit/')) return 'Edit Barang'
  if (route.path === '/barang/tambah') return 'Tambah Barang'
  if (route.path === '/barang') return 'Data Barang'
  if (route.path === '/laporan-barang') return 'Laporan Barang'
  if (route.path === '/laporan-keterangan') return 'Laporan LKS'
  if (route.path.startsWith('/edit-data/')) return 'Edit LKS'
  if (route.path === '/tambah-data') return 'Tambah LKS'
  if (route.path === '/') return 'Data LKS'
  return 'Home'
})

const logout = async () => {
  try {
    if (token.value) {
      await fetch(`${API_AUTH}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
          Accept: 'application/json'
        }
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    clearAuth()
    await router.push('/login')
  }
}
</script>
