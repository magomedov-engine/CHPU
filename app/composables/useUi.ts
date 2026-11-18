// Общее состояние интерфейса: палитра поиска, лайтбокс, уведомления, конфетти, тема.
export interface Toast {
  id: number
  title: string
  text?: string
  tone?: 'success' | 'info' | 'warning'
}

export const usePalette = () => useState('palette-open', () => false)
export const useLightbox = () => useState<string | null>('lightbox-src', () => null)
export const useMobileToc = () => useState('mobile-toc', () => false)

export function useToasts() {
  const toasts = useState<Toast[]>('toasts', () => [])
  function push(t: Omit<Toast, 'id'>, ms = 3800) {
    const id = Date.now() + Math.random()
    toasts.value = [...toasts.value, { ...t, id }]
    if (import.meta.client) setTimeout(() => dismiss(id), ms)
  }
  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
  return { toasts, push, dismiss }
}

const PASTELS = ['#a9c6f5', '#bfb0f2', '#9fd9bd', '#f6bb9b', '#f0d384', '#f3abc0']

export function useConfetti() {
  async function burst(el?: HTMLElement | null, big = false) {
    if (!import.meta.client) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const confetti = (await import('canvas-confetti')).default
    let origin = { x: 0.5, y: 0.6 }
    if (el) {
      const r = el.getBoundingClientRect()
      origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight }
    }
    confetti({ particleCount: big ? 160 : 70, spread: big ? 100 : 65, startVelocity: big ? 48 : 34, origin, colors: PASTELS, scalar: 0.95, ticks: 220, disableForReducedMotion: true })
    if (big) {
      setTimeout(() => confetti({ particleCount: 90, angle: 60, spread: 70, origin: { x: 0, y: 0.75 }, colors: PASTELS }), 220)
      setTimeout(() => confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.75 }, colors: PASTELS }), 380)
    }
  }
  return { burst }
}

// Переключение темы с круговым «раскрытием» через View Transitions API
export function useThemeToggle() {
  const isDark = useDark({ disableTransition: false })
  function toggle(e?: MouseEvent) {
    const root = document.documentElement
    const apply = () => {
      root.classList.toggle('dark', !isDark.value)
      isDark.value = !isDark.value
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }
    if (!doc.startViewTransition || reduce) {
      apply()
      return
    }
    const x = e?.clientX ?? window.innerWidth - 40
    const y = e?.clientY ?? 40
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    root.classList.add('vt-theme')
    const t = doc.startViewTransition(apply)
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    t.finished.finally(() => root.classList.remove('vt-theme'))
  }
  return { isDark, toggle }
}
