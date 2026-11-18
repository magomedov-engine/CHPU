<script setup lang="ts">
import { Search, Download } from "lucide-vue-next";
import { useProgressStore } from "~/stores/progress";

const route = useRoute();
const palette = usePalette();
const store = useProgressStore();
const { manifest } = useContent();
const { y } = useWindowScroll();
const scrolled = computed(() => y.value > 8);
const total = computed(() =>
  store.ready ? store.completedCount / manifest.stats.lessons : 0,
);
const { $pwa } = useNuxtApp();

const isMac = ref(false);
onMounted(() => (isMac.value = /Mac|iPhone|iPad/.test(navigator.platform)));

const links = [
  { to: "/", label: "Главная", match: (p: string) => p === "/" },
  {
    to: "/modules",
    label: "Модули",
    match: (p: string) => p.startsWith("/modules"),
  },
  {
    to: "/progress",
    label: "Прогресс",
    match: (p: string) => p.startsWith("/progress"),
  },
];
const navRef = ref<HTMLElement>();
const pill = ref({ x: 0, w: 0, visible: false });
function updatePill() {
  const el = navRef.value?.querySelector<HTMLElement>('[data-active="true"]');
  if (!el) return (pill.value.visible = false);
  pill.value = { x: el.offsetLeft, w: el.offsetWidth, visible: true };
}
watch(
  () => route.path,
  () => nextTick(updatePill),
);
onMounted(() => {
  nextTick(updatePill);
  document.fonts?.ready.then(updatePill);
});
useResizeObserver(navRef, updatePill);
useEventListener("resize", updatePill);
</script>

<template>
  <header
    class="sticky top-0 z-40 transition-[box-shadow,background-color] duration-500"
    :class="scrolled ? 'glass shadow-[0_1px_0_var(--line)]' : 'bg-transparent'"
  >
    <div
      class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[72px]"
    >
      <NuxtLink
        to="/"
        class="group flex items-center gap-2.5"
        aria-label="На главную"
      >
        <AppLogo :size="36" />
        <span
          class="font-display text-[15px] font-semibold leading-none tracking-tight text-ink"
        >
          RE<span class="mx-1 text-accent">:</span>ACTABLE
        </span>
      </NuxtLink>

      <nav
        ref="navRef"
        class="relative ml-6 hidden items-center gap-1 md:flex"
        aria-label="Основная навигация"
      >
        <span
          class="absolute inset-y-1 rounded-full bg-surface shadow-soft ring-1 ring-line transition-all duration-500 ease-[var(--ease-spring)]"
          :style="{
            transform: `translateX(${pill.x}px)`,
            width: `${pill.w}px`,
            opacity: pill.visible ? 1 : 0,
          }"
        />
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          :data-active="l.match(route.path)"
          class="relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          :class="
            l.match(route.path) ? 'text-ink' : 'text-muted hover:text-ink'
          "
        >
          {{ l.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="group hidden h-10 items-center gap-3 rounded-full border border-line bg-surface pl-3.5 pr-2 text-sm text-muted transition hover:-translate-y-0.5 hover:text-ink hover:shadow-soft sm:flex"
          @click="palette = true"
        >
          <Search class="h-4 w-4" />
          <span class="hidden lg:inline">Поиск по курсу</span>
          <span class="kbd">{{ isMac ? "⌘" : "Ctrl" }} K</span>
        </button>
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink-2 sm:hidden"
          aria-label="Поиск"
          @click="palette = true"
        >
          <Search class="h-5 w-5" />
        </button>
        <button
          v-if="$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled"
          type="button"
          class="hidden h-10 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-ink-2 transition hover:-translate-y-0.5 hover:shadow-soft lg:flex"
          @click="$pwa.install()"
        >
          <Download class="h-4 w-4" /> Установить
        </button>
        <NuxtLink
          to="/progress"
          class="accent-mint hidden rounded-full transition hover:-translate-y-0.5 sm:block"
          aria-label="Мой прогресс"
        >
          <ProgressRing :value="total" :size="40" :stroke="4">
            <template #default="{ value }">
              <span class="font-mono text-[10px] font-bold text-ink">{{
                Math.round(value * 100)
              }}</span>
            </template>
          </ProgressRing>
        </NuxtLink>
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
