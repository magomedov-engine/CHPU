<script setup lang="ts">
// Интерактивный «станок»: фреза идёт по траектории кармана, табло показывает координаты.
// Наведите курсор — перекрестие и координаты следуют за мышью; клик «сверлит» отверстие.
const svgEl = ref<SVGSVGElement>()
const pathEl = ref<SVGPathElement>()
const wrap = ref<HTMLElement>()
const tool = reactive({ x: 176, y: 136 })
const progress = ref(0)
const length = ref(1)
const hover = reactive({ on: false, x: 0, y: 0 })
const holes = ref<{ id: number; x: number; y: number }[]>([])
const z = ref(-5)
const rpm = ref(8000)

// Плита 100 × 60 мм: px (40..360, 40..232) → 3,2 px/мм
const toMm = (px: number, py: number) => ({ x: (px - 40) / 3.2, y: (232 - py) / 3.2 })
const shown = computed(() => {
  const p = hover.on ? toMm(hover.x, hover.y) : toMm(tool.x, tool.y)
  return { x: p.x.toFixed(3), y: p.y.toFixed(3), z: hover.on ? '25.000' : z.value.toFixed(3) }
})

const PATH =
  'M176,136 L176,128 L224,128 L224,144 L176,144 L176,136 L158,136 L158,116 L242,116 L242,156 L158,156 L158,136 L136,136 L136,120 Q136,104 152,104 L248,104 Q264,104 264,120 L264,152 Q264,168 248,168 L152,168 Q136,168 136,152 L136,136'

let raf = 0
let start = 0
const visible = useElementVisibility(wrap)
const reduce = usePreferredReducedMotion()

function frame(t: number) {
  if (!pathEl.value) return
  if (!start) start = t
  const dur = 9000
  const p = ((t - start) % (dur + 1600)) / dur
  progress.value = Math.min(1, p)
  const pt = pathEl.value.getPointAtLength(length.value * progress.value)
  tool.x = pt.x
  tool.y = pt.y
  z.value = p > 1 ? 5 : -5
  rpm.value = p > 1 ? 0 : 8000
  raf = requestAnimationFrame(frame)
}
function play() {
  cancelAnimationFrame(raf)
  if (reduce.value === 'reduce') {
    progress.value = 1
    return
  }
  raf = requestAnimationFrame(frame)
}
onMounted(() => {
  if (pathEl.value) length.value = pathEl.value.getTotalLength()
  play()
})
watch(visible, v => (v ? play() : cancelAnimationFrame(raf)))
onBeforeUnmount(() => cancelAnimationFrame(raf))

function svgPoint(e: PointerEvent) {
  const svg = svgEl.value
  if (!svg) return null
  const r = svg.getBoundingClientRect()
  return { x: ((e.clientX - r.left) / r.width) * 400, y: ((e.clientY - r.top) / r.height) * 280 }
}
function onMove(e: PointerEvent) {
  const p = svgPoint(e)
  if (!p) return
  hover.on = p.x >= 40 && p.x <= 360 && p.y >= 40 && p.y <= 232
  hover.x = Math.min(360, Math.max(40, p.x))
  hover.y = Math.min(232, Math.max(40, p.y))
}
let hid = 0
function onClick(e: PointerEvent) {
  const p = svgPoint(e)
  if (!p || p.x < 44 || p.x > 356 || p.y < 44 || p.y > 228) return
  holes.value = [...holes.value.slice(-11), { id: ++hid, x: p.x, y: p.y }]
}
</script>

