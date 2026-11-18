<script setup lang="ts">
import { Search, CornerDownLeft, BookOpen, Hash, LayoutGrid, ArrowRight } from 'lucide-vue-next'
import type Fuse from 'fuse.js'
import type { SearchEntry } from '~/types/content'
import { useProgressStore } from '~/stores/progress'

const open = usePalette()
const router = useRouter()
const { manifest, loadSearch, getLesson } = useContent()
const store = useProgressStore()
const query = ref('')
const input = ref<HTMLInputElement>()
const active = ref(0)
const listEl = ref<HTMLElement>()
let fuse: Fuse<SearchEntry> | null = null
const entries = shallowRef<SearchEntry[]>([])
const loading = ref(false)

// Нормализация и грубый «стемминг» для русского: «биение», «биения», «биением» → «бие…»
const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
const stem = (w: string) => (w.length > 5 ? w.slice(0, w.length - 2) : w.length > 3 ? w.slice(0, w.length - 1) : w)
const queryStems = computed(() => norm(query.value.trim()).split(/[\s,]+/).filter(w => w.length > 1).map(stem))

function exactSearch(): SearchEntry[] {
  const words = queryStems.value
  if (!words.length) return []
  const scored: { e: SearchEntry; score: number }[] = []
  for (const e of entries.value) {
    const t = norm(e.title)
    const x = norm(e.text)
    let score = 0
    for (const w of words) {
      const inT = t.includes(w)
      const hits = x.split(w).length - 1
      if (!inT && !hits) {
        score = -1
        break
      }
      score += (inT ? 12 : 0) + Math.min(6, hits)
    }
    if (score > 0) scored.push({ e, score: score + (e.type === 'section' ? 0 : 4) })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 24).map(o => o.e)
}

async function ensureIndex() {
  if (fuse) return
  loading.value = true
  const [{ default: FuseCtor }, data] = await Promise.all([import('fuse.js'), loadSearch()])
  entries.value = data
  fuse = new FuseCtor(data, {
    keys: [{ name: 'title', weight: 0.55 }, { name: 'text', weight: 0.35 }, { name: 'lesson', weight: 0.1 }],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  })
  loading.value = false
}

interface Item {
  key: string
  kind: 'module' | 'lesson' | 'section' | 'continue'
  title: string
  sub: string
  snippet?: string
  to: string
  emoji?: string
}

function snippet(text: string, _q: string) {
  const i = queryStems.value.length ? norm(text).indexOf(queryStems.value[0]!) : -1
  if (i < 0) return text.slice(0, 110) + (text.length > 110 ? '…' : '')
  const s = Math.max(0, i - 50)
  return (s ? '…' : '') + text.slice(s, i + 90) + '…'
}
const results = computed<Item[]>(() => {
  const q = query.value.trim()
  if (!q || q.length < 2 || !fuse) {
    const items: Item[] = []
    const last = store.ready && store.last ? getLesson(store.last.id) : undefined
    if (last) items.push({ key: 'continue', kind: 'continue', title: last.shortTitle, sub: `Продолжить · ${last.module.title}`, to: `/modules/${last.id}`, emoji: last.emoji })
    for (const m of manifest.modules) items.push({ key: m.slug, kind: 'module', title: m.title, sub: `Модуль ${m.number} · ${m.lessons.length} уроков`, to: `/modules/${m.slug}`, emoji: m.emoji })
    return items
  }
  const exact = exactSearch()
  const seen = new Set(exact.map(e => `${e.id}#${e.sid ?? ''}`))
  const fuzzy = exact.length >= 8 ? [] : fuse.search(q, { limit: 16 }).map(r => r.item).filter(e => !seen.has(`${e.id}#${e.sid ?? ''}`))
  return [...exact, ...fuzzy]
    .slice(0, 24)
    .map(item => {
      const lesson = item.type !== 'module' ? getLesson(item.id) : undefined
      return {
        key: `${item.id}#${item.sid ?? ''}`,
        kind: item.type,
        title: item.title,
        sub: item.type === 'module' ? 'Модуль' : item.type === 'lesson' ? `Урок · ${item.module}` : `${item.lesson} · ${item.module}`,
        snippet: snippet(item.text, q),
        to: item.type === 'module' ? `/modules/${item.id}` : `/modules/${item.id}${item.sid ? `#${item.sid}` : ''}`,
        emoji: lesson?.emoji,
      } satisfies Item
    })
})

