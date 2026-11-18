<script setup lang="ts">
import { House, LayoutGrid, Search, Trophy } from 'lucide-vue-next'

const route = useRoute()
const palette = usePalette()
const items = [
  { key: 'home', label: 'Главная', icon: House, to: '/', match: (p: string) => p === '/' },
  { key: 'modules', label: 'Модули', icon: LayoutGrid, to: '/modules', match: (p: string) => p.startsWith('/modules') },
  { key: 'search', label: 'Поиск', icon: Search, to: null, match: () => false },
  { key: 'progress', label: 'Прогресс', icon: Trophy, to: '/progress', match: (p: string) => p.startsWith('/progress') },
]
const activeIndex = computed(() => items.findIndex(i => i.match(route.path)))
</script>

<template>
  <nav class="fixed inset-x-3 bottom-3 z-40 md:hidden" style="padding-bottom: env(safe-area-inset-bottom)" aria-label="Мобильная навигация">
    <div class="glass relative grid grid-cols-4 rounded-[1.6rem] border border-line p-1.5 shadow-lift">
      <span
        v-if="activeIndex >= 0"
        class="absolute top-1.5 bottom-1.5 left-1.5 rounded-[1.2rem] bg-surface shadow-soft ring-1 ring-line transition-transform duration-500 ease-[var(--ease-spring)]"
        :style="{ width: 'calc((100% - 0.75rem) / 4)', transform: `translateX(${activeIndex * 100}%)` }"
      />
      <template v-for="it in items" :key="it.key">
        <NuxtLink
          v-if="it.to"
          :to="it.to"
          class="relative z-10 flex flex-col items-center gap-0.5 rounded-[1.2rem] py-2 text-[11px] font-semibold transition-colors"
          :class="it.match(route.path) ? 'text-ink' : 'text-muted'"
        >
          <component :is="it.icon" class="h-5 w-5 transition-transform duration-500" :class="it.match(route.path) && '-translate-y-0.5 scale-110'" />
          {{ it.label }}
        </NuxtLink>
        <button
          v-else
          type="button"
          class="relative z-10 flex flex-col items-center gap-0.5 rounded-[1.2rem] py-2 text-[11px] font-semibold text-muted active:scale-95"
          @click="palette = true"
        >
          <component :is="it.icon" class="h-5 w-5" />
          {{ it.label }}
        </button>
      </template>
    </div>
  </nav>
</template>
