<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <div class="w-full max-w-2xl rounded-xl bg-white shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 class="text-base font-semibold text-slate-900">Riwayat Stok</h2>
          <p class="text-xs text-slate-500">{{ title }}</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          @click="$emit('close')"
        >
          Tutup
        </button>
      </div>

      <div class="max-h-[70vh] overflow-y-auto p-4">
        <div v-if="loading" class="py-8 text-center text-sm text-slate-500">Memuat riwayat...</div>
        <div v-else-if="!histories.length" class="py-8 text-center text-sm text-slate-500">Belum ada riwayat stok.</div>
        <div v-else class="space-y-2">
          <div
            v-for="history in histories"
            :key="history.id"
            class="rounded-lg border border-slate-200 p-3"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span
                class="rounded px-2 py-1 text-xs font-semibold"
                :class="Number(history.perubahan) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
              >
                {{ Number(history.perubahan) > 0 ? '+' : '' }}{{ history.perubahan }}
              </span>
              <span class="text-xs text-slate-500">{{ formatDate(history.created_at) }}</span>
            </div>
            <p class="mt-2 text-sm font-semibold text-slate-900">
              {{ history.stok_sebelum }} ke {{ history.stok_sesudah }}
            </p>
            <p class="text-xs text-slate-600">
              Oleh: {{ history.user_name || 'User' }} | {{ history.keterangan || '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  histories: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  formatDate: {
    type: Function,
    required: true
  }
})

defineEmits(['close'])
</script>
