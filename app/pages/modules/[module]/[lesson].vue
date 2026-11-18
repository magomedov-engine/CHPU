<script setup lang="ts">
import { ArrowLeft, ArrowRight, Clock, CircleHelp, ListTree, Check, X, Sparkles } from 'lucide-vue-next'
import { useProgressStore } from '~/stores/progress'

definePageMeta({ key: route => route.fullPath.split('#')[0] })

const route = useRoute()
const router = useRouter()
const { getModule, getLesson, neighbors, loadLesson } = useContent()
const store = useProgressStore()
const { burst } = useConfetti()
const { push } = useToasts()

const id = `${route.params.module}/${route.params.lesson}`
const meta = getLesson(id)
const mod = getModule(String(route.params.module))
if (!meta || !mod) throw createError({ statusCode: 404, statusMessage: 'Урок не найден', fatal: true })
const m = mod
const lmeta = meta

// Контент берётся из JS-чанка урока (без дублирования в payload): он же доступен офлайн
const lesson = shallowRef(await loadLesson(m.slug, lmeta.slug))
if (!lesson.value) throw createError({ statusCode: 404, statusMessage: 'Урок не найден', fatal: true })

useSeoMeta({
  title: `${lmeta.shortTitle} — ${m.title}`,
  description: lmeta.description,
  ogTitle: lmeta.title,
  ogDescription: lmeta.description,
  ogType: 'article',
})

const { prev, next } = neighbors(id)
const sectionIds = lmeta.sections.map(s => s.id)
const done = computed(() => store.ready && store.isDone(id))

// ---------- прогресс чтения и оглавление ----------
const { y } = useWindowScroll()
const docH = ref(1)
const readProgress = computed(() => Math.min(1, Math.max(0, y.value / Math.max(1, docH.value))))
const activeId = ref<string | null>(null)
let io: IntersectionObserver | null = null
function onRendered(root: HTMLElement) {
  docH.value = document.documentElement.scrollHeight - window.innerHeight
  io?.disconnect()
  const heads = [...root.querySelectorAll<HTMLElement>('h2[id]')]
  io = new IntersectionObserver(
    entries => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) activeId.value = vis[0].target.id
    },
    { rootMargin: '-15% 0px -70% 0px' },
  )
  heads.forEach(h => io!.observe(h))
  if (route.hash) {
    const el = document.getElementById(decodeURIComponent(route.hash.slice(1)))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'instant', block: 'start' }), 120)
  }
}
useResizeObserver(typeof document !== 'undefined' ? document.body : null, () => {
  docH.value = document.documentElement.scrollHeight - window.innerHeight
})
onBeforeUnmount(() => io?.disconnect())
onMounted(() => store.visit(id))
watch(() => store.ready, r => r && store.visit(id))