function highlight(text: string) {
  const q = query.value.trim()
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  if (q.length < 2) return safe
  const words = queryStems.value.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!words.length) return safe
  return safe.replace(new RegExp(`((?:${words.join('|')})[а-яёa-z0-9]*)`, 'gi'), '<mark>$1</mark>')
}

function go(item?: Item) {
  if (!item) return
  open.value = false
  router.push(item.to)
}

watch(open, async v => {
  if (v) {
    query.value = ''
    active.value = 0
    await nextTick()
    input.value?.focus()
    ensureIndex()
  }
})
watch(query, () => (active.value = 0))
watch(active, async () => {
  await nextTick()
  listEl.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
})

onKeyStroke(e => {
  const typing = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
  if ((e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    open.value = !open.value
  } else if (e.key === '/' && !typing && !open.value) {
    e.preventDefault()
    open.value = true
  }
})
onKeyStroke('Escape', () => {
  if (open.value) open.value = false
})
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    active.value = Math.min(results.value.length - 1, active.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = Math.max(0, active.value - 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    go(results.value[active.value])
  }
}
const iconFor = (k: Item['kind']) => (k === 'module' ? LayoutGrid : k === 'section' ? Hash : k === 'continue' ? ArrowRight : BookOpen)
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="open" class="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[9vh] sm:pt-[12vh]" @keydown="onKey">
        <div class="absolute inset-0 bg-[color-mix(in_oklab,var(--ink)_28%,transparent)] backdrop-blur-sm" @click="open = false" />
        <div class="panel card relative flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden shadow-lift" role="dialog" aria-label="Поиск по курсу">
          <div class="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <Search class="h-5 w-5 shrink-0 text-muted" />
            <input
              ref="input"
              v-model="query"
              type="search"
              placeholder="Найти урок, термин или код: G54, микрометр, CNMG…"
              class="w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-muted"
              autocomplete="off"
              spellcheck="false"
            />
            <span class="kbd hidden sm:inline">Esc</span>
          </div>
          <div ref="listEl" class="overflow-y-auto p-2" v-auto-animate="{ duration: 180 }">
            <p v-if="!query" class="px-3 pb-1 pt-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Быстрый переход</p>
            <p v-if="query.length > 1 && !loading && !results.length" class="px-3 py-10 text-center text-muted">Ничего не нашлось. Попробуйте другое слово 🔎</p>
            <button
              v-for="(it, i) in results"
              :key="it.key"
              type="button"
              :data-active="i === active"
              class="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
              :class="i === active ? 'bg-accent-soft' : 'hover:bg-surface-2'"
              @mousemove="active = i"
              @click="go(it)"
            >
              <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-[15px]">
                <template v-if="it.emoji">{{ it.emoji }}</template>
                <component :is="iconFor(it.kind)" v-else class="h-4 w-4 text-muted" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14.5px] font-semibold text-ink" v-html="highlight(it.title)" />
                <span class="block truncate text-xs text-muted">{{ it.sub }}</span>
                <span v-if="it.snippet && query" class="mt-1 line-clamp-2 block text-[13px] leading-snug text-ink-2" v-html="highlight(it.snippet)" />
              </span>
              <CornerDownLeft v-if="i === active" class="mt-2 h-4 w-4 shrink-0 text-accent" />
            </button>
          </div>
          <div class="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-muted sm:flex">
            <span><span class="kbd">↑</span> <span class="kbd">↓</span> выбор</span>
            <span><span class="kbd">Enter</span> открыть</span>
            <span class="ml-auto"><span class="kbd">/</span> или <span class="kbd">Ctrl K</span> — поиск</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-enter-active, .palette-leave-active { transition: opacity 0.3s ease; }
.palette-enter-active .panel, .palette-leave-active .panel { transition: transform 0.45s var(--ease-spring), opacity 0.3s ease, filter 0.3s ease; }
.palette-enter-from, .palette-leave-to { opacity: 0; }
.palette-enter-from .panel, .palette-leave-to .panel { transform: translateY(-14px) scale(0.97); opacity: 0; filter: blur(6px); }
:deep(mark) { background: var(--butter-soft); color: var(--ink); border-radius: 0.25rem; padding: 0 0.1rem; }
</style>
