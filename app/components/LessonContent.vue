<script setup lang="ts">
const props = defineProps<{ html: string }>()
const emit = defineEmits<{ rendered: [root: HTMLElement] }>()

const root = ref<HTMLElement>()
const config = useRuntimeConfig()
const router = useRouter()
const lightbox = useLightbox()
const isDark = useDark()
const base = config.app.baseURL.endsWith('/') ? config.app.baseURL : `${config.app.baseURL}/`
const content = computed(() => props.html.replaceAll('__BASE__', base))

// ---------- Mermaid ----------
let mermaidMod: typeof import('mermaid')['default'] | null = null
let renderSeq = 0
function themeVars(dark: boolean) {
  return dark
    ? { primaryColor: '#262142', primaryBorderColor: '#6a5bc0', primaryTextColor: '#eceef6', secondaryColor: '#1d2a45', tertiaryColor: '#17322a', lineColor: '#8a90a8', textColor: '#eceef6', mainBkg: '#262142', nodeBorder: '#6a5bc0', clusterBkg: '#191c26', clusterBorder: '#363c4d', edgeLabelBackground: '#191c26', actorBkg: '#262142', actorBorder: '#6a5bc0', actorTextColor: '#eceef6', signalColor: '#c9cddc', signalTextColor: '#eceef6', noteBkgColor: '#332b14', noteTextColor: '#f2d27a', fontFamily: 'Manrope, sans-serif', fontSize: '15px' }
    : { primaryColor: '#ece6ff', primaryBorderColor: '#a898ec', primaryTextColor: '#1d2130', secondaryColor: '#e3eeff', tertiaryColor: '#dcf3e8', lineColor: '#8f95ab', textColor: '#1d2130', mainBkg: '#ece6ff', nodeBorder: '#a898ec', clusterBkg: '#faf8f4', clusterBorder: '#e6e0d4', edgeLabelBackground: '#ffffff', actorBkg: '#ece6ff', actorBorder: '#a898ec', actorTextColor: '#1d2130', signalColor: '#3b4052', signalTextColor: '#1d2130', noteBkgColor: '#fff3cf', noteTextColor: '#6b5208', fontFamily: 'Manrope, sans-serif', fontSize: '15px' }
}
async function renderMermaid() {
  const el = root.value
  if (!el) return
  const blocks = [...el.querySelectorAll<HTMLElement>('.mermaid-block')]
  if (!blocks.length) return
  if (!mermaidMod) mermaidMod = (await import('mermaid')).default
  mermaidMod.initialize({ startOnLoad: false, theme: 'base', themeVariables: themeVars(isDark.value), flowchart: { curve: 'basis', padding: 14, htmlLabels: true }, securityLevel: 'loose' })
  const seq = ++renderSeq
  for (const b of blocks) {
    const src = b.querySelector('.mermaid-src')?.textContent || ''
    const out = b.querySelector<HTMLElement>('.mermaid-out')
    if (!out) continue
    try {
      const { svg } = await mermaidMod.render(`mmd-${seq}-${Math.random().toString(36).slice(2)}`, src)
      if (seq !== renderSeq) return
      out.innerHTML = svg
      out.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' })
    } catch {
      out.innerHTML = `<pre style="white-space:pre-wrap;font-size:.8rem;color:var(--muted)">${src.replace(/</g, '&lt;')}</pre>`
    }
  }
}

// ---------- плавное раскрытие ответов ----------
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
function toggleDetails(d: HTMLDetailsElement) {
  const body = d.querySelector<HTMLElement>(':scope > .callout-body')
  if (!body || reduce()) {
    d.open = !d.open
    return
  }
  const ease = 'cubic-bezier(.16,1,.3,1)'
  if (d.open) {
    const h = body.offsetHeight
    const pb = getComputedStyle(body).paddingBottom
    const a = body.animate([{ height: `${h}px`, paddingBottom: pb, opacity: 1 }, { height: '0px', paddingBottom: '0px', opacity: 0 }], { duration: 320, easing: ease })
    a.onfinish = () => (d.open = false)
  } else {
    d.open = true
    const h = body.offsetHeight
    const pb = getComputedStyle(body).paddingBottom
    body.animate([{ height: '0px', paddingBottom: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: `${h}px`, paddingBottom: pb, opacity: 1, transform: 'none' }], { duration: 460, easing: ease })
  }
}

// ---------- делегирование кликов ----------
async function onClick(e: MouseEvent) {
  const t = e.target as HTMLElement
  const summary = t.closest('summary')
  if (summary && summary.parentElement instanceof HTMLDetailsElement && summary.parentElement.classList.contains('callout')) {
    e.preventDefault()
    toggleDetails(summary.parentElement)
    return
  }
  const copy = t.closest<HTMLButtonElement>('.code-copy')
  if (copy) {
    const code = copy.closest('.code-block')?.querySelector('code')?.textContent || ''
    try {
      await navigator.clipboard.writeText(code)
      copy.classList.add('copied')
      const label = copy.querySelector('span')
      if (label) label.textContent = 'Скопировано'
      setTimeout(() => {
        copy.classList.remove('copied')
        if (label) label.textContent = 'Копировать'
      }, 1600)
    } catch {
      /* буфер недоступен */
    }
    return
  }
  const fig = t.closest('figure.diagram')
  if (fig) {
    const img = fig.querySelector('img')
    if (img) lightbox.value = img.getAttribute('src')
    return
  }
  const a = t.closest<HTMLAnchorElement>('a[data-internal]')
  if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
    e.preventDefault()
    let href = a.getAttribute('href') || '/'
    if (href.startsWith(base)) href = `/${href.slice(base.length)}`
    router.push(href)
  }
}

async function enhance() {
  await nextTick()
  if (!root.value) return
  emit('rendered', root.value)
  renderMermaid()
}
onMounted(enhance)
watch(content, enhance)
watch(isDark, () => renderMermaid())
</script>

<template>
  <article ref="root" class="lesson" v-html="content" @click="onClick" />
</template>
