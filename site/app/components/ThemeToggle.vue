<script setup lang="ts">
const { isDark, toggle } = useThemeToggle()
const mounted = ref(false)
const mid = `moon-${useId()}`
onMounted(() => (mounted.value = true))
</script>

<template>
  <button
    type="button"
    class="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink-2 transition hover:-translate-y-0.5 hover:text-ink hover:shadow-soft active:scale-95"
    :aria-label="isDark ? 'Светлая тема' : 'Тёмная тема'"
    @click="toggle"
  >
    <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <mask :id="mid">
        <rect width="24" height="24" fill="white" />
        <circle class="moon-cut" :class="{ on: mounted && isDark }" cx="24" cy="4" r="7" fill="black" />
      </mask>
      <circle class="sun-core" :class="{ on: mounted && isDark }" cx="12" cy="12" r="5" :mask="`url(#${mid})`" fill="currentColor" stroke="none" />
      <g class="sun-rays" :class="{ on: mounted && isDark }">
        <path d="M12 1.5v2M12 20.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M1.5 12h2M20.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
      </g>
    </svg>
  </button>
</template>

<style scoped>
.sun-core { transition: r 0.5s var(--ease-spring); transform-origin: center; }
.sun-core.on { r: 8.5px; }
.moon-cut { transition: cx 0.5s var(--ease-spring), cy 0.5s var(--ease-spring); }
.moon-cut.on { cx: 17px; cy: 7px; }
.sun-rays { transform-origin: 12px 12px; transition: transform 0.5s var(--ease-spring), opacity 0.3s; }
.sun-rays.on { transform: rotate(90deg) scale(0.4); opacity: 0; }
</style>
