<script setup lang="ts">
import {
  Download,
  Upload,
  RotateCcw,
  Flame,
  CalendarDays,
  ListChecks,
  BookOpen,
  Smartphone,
  Lock,
} from "lucide-vue-next";
import { useProgressStore } from "~/stores/progress";

useSeoMeta({
  title: "Мой прогресс",
  description:
    "Статистика обучения, достижения и экспорт прогресса курса оператора ЧПУ.",
  robots: "noindex, follow",
});

const { manifest } = useContent();
const store = useProgressStore();
const achievements = useAchievements();
const { push } = useToasts();
const { burst } = useConfetti();
const { $pwa } = useNuxtApp();

const overall = computed(() =>
  store.ready ? store.completedCount / manifest.stats.lessons : 0,
);
const unlocked = computed(
  () => achievements.value.filter((a) => a.unlocked).length,
);
const cards = computed(() => [
  {
    icon: BookOpen,
    label: "Уроков пройдено",
    value: store.ready ? store.completedCount : 0,
    accent: "sky",
  },
  {
    icon: ListChecks,
    label: "Разделов отмечено",
    value: store.ready ? store.sectionsCount : 0,
    accent: "lavender",
  },
  {
    icon: Flame,
    label: "Дней подряд",
    value: store.ready ? store.streak : 0,
    accent: "peach",
  },
  {
    icon: CalendarDays,
    label: "Дней занятий",
    value: store.ready ? store.studyDays : 0,
    accent: "mint",
  },
]);