const mobileToc = useMobileToc()
function goTo(sid: string) {
  mobileToc.value = false
  const el = document.getElementById(sid)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // страховка: если плавная прокрутка не сработала (фоновая вкладка, старый браузер) — прыжок
  setTimeout(() => {
    if (Math.abs(el.getBoundingClientRect().top - 100) > 140) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, 900)
  history.replaceState(history.state, '', `#${sid}`)
}

// ---------- завершение ----------
const completeBtn = ref<HTMLElement>()
function celebrate(el?: HTMLElement | null) {
  const moduleNowComplete = store.moduleStats(m).complete
  burst(el ?? completeBtn.value, moduleNowComplete)
  push(moduleNowComplete ? { title: `Модуль «${m.title}» пройден! 🎉`, text: 'Можно переходить к следующему.' } : { title: 'Урок пройден', text: next ? `Дальше: ${next.shortTitle}` : 'Это был последний урок курса!' })
}
function toggleComplete() {
  const nowDone = store.toggleLesson(id, sectionIds)
  if (nowDone) celebrate()
  else {
    store.sections[id] = []
    push({ title: 'Отметка снята', tone: 'info' })
  }
}

// ---------- клавиатура и свайпы ----------
onKeyStroke(['ArrowLeft', 'ArrowRight'], e => {
  const t = e.target as HTMLElement
  if (['INPUT', 'TEXTAREA'].includes(t?.tagName) || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[role="dialog"]')) return
  if (e.key === 'ArrowLeft' && prev) router.push(`/modules/${prev.id}`)
  if (e.key === 'ArrowRight' && next) router.push(`/modules/${next.id}`)
})
const swipeEl = ref<HTMLElement>()
const dx = ref(0)
let touch: { x: number; y: number; ok: boolean; horiz: boolean | null } | null = null
function tStart(e: TouchEvent) {
  const t = e.target as HTMLElement
  const blocked = !!t.closest('pre, .table-wrap, .mermaid-block, figure, button, input')
  touch = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY, ok: !blocked, horiz: null }
}
function tMove(e: TouchEvent) {
  if (!touch?.ok) return
  const ddx = e.touches[0]!.clientX - touch.x
  const ddy = e.touches[0]!.clientY - touch.y
  if (touch.horiz === null && (Math.abs(ddx) > 10 || Math.abs(ddy) > 10)) touch.horiz = Math.abs(ddx) > Math.abs(ddy) * 1.4
  if (touch.horiz) dx.value = ddx * 0.35
}
function tEnd() {
  if (touch?.horiz) {
    if (dx.value < -40 && next) router.push(`/modules/${next.id}`)
    else if (dx.value > 40 && prev) router.push(`/modules/${prev.id}`)
  }
  dx.value = 0
  touch = null
}
</script>

<template>
  <div v-if="lesson" :class="`accent-${m.accent}`">
    <!-- полоса прогресса чтения -->
    <div class="fixed inset-x-0 top-0 z-50 h-[3px]">
      <div class="h-full origin-left bg-gradient-to-r from-accent-mid to-accent" :style="{ transform: `scaleX(${readProgress})` }" />
    </div>

    <div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:pt-10">
      <!-- шапка урока -->
      <header class="mx-auto max-w-3xl lg:mx-0 lg:max-w-none">
        <nav class="animate-fade-up flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Хлебные крошки">
          <NuxtLink to="/modules" class="hover:text-ink">Модули</NuxtLink>
          <span>/</span>
          <NuxtLink :to="`/modules/${m.slug}`" class="hover:text-ink">{{ m.emoji }} {{ m.title }}</NuxtLink>
        </nav>
        <div class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
          <div class="max-w-3xl">
            <div class="animate-fade-up flex items-center gap-3">
              <span class="grid h-12 w-12 place-items-center rounded-2xl border border-accent-mid bg-accent-soft text-2xl shadow-soft">{{ lmeta.emoji }}</span>
              <span class="eyebrow">Модуль {{ String(m.number).padStart(2, '0') }} · Урок {{ String(lmeta.number).padStart(2, '0') }}</span>
            </div>
            <h1 class="mt-5 font-display text-[1.9rem] font-semibold leading-[1.15] text-ink sm:text-[2.6rem]" :style="{ viewTransitionName: `vt-ltitle-${m.number}-${lmeta.number}` }">{{ lmeta.title }}</h1>
            <div class="animate-fade-up mt-5 flex flex-wrap gap-2" style="animation-delay: 120ms">
              <span class="chip"><Clock class="h-4 w-4 text-accent" /> ~{{ lmeta.minutes }} мин</span>
              <span v-if="lmeta.questions" class="chip"><CircleHelp class="h-4 w-4 text-accent" /> {{ lmeta.questions }} {{ pluralize(lmeta.questions, 'вопрос', 'вопроса', 'вопросов') }}</span>
              <span class="chip"><ListTree class="h-4 w-4 text-accent" /> {{ lmeta.sections.length }} {{ pluralize(lmeta.sections.length, 'раздел', 'раздела', 'разделов') }}</span>
              <Transition name="pop">
                <span v-if="done" class="chip border-accent-mid bg-accent-soft text-ink"><Check class="h-4 w-4 text-accent" /> Пройден</span>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <!-- содержимое -->
        <div
          ref="swipeEl"
          class="min-w-0 max-w-3xl"
          :style="{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? 'none' : 'transform .45s var(--ease-spring)' }"
          @touchstart.passive="tStart"
          @touchmove.passive="tMove"
          @touchend="tEnd"
        >
          <div class="animate-fade-up" style="animation-delay: 160ms">
            <LessonContent :html="lesson.html" @rendered="onRendered" />
          </div>

          <!-- завершение -->
          <div class="card relative mt-16 overflow-hidden p-6 text-center sm:p-10">
            <div class="blueprint absolute inset-0 opacity-60" />
            <div class="relative">
              <p class="eyebrow">{{ done ? 'Урок пройден' : 'Дочитали до конца?' }}</p>
              <h2 class="mt-2 font-display text-2xl font-semibold text-ink">{{ done ? 'Отлично, так держать!' : 'Отметьте урок пройденным' }}</h2>
              <button
                ref="completeBtn"
                type="button"
                class="complete-btn mx-auto mt-6 flex h-14 items-center gap-3 rounded-full px-7 font-bold transition-all duration-500"
                :class="done ? 'border border-accent-mid bg-accent-soft text-ink' : 'bg-ink text-bg shadow-lift hover:-translate-y-0.5'"
                @click="toggleComplete"
              >
                <span class="grid h-7 w-7 place-items-center rounded-full transition-all duration-500" :class="done ? 'bg-accent text-surface' : 'bg-bg/20'">
                  <Check v-if="done" class="h-4 w-4" />
                  <Sparkles v-else class="h-4 w-4" />
                </span>
                {{ done ? 'Пройден — снять отметку' : 'Я прошёл этот урок' }}
              </button>
            </div>
          </div>

          <!-- навигация -->
          <nav class="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Соседние уроки">
            <NuxtLink v-if="prev" :to="`/modules/${prev.id}`" class="card group p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
              <span class="flex items-center gap-2 text-sm font-semibold text-muted"><ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Назад</span>
              <span class="mt-2 block font-semibold text-ink">{{ prev.emoji }} {{ prev.shortTitle }}</span>
              <span class="mt-1 block text-xs text-muted">{{ prev.module.title }}</span>
            </NuxtLink>
            <span v-else />
            <NuxtLink v-if="next" :to="`/modules/${next.id}`" :class="`accent-${next.module.accent}`" class="card group p-5 text-right transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
              <span class="flex items-center justify-end gap-2 text-sm font-semibold text-muted">Дальше <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              <span class="mt-2 block font-semibold text-ink">{{ next.emoji }} {{ next.shortTitle }}</span>
              <span class="mt-1 block text-xs text-muted">{{ next.module.title }}</span>
            </NuxtLink>
          </nav>
          <p class="mt-4 hidden text-center text-xs text-muted md:block"><span class="kbd">←</span> <span class="kbd">→</span> — переход между уроками</p>
        </div>

        <!-- боковое оглавление -->
        <aside class="hidden lg:block">
          <div class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-1">
            <div class="card p-5">
              <LessonToc :lesson-id="id" :sections="lmeta.sections" :active-id="activeId" @navigate="goTo" @completed="celebrate" />
            </div>
            <div class="mt-4 flex items-center gap-3 px-1">
              <ProgressRing :value="readProgress" :size="40" :stroke="4" />
              <span class="text-sm text-muted">прочитано</span>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- мобильное оглавление -->
    <button
      type="button"
      class="fixed bottom-24 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-ink text-bg shadow-lift transition-transform active:scale-90 lg:hidden"
      aria-label="Разделы урока"
      @click="mobileToc = true"
    >
      <span class="pointer-events-none absolute inset-0"><ProgressRing :value="readProgress" :size="56" :stroke="3" /></span>
      <ListTree class="relative h-5 w-5" />
    </button>
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="mobileToc" class="fixed inset-0 z-[60] lg:hidden" :class="`accent-${m.accent}`" role="dialog" aria-label="Разделы урока">
          <div class="absolute inset-0 bg-[color-mix(in_oklab,var(--ink)_30%,transparent)] backdrop-blur-sm" @click="mobileToc = false" />
          <div class="sheet absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[1.75rem] border-t border-line bg-surface p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift">
            <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--line-2)]" />
            <div class="mb-2 flex items-center justify-between">
              <span class="font-display font-semibold text-ink">{{ lmeta.shortTitle }}</span>
              <button type="button" class="grid h-9 w-9 place-items-center rounded-full bg-surface-2" aria-label="Закрыть" @click="mobileToc = false"><X class="h-4 w-4" /></button>
            </div>
            <LessonToc :lesson-id="id" :sections="lmeta.sections" :active-id="activeId" @navigate="goTo" @completed="celebrate" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.pop-enter-active { animation: pop 0.5s var(--ease-spring); }
.pop-leave-active { transition: opacity 0.2s; }
.pop-leave-to { opacity: 0; }
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.35s ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 0.5s var(--ease-spring); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
.complete-btn:active { transform: scale(0.96); }
</style>
