<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 class="text-lg font-bold">{{ activeItem.title }}</h2>
    <p class="mt-1 text-sm text-slate-600">{{ activeItem.description }}</p>

    <div class="mt-4">
      <NuxtLink
        v-if="activeItem.key === 'lks'"
        to="/"
        class="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Buka Data LKS
      </NuxtLink>
      <NuxtLink
        v-else-if="activeItem.key === 'tematik'"
        to="/tematik"
        class="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Buka Data Tematik
      </NuxtLink>
      <NuxtLink
        v-else-if="activeItem.key === 'atk'"
        to="/atk"
        class="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Buka Data ATK
      </NuxtLink>
      <NuxtLink
        v-else-if="activeItem.key === 'barang'"
        to="/barang"
        class="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Buka Data Barang
      </NuxtLink>
      <p v-else class="text-sm text-slate-500">
        Menu {{ activeItem.label }} sedang disiapkan.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()

const menuItems = [
  {
    key: 'lks',
    label: 'Lks',
    title: 'Menu LKS',
    description: 'Halaman utama untuk manajemen data buku LKS.'
  },
  {
    key: 'tematik',
    label: 'Tematik',
    title: 'Menu Tematik',
    description: 'Menu data buku tematik.'
  },
  {
    key: 'atk',
    label: 'ATK',
    title: 'Menu ATK',
    description: 'Menu data alat tulis kantor (ATK).'
  },
  {
    key: 'barang',
    label: 'Barang',
    title: 'Menu Barang',
    description: 'Menu data barang umum.'
  }
] as const

const activeMenu = computed(() => {
  const raw = typeof route.query.menu === 'string' ? route.query.menu.toLowerCase() : 'lks'
  const valid = menuItems.some((item) => item.key === raw)
  return valid ? raw : 'lks'
})

const activeItem = computed(() => {
  return menuItems.find((item) => item.key === activeMenu.value) || menuItems[0]
})
</script>
