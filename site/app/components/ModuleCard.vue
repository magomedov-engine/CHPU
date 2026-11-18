<script setup lang="ts">
import { ArrowUpRight, Clock, BookOpen } from 'lucide-vue-next'
import type { ModuleMeta } from '~/types/content'
import { useProgressStore } from '~/stores/progress'

const props = defineProps<{ module: ModuleMeta; delay?: number }>()
const store = useProgressStore()
const stats = computed(() => store.moduleStats(props.module))
const fraction = computed(() => (store.ready ? stats.value.fraction : 0))

const el = ref<HTMLElement>()
const { elementX, elementY, elementWidth, elementHeight, isOutside } = useMouseInElement(el)
const reduce = usePreferredReducedMotion()
const style = computed(() => {
  if (isOutside.value || reduce.value === 'reduce' || !elementWidth.value) return { '--mx': '50%', '--my': '0%', transform: 'perspective(900px) rotateX(0) rotateY(0)' }
  const px = elementX.value / elementWidth.value
  const py = elementY.value / elementHeight.value
  return {
    '--mx': `${px * 100}%`,
    '--my': `${py * 100}%`,
    transform: `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-4px)`,
  }
})
const hours = computed(() => formatHours(props.module.minutes))
</script>

<template>
  <NuxtLink
    ref="el"
    :to="`/modules/${module.slug}`"
    :class="`accent-${module.accent}`"
    class="module-card card group relative flex flex-col overflow-hidden p-6 transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)] will-change-transform hover:shadow-lift sm:p-7"
    :style="style"
    v-reveal="delay"
  >
    <span class="spot pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    <span class="absolute -right-3 -top-6 select-none font-display text-[7.5rem] font-bold leading-none text-outline opacity-70 transition-transform duration-700 group-hover:-translate-x-2 group-hover:translate-y-1">
      {{ String(module.number).padStart(2, '0') }}
    </span>

    <div class="relative flex items-center gap-3">
      <span
        class="grid h-14 w-14 place-items-center rounded-2xl border border-accent-mid bg-accent-soft text-[28px] shadow-soft transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
        :style="{ viewTransitionName: `vt-memoji-${module.number}` }"
      >
        {{ module.emoji }}
      </span>
      <span class="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Модуль {{ String(module.number).padStart(2, '0') }}</span>
    </div>

    <h3 class="relative mt-6 font-display text-xl font-semibold leading-tight text-ink sm:text-[22px]" :style="{ viewTransitionName: `vt-mtitle-${module.number}` }">
      {{ module.title }}
    </h3>
    <p class="relative mt-3 line-clamp-3 text-[15px] leading-relaxed text-muted">{{ module.description }}</p>

    <div class="relative mt-auto pt-6">
      <div class="flex items-center gap-4 text-[13px] font-semibold text-ink-2">
        <span class="flex items-center gap-1.5"><BookOpen class="h-4 w-4 text-accent" /> {{ module.lessons.length }} {{ pluralize(module.lessons.length, 'урок', 'урока', 'уроков') }}</span>
        <span class="flex items-center gap-1.5"><Clock class="h-4 w-4 text-accent" /> {{ hours }}</span>
      </div>
      <div class="mt-4 flex items-center gap-3">
        <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
          <div class="bar h-full rounded-full bg-gradient-to-r from-accent-mid to-accent" :style="{ width: `${fraction * 100}%` }" />
        </div>
        <span class="w-10 text-right font-mono text-xs font-bold text-ink">{{ Math.round(fraction * 100) }}%</span>
        <span class="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink transition-all duration-500 group-hover:rotate-45 group-hover:border-accent group-hover:bg-accent group-hover:text-surface">
          <ArrowUpRight class="h-4 w-4" />
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.spot {
  background: radial-gradient(420px circle at var(--mx) var(--my), color-mix(in oklab, var(--accent-soft) 90%, transparent), transparent 60%);
}
.bar { transition: width 1.4s var(--ease-out-expo); }
.module-card { transform-style: preserve-3d; }
</style>
