<script setup lang="ts">
import type { SectionRef } from '~/types/content'
import { useProgressStore } from '~/stores/progress'

const props = defineProps<{ lessonId: string; sections: SectionRef[]; activeId: string | null }>()
const emit = defineEmits<{ navigate: [id: string]; completed: [el: HTMLElement | null] }>()
const store = useProgressStore()
const list = ref<HTMLElement>()
const indicator = ref({ y: 0, h: 0, visible: false })
const all = computed(() => props.sections.map(s => s.id))
const doneCount = computed(() => (store.ready ? store.sectionsOf(props.lessonId).filter(id => all.value.includes(id)).length : 0))

function place() {
  const el = list.value?.querySelector<HTMLElement>(`[data-sid="${props.activeId}"]`)
  if (!el) return (indicator.value.visible = false)
  indicator.value = { y: el.offsetTop, h: el.offsetHeight, visible: true }
}
watch(() => props.activeId, () => nextTick(place))
onMounted(() => nextTick(place))

function toggle(sid: string, e: MouseEvent) {
  const finished = store.toggleSection(props.lessonId, sid, all.value)
  if (finished) emit('completed', e.currentTarget as HTMLElement)
}
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between">
      <span class="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Разделы урока</span>
      <span class="font-mono text-xs font-bold text-ink">{{ doneCount }}/{{ sections.length }}</span>
    </div>
    <div class="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
      <div class="h-full rounded-full bg-gradient-to-r from-accent-mid to-accent transition-[width] duration-700 ease-[var(--ease-out-expo)]" :style="{ width: `${(doneCount / Math.max(1, sections.length)) * 100}%` }" />
    </div>
    <ol ref="list" class="relative space-y-0.5">
      <span
        class="absolute left-0 right-0 rounded-xl bg-accent-soft transition-all duration-500 ease-[var(--ease-spring)]"
        :style="{ transform: `translateY(${indicator.y}px)`, height: `${indicator.h}px`, opacity: indicator.visible ? 1 : 0 }"
      />
      <li v-for="s in sections" :key="s.id" :data-sid="s.id" class="relative flex items-start gap-2.5 rounded-xl px-2 py-1.5">
        <CheckToggle size="sm" class="mt-0.5" :checked="store.ready && store.isSectionDone(lessonId, s.id)" :label="`Раздел «${s.text}» прочитан`" @toggle="toggle(s.id, $event)" />
        <button
          type="button"
          class="text-left text-[13.5px] leading-snug transition-colors"
          :class="activeId === s.id ? 'font-semibold text-ink' : 'text-muted hover:text-ink'"
          @click="emit('navigate', s.id)"
        >
          {{ s.text }}
        </button>
      </li>
    </ol>
  </div>
</template>
