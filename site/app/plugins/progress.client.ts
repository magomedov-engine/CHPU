import { useProgressStore } from '~/stores/progress'

// Прогресс хранится в localStorage. Загружаем после полной гидрации (включая асинхронные
// страницы), чтобы SSR-разметка совпала с клиентской, а кольца прогресса «доросли» до значения.
export default defineNuxtPlugin(nuxtApp => {
  const store = useProgressStore()
  let started = false
  const start = () => {
    if (started) return
    started = true
    store.load()
    watch(() => [store.completed, store.sections, store.last, store.activity], () => store.save(), { deep: true })
    window.addEventListener('storage', e => {
      if (e.key === 'chpu-progress-v1') store.load()
    })
  }
  nuxtApp.hook('app:suspense:resolve', () => nextTick(start))
  // Страховка, если suspense не сработал (например, страница ошибки)
  nuxtApp.hook('app:mounted', () => setTimeout(start, 1500))
})
