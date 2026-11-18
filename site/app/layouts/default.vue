<script setup lang="ts">
import { WifiOff } from "lucide-vue-next";

const online = useOnline();
const mounted = ref(false);
onMounted(() => (mounted.value = true));
</script>

<template>
  <div class="relative flex min-h-dvh flex-col">
    <BackgroundDecor />
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift"
      >К содержимому</a
    >
    <AppHeader />
    <Transition name="offline">
      <div
        v-if="mounted && !online"
        class="accent-peach mx-auto mt-2 flex items-center gap-2 rounded-full border border-accent-mid bg-accent-soft px-4 py-1.5 text-sm font-semibold text-ink"
      >
        <WifiOff class="h-4 w-4 text-accent" /> Нет сети — курс работает офлайн
      </div>
    </Transition>
    <main id="main" class="flex-1 pb-28 md:pb-12">
      <slot />
    </main>
    <footer class="hidden border-t border-line py-8 md:block">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 text-sm text-muted"
      >
        <div class="flex items-center gap-2.5">
          <AppLogo :size="26" />
          <span>RE:ACTABLE — учебный курс оператора станков с ЧПУ</span>
        </div>
        <span>Прогресс хранится только в этом браузере</span>
      </div>
    </footer>
    <MobileNav />
    <CommandPalette />
    <ImageLightbox />
    <ToastHost />
  </div>
</template>

<style scoped>
.offline-enter-active,
.offline-leave-active {
  transition: all 0.4s var(--ease-spring);
}
.offline-enter-from,
.offline-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
