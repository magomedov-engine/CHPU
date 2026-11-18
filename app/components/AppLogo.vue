<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 36 })
const id = useId()
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 40 40" class="logo shrink-0" aria-hidden="true">
    <defs>
      <linearGradient :id="`lg-${id}`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c9bbff" />
        <stop offset="0.5" stop-color="#a9c6f5" />
        <stop offset="1" stop-color="#9fd9bd" />
      </linearGradient>
    </defs>
    <rect x="1.5" y="1.5" width="37" height="37" rx="11" :fill="`url(#lg-${id})`" />
    <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="none" stroke="rgba(29,33,48,.12)" />
    <g class="logo-ring" style="transform-origin: 20px 20px">
      <circle cx="20" cy="20" r="10.5" fill="none" stroke="#1d2130" stroke-width="2" stroke-dasharray="4 3.2" />
    </g>
    <path d="M20 6.5v7M20 26.5v7M6.5 20h7M26.5 20h7" stroke="#1d2130" stroke-width="2" stroke-linecap="round" />
    <circle cx="20" cy="20" r="3.2" fill="#1d2130" />
  </svg>
</template>

<style scoped>
.logo-ring { transition: transform 1.2s var(--ease-spring); }
.logo:hover .logo-ring, a:hover .logo .logo-ring { transform: rotate(180deg); }
</style>
