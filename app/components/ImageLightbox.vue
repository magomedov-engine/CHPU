<script setup lang="ts">
import { X, ZoomIn, ZoomOut } from 'lucide-vue-next'

const src = useLightbox()
const scale = ref(1)
const pos = reactive({ x: 0, y: 0 })
let drag: { x: number; y: number; px: number; py: number } | null = null

watch(src, () => {
  scale.value = 1
  pos.x = 0
  pos.y = 0
})
const zoom = (d: number) => {
  scale.value = Math.min(4, Math.max(1, +(scale.value + d).toFixed(2)))
  if (scale.value === 1) {
    pos.x = 0
    pos.y = 0
  }
}
function onWheel(e: WheelEvent) {
  e.preventDefault()
  zoom(e.deltaY < 0 ? 0.25 : -0.25)
}
function down(e: PointerEvent) {
  if (scale.value === 1) return
  drag = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drag) return
  pos.x = drag.px + (e.clientX - drag.x)
  pos.y = drag.py + (e.clientY - drag.y)
}
const up = () => (drag = null)
onKeyStroke('Escape', () => (src.value = null))
</script>

<template>
  <Teleport to="body">
    <Transition name="lb">
      <div v-if="src" class="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-8">
        <div class="absolute inset-0 bg-[color-mix(in_oklab,var(--ink)_55%,transparent)] backdrop-blur-md" @click="src = null" />
        <div class="lb-img relative max-h-full w-full max-w-6xl overflow-hidden rounded-3xl bg-[#fbfaf7] p-2 shadow-lift" @wheel="onWheel">
          <img
            :src="src"
            alt="Схема"
            class="mx-auto max-h-[82vh] w-auto touch-none select-none rounded-2xl transition-transform duration-300 ease-out"
            :class="scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'"
            :style="{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }"
            draggable="false"
            @pointerdown="down"
            @pointermove="move"
            @pointerup="up"
            @dblclick="zoom(scale > 1 ? -4 : 1)"
            @click="scale === 1 && zoom(1)"
          />
        </div>
        <div class="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-lift">
          <button type="button" class="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2" aria-label="Уменьшить" @click="zoom(-0.5)"><ZoomOut class="h-5 w-5" /></button>
          <span class="w-14 text-center font-mono text-xs font-bold text-ink">{{ Math.round(scale * 100) }}%</span>
          <button type="button" class="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-surface-2" aria-label="Увеличить" @click="zoom(0.5)"><ZoomIn class="h-5 w-5" /></button>
          <button type="button" class="grid h-10 w-10 place-items-center rounded-full bg-ink text-surface" aria-label="Закрыть" @click="src = null"><X class="h-5 w-5" /></button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lb-enter-active, .lb-leave-active { transition: opacity 0.35s ease; }
.lb-enter-active .lb-img, .lb-leave-active .lb-img { transition: transform 0.5s var(--ease-spring), opacity 0.35s; }
.lb-enter-from, .lb-leave-to { opacity: 0; }
.lb-enter-from .lb-img, .lb-leave-to .lb-img { transform: scale(0.92) translateY(12px); opacity: 0; }
</style>
