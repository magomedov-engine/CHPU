<script setup lang="ts">
import { TransitionPresets } from '@vueuse/core'

const props = withDefaults(defineProps<{ value: number; size?: number; stroke?: number; delay?: number }>(), {
  size: 64,
  stroke: 6,
  delay: 0,
})
const id = useId()
const source = computed(() => Math.max(0, Math.min(1, props.value || 0)))
const v = useTransition(source, { duration: 1300, delay: props.delay, transition: TransitionPresets.easeOutExpo })
const r = computed(() => (props.size - props.stroke) / 2)
const c = computed(() => 2 * Math.PI * r.value)
const offset = computed(() => c.value * (1 - v.value))
</script>

<template>
  <div class="relative inline-grid shrink-0 place-items-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="-rotate-90 overflow-visible">
      <defs>
        <linearGradient :id="`rg-${id}`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--accent-mid)" />
          <stop offset="1" stop-color="var(--accent-strong)" />
        </linearGradient>
      </defs>
      <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="var(--line)" :stroke-width="stroke" />
      <circle
        :cx="size / 2"
        :cy="size / 2"
        :r="r"
        fill="none"
        :stroke="`url(#rg-${id})`"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="c"
        :stroke-dashoffset="offset"
      />
    </svg>
    <div class="absolute inset-0 grid place-items-center">
      <slot :value="v">
        <span class="font-mono text-xs font-bold text-ink">{{ Math.round(v * 100) }}%</span>
      </slot>
    </div>
  </div>
</template>
