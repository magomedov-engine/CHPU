<script setup lang="ts">
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-vue-next'

const { toasts, dismiss } = useToasts()
const tone = {
  success: { cls: 'accent-mint', icon: CircleCheck },
  info: { cls: 'accent-sky', icon: Info },
  warning: { cls: 'accent-peach', icon: TriangleAlert },
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-3 bottom-24 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end" aria-live="polite" v-auto-animate="{ duration: 320 }">
    <div
      v-for="t in toasts"
      :key="t.id"
      :class="tone[t.tone || 'success'].cls"
      class="card pointer-events-auto flex w-full max-w-sm items-start gap-3 border-accent-mid p-4 shadow-lift"
    >
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <component :is="tone[t.tone || 'success'].icon" class="h-5 w-5" />
      </span>
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-ink">{{ t.title }}</p>
        <p v-if="t.text" class="mt-0.5 text-sm text-muted">{{ t.text }}</p>
      </div>
      <button type="button" class="text-muted hover:text-ink" aria-label="Закрыть" @click="dismiss(t.id)"><X class="h-4 w-4" /></button>
    </div>
  </div>
</template>