<template>
  <div ref="wrap" class="accent-lavender relative">
    <div class="card relative overflow-hidden p-3 sm:p-4">
      <div class="mb-3 flex items-center justify-between px-1">
        <div class="flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-[var(--rose-mid)]" />
          <span class="h-2.5 w-2.5 rounded-full bg-[var(--butter-mid)]" />
          <span class="h-2.5 w-2.5 rounded-full bg-[var(--mint-mid)]" />
        </div>
        <span class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">O0002 · ПЛ.002 · G54</span>
      </div>

      <div class="relative overflow-hidden rounded-2xl border border-line bg-surface-2">
        <svg
          ref="svgEl"
          viewBox="0 0 400 280"
          class="block w-full touch-none select-none"
          :class="hover.on ? 'cursor-none' : 'cursor-crosshair'"
          @pointermove="onMove"
          @pointerleave="hover.on = false"
          @click="onClick"
        >
          <defs>
            <pattern id="hm-grid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M16 0H0V16" fill="none" stroke="var(--line)" stroke-width="0.7" />
            </pattern>
            <linearGradient id="hm-plate" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="var(--sky-soft)" />
              <stop offset="1" stop-color="var(--lavender-soft)" />
            </linearGradient>
          </defs>
          <rect width="400" height="280" fill="url(#hm-grid)" />
          <rect x="40" y="40" width="320" height="192" rx="6" fill="url(#hm-plate)" stroke="var(--accent-mid)" stroke-width="1.5" />
          <!-- отверстия плиты -->
          <g fill="var(--surface)" stroke="var(--accent-strong)" stroke-width="1.4">
            <circle cx="72" cy="200" r="14" /><circle cx="328" cy="200" r="14" /><circle cx="72" cy="72" r="14" /><circle cx="328" cy="72" r="14" />
            <circle cx="200" cy="200" r="8" /><circle cx="200" cy="72" r="8" />
          </g>
          <g stroke="var(--muted)" stroke-width="0.6" stroke-dasharray="6 3 1.5 3" opacity="0.7">
            <line x1="30" y1="136" x2="370" y2="136" /><line x1="200" y1="30" x2="200" y2="242" />
          </g>
          <!-- карман -->
          <rect x="136" y="104" width="128" height="64" rx="16" fill="none" stroke="var(--accent-mid)" stroke-dasharray="4 4" />
          <path ref="pathEl" :d="PATH" fill="none" stroke="transparent" />
          <path
            :d="PATH"
            fill="none"
            stroke="var(--accent-strong)"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.25"
            :stroke-dasharray="length"
            :stroke-dashoffset="length * (1 - progress)"
          />
          <path
            :d="PATH"
            fill="none"
            stroke="var(--accent-strong)"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            :stroke-dasharray="length"
            :stroke-dashoffset="length * (1 - progress)"
          />
          <!-- просверленные кликом отверстия -->
          <g v-for="h in holes" :key="h.id" class="drill" :style="{ transformOrigin: `${h.x}px ${h.y}px` }">
            <circle :cx="h.x" :cy="h.y" r="6" fill="var(--surface)" stroke="var(--peach-strong)" stroke-width="1.5" />
            <circle :cx="h.x" :cy="h.y" r="6" fill="none" stroke="var(--peach-mid)" class="drill-ring" :style="{ transformOrigin: `${h.x}px ${h.y}px` }" />
          </g>
          <!-- G54 -->
          <g transform="translate(40 232)">
            <line x1="0" y1="0" x2="30" y2="0" stroke="#e5484d" stroke-width="2.2" />
            <line x1="0" y1="0" x2="0" y2="-30" stroke="#30a46c" stroke-width="2.2" />
            <circle r="3.5" fill="var(--ink)" />
            <text x="34" y="4" font-size="10" font-weight="700" fill="#e5484d" font-family="JetBrains Mono, monospace">X</text>
            <text x="-4" y="-34" font-size="10" font-weight="700" fill="#30a46c" font-family="JetBrains Mono, monospace">Y</text>
          </g>
          <!-- фреза -->
          <g v-if="!hover.on" :transform="`translate(${tool.x} ${tool.y})`">
            <circle r="13" fill="var(--accent-strong)" opacity="0.12" class="tool-glow" />
            <circle r="7" fill="var(--surface)" stroke="var(--accent-strong)" stroke-width="2" />
            <g class="tool-spin"><path d="M0-7V7M-7 0H7" stroke="var(--accent-strong)" stroke-width="1.6" /></g>
          </g>
          <!-- перекрестие курсора -->
          <g v-else :transform="`translate(${hover.x} ${hover.y})`">
            <line x1="-400" y1="0" x2="400" y2="0" stroke="var(--peach-strong)" stroke-width="0.6" stroke-dasharray="3 3" />
            <line x1="0" y1="-300" x2="0" y2="300" stroke="var(--peach-strong)" stroke-width="0.6" stroke-dasharray="3 3" />
            <circle r="9" fill="none" stroke="var(--peach-strong)" stroke-width="1.6" />
            <circle r="2" fill="var(--peach-strong)" />
          </g>
        </svg>
        <span class="pointer-events-none absolute left-3 top-3 rounded-full bg-surface/80 px-2.5 py-1 font-mono text-[10px] font-semibold text-muted backdrop-blur">
          {{ hover.on ? 'MDI · кликните, чтобы сверлить' : 'AUTO · G01 F600' }}
        </span>
      </div>

      <!-- табло координат -->
      <div class="mt-3 rounded-2xl bg-[var(--code-bg)] p-2.5 font-mono">
        <div class="mb-2 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7d86a5]">
          <span>{{ hover.on ? 'Курсор · G54' : 'Абсолютные · G54' }}</span>
          <span><span class="text-[#ffcf70]">S</span> {{ hover.on ? 0 : rpm }} · <span class="text-[#d4a5ff]">T</span>05</span>
        </div>
        <div class="grid grid-cols-3 gap-1.5 text-[12.5px]">
          <div class="dro"><span class="text-[#ff9a9a]">X</span>{{ shown.x }}</div>
          <div class="dro"><span class="text-[#8fe3a8]">Y</span>{{ shown.y }}</div>
          <div class="dro"><span class="text-[#9ad7ff]">Z</span>{{ shown.z }}</div>
        </div>
      </div>
    </div>
    <div class="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-[1.6rem] border border-dashed border-line-2" />
  </div>
</template>

<style scoped>
.dro {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 0.6rem;
  padding: 0.35rem 0.5rem;
  min-width: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  color: #e6e9f5;
  font-variant-numeric: tabular-nums;
}
.dro span { font-weight: 700; }
.tool-spin { animation: spin-slow 0.6s linear infinite; }
.tool-glow { animation: float-y 2s ease-in-out infinite; }
.drill { animation: pop 0.5s var(--ease-spring); }
.drill-ring { animation: pulse-ring 0.9s var(--ease-out-expo) forwards; }
</style>
