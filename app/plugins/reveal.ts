// v-reveal: элемент мягко «проявляется» при попадании в экран.
// v-reveal="120" — задержка в мс (удобно для каскадов).
export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive<HTMLElement, number | undefined>('reveal', {
    getSSRProps: () => ({}),
    mounted(el, binding) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      el.style.setProperty('--reveal-delay', `${binding.value ?? 0}ms`)
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.92) {
        el.classList.add('reveal-in')
        return
      }
      el.classList.add('reveal-pending')
      const io = new IntersectionObserver(
        entries => {
          for (const e of entries) {
            if (e.isIntersecting) {
              el.classList.remove('reveal-pending')
              el.classList.add('reveal-in')
              io.disconnect()
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      io.observe(el)
      ;(el as any).__revealIo = io
    },
    unmounted(el) {
      ;(el as any).__revealIo?.disconnect()
    },
  })
})
