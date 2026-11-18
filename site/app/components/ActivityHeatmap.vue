<script setup lang="ts">
import { useProgressStore } from '~/stores/progress'

const store = useProgressStore()
const WEEKS = 20
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const grid = computed(() => {
  const today = new Date()
  const end = new Date(today)
  const dow = (today.getDay() + 6) % 7 // понедельник = 0
  end.setDate(today.getDate() + (6 - dow))
  const start = new Date(end)
  start.setDate(end.getDate() - WEEKS * 7 + 1)
  const cols: { date: string; label: string; count: number; future: boolean }[][] = []
  const d = new Date(start)
  for (let w = 0; w < WEEKS; w++) {
    const col = []
    for (let i = 0; i < 7; i++) {
      const k = key(d)
      col.push({ date: k, label: `${d.getDate()} ${months[d.getMonth()]}`, count: store.ready ? store.activity[k] || 0 : 0, future: d > today })
      d.setDate(d.getDate() + 1)
    }
    cols.push(col)
  }
  return cols
})
const level = (n: number) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4)
const colors = ['var(--line)', 'var(--mint-mid)', 'color-mix(in oklab, var(--mint-mid) 50%, var(--mint-strong))', 'var(--mint-strong)', 'color-mix(in oklab, var(--mint-strong) 70%, var(--ink))']
</script>

<template>
  <div>
    <div class="flex gap-[5px] overflow-x-auto pb-1">
      <div v-for="(col, ci) in grid" :key="ci" class="flex flex-col gap-[5px]">
        <span
          v-for="(c, ri) in col"
          :key="c.date"
          class="cell h-3.5 w-3.5 rounded-[4px] sm:h-4 sm:w-4"
          :class="c.future && 'opacity-30'"
          :style="{ background: colors[level(c.count)], animationDelay: `${(ci * 7 + ri) * 6}ms` }"
          :title="`${c.label}: ${c.count} ${pluralize(c.count, 'действие', 'действия', 'действий')}`"
        />
      </div>
    </div>
    <div class="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
      меньше
      <span v-for="(c, i) in colors" :key="i" class="h-3 w-3 rounded-[3px]" :style="{ background: c }" />
      больше
    </div>
  </div>
</template>

<style scoped>
.cell { animation: fade-up 0.6s var(--ease-out-expo) both; transition: transform 0.2s; }
.cell:hover { transform: scale(1.35); }
</style>