function exportData() {
  const blob = new Blob([store.exportJson()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `chpu-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  push({
    title: "Файл прогресса сохранён",
    text: "Его можно загрузить на другом устройстве.",
  });
}
const fileInput = ref<HTMLInputElement>();
async function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    store.importJson(await file.text());
    push({ title: "Прогресс загружен" });
    burst();
  } catch (err) {
    push({
      title: "Не удалось загрузить файл",
      text: (err as Error).message,
      tone: "warning",
    });
  } finally {
    if (fileInput.value) fileInput.value.value = "";
  }
}
const confirmReset = ref(false);
let resetTimer: ReturnType<typeof setTimeout> | undefined;
function resetData() {
  if (!confirmReset.value) {
    confirmReset.value = true;
    resetTimer = setTimeout(() => (confirmReset.value = false), 3500);
    return;
  }
  clearTimeout(resetTimer);
  confirmReset.value = false;
  store.reset();
  push({ title: "Прогресс сброшен", tone: "info" });
}
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:pt-14">
    <div class="animate-fade-up">
      <p class="eyebrow">Статистика</p>
      <h1 class="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
        Мой прогресс
      </h1>
    </div>

    <!-- общее -->
    <div class="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div
        class="card accent-mint flex flex-col items-center justify-center gap-4 p-8 text-center"
        v-reveal
      >
        <ProgressRing :value="overall" :size="200" :stroke="14">
          <template #default="{ value }">
            <div>
              <span class="block font-display text-5xl font-semibold text-ink"
                >{{ Math.round(value * 100)
                }}<span class="text-2xl">%</span></span
              >
              <span class="text-sm font-semibold text-muted">курса</span>
            </div>
          </template>
        </ProgressRing>
        <p class="text-muted">
          {{ store.ready ? store.completedCount : 0 }} из
          {{ manifest.stats.lessons }} уроков · {{ unlocked }} из
          {{ achievements.length }} достижений
        </p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="(c, i) in cards"
          :key="c.label"
          :class="`accent-${c.accent}`"
          class="card flex flex-col justify-between p-5"
          v-reveal="i * 70"
        >
          <span
            class="grid h-11 w-11 place-items-center rounded-xl border border-accent-mid bg-accent-soft text-accent"
            ><component :is="c.icon" class="h-5 w-5"
          /></span>
          <div class="mt-6">
            <p class="font-display text-4xl font-semibold text-ink">
              <AnimatedNumber :value="c.value" />
            </p>
            <p class="mt-1 text-sm font-semibold text-muted">{{ c.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- модули -->
    <div class="card mt-5 p-5 sm:p-7" v-reveal>
      <h2 class="font-display text-xl font-semibold text-ink">По модулям</h2>
      <ul class="mt-5 space-y-4">
        <li
          v-for="(m, i) in manifest.modules"
          :key="m.slug"
          :class="`accent-${m.accent}`"
        >
          <NuxtLink
            :to="`/modules/${m.slug}`"
            class="group flex items-center gap-4"
          >
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent-mid bg-accent-soft text-xl transition-transform duration-500 group-hover:scale-110"
              >{{ m.emoji }}</span
            >
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-3">
                <span
                  class="truncate font-semibold text-ink group-hover:text-accent"
                  >{{ m.title }}</span
                >
                <span class="shrink-0 font-mono text-xs font-bold text-muted"
                  >{{ store.ready ? store.moduleStats(m).done : 0 }}/{{
                    m.lessons.length
                  }}</span
                >
              </div>
              <div
                class="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--line)]"
              >
                <div
                  class="bar h-full rounded-full bg-gradient-to-r from-accent-mid to-accent"
                  :style="{
                    width: `${(store.ready ? store.moduleStats(m).fraction : 0) * 100}%`,
                    transitionDelay: `${i * 90}ms`,
                  }"
                />
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <!-- активность -->
    <div class="card mt-5 p-5 sm:p-7" v-reveal>
      <div class="flex flex-wrap items-end justify-between gap-2">
        <h2 class="font-display text-xl font-semibold text-ink">Активность</h2>
        <span class="text-sm text-muted">последние 20 недель</span>
      </div>
      <div class="mt-5">
        <ClientOnly
          ><ActivityHeatmap /><template #fallback
            ><div
              class="h-[150px] animate-pulse rounded-xl bg-surface-2" /></template
        ></ClientOnly>
      </div>
    </div>

    <!-- достижения -->
    <div class="mt-5" v-reveal>
      <h2 class="mb-4 font-display text-xl font-semibold text-ink">
        Достижения
      </h2>
      <div
        class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        v-auto-animate
      >
        <div
          v-for="a in achievements"
          :key="a.id"
          class="card relative flex flex-col items-center p-5 text-center transition-all duration-500"
          :class="
            store.ready && a.unlocked
              ? 'accent-butter border-accent-mid hover:-translate-y-1 hover:shadow-lift'
              : 'opacity-70'
          "
        >
          <span
            class="grid h-14 w-14 place-items-center rounded-2xl text-3xl transition-all duration-700"
            :class="
              store.ready && a.unlocked
                ? 'bg-accent-soft shadow-soft'
                : 'bg-surface-2 grayscale'
            "
            >{{ a.icon }}</span
          >
          <Lock
            v-if="!(store.ready && a.unlocked)"
            class="absolute right-3 top-3 h-4 w-4 text-muted"
          />
          <p class="mt-3 text-sm font-bold text-ink">{{ a.title }}</p>
          <p class="mt-1 text-xs leading-snug text-muted">{{ a.text }}</p>
          <div
            v-if="!(store.ready && a.unlocked)"
            class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]"
          >
            <div
              class="h-full rounded-full bg-[var(--butter-mid)] transition-[width] duration-1000"
              :style="{ width: `${(store.ready ? a.progress : 0) * 100}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- данные -->
    <div class="card mt-5 p-5 sm:p-7" v-reveal>
      <h2 class="font-display text-xl font-semibold text-ink">Данные</h2>
      <p class="mt-2 max-w-2xl text-sm text-muted">
        Прогресс хранится только в этом браузере. Сохраните файл, чтобы
        перенести его на телефон или другой компьютер.
      </p>
      <div class="mt-5 flex flex-wrap gap-3">
        <button type="button" class="btn-secondary" @click="exportData">
          <Download class="h-4 w-4" /> Сохранить в файл
        </button>
        <button type="button" class="btn-secondary" @click="fileInput?.click()">
          <Upload class="h-4 w-4" /> Загрузить из файла
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="importData"
        />
        <button
          type="button"
          class="btn-secondary transition-colors"
          :class="
            confirmReset &&
            '!border-[var(--rose-mid)] !bg-[var(--rose-soft)] !text-[var(--rose-strong)]'
          "
          @click="resetData"
        >
          <RotateCcw class="h-4 w-4" />
          {{
            confirmReset ? "Нажмите ещё раз для сброса" : "Сбросить прогресс"
          }}
        </button>
        <button
          v-if="$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled"
          type="button"
          class="btn-primary"
          @click="$pwa.install()"
        >
          <Smartphone class="h-4 w-4" /> Установить как приложение
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bar {
  transition: width 1.4s var(--ease-out-expo);
}
</style>
