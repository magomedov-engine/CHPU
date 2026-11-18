<script setup lang="ts">
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  CircleHelp,
  ListChecks,
  Flame,
  Trophy,
  LayoutGrid,
} from "lucide-vue-next";
import { useProgressStore } from "~/stores/progress";

const { manifest, getLesson, flat } = useContent();
const store = useProgressStore();

useSeoMeta({
  title: "",
  description: manifest.modules.length
    ? `Интерактивный курс оператора станков с ЧПУ: ${manifest.stats.modules} модулей, ${manifest.stats.lessons} уроков, ${manifest.stats.questions} вопросов для самопроверки. Учитесь офлайн и отмечайте прогресс.`
    : "",
});

const lastLesson = computed(() =>
  store.ready && store.last ? getLesson(store.last.id) : undefined,
);
const nextLesson = computed(() =>
  store.ready ? flat.find((l) => !store.isDone(l.id)) : flat[0],
);
const cta = computed(() => {
  if (lastLesson.value && !store.isDone(lastLesson.value.id))
    return {
      to: `/modules/${lastLesson.value.id}`,
      label: "Продолжить",
      sub: lastLesson.value.shortTitle,
    };
  if (nextLesson.value)
    return {
      to: `/modules/${nextLesson.value.id}`,
      label: store.completedCount ? "Следующий урок" : "Начать обучение",
      sub: nextLesson.value.shortTitle,
    };
  return { to: "/progress", label: "Курс пройден", sub: "Посмотреть прогресс" };
});
const overall = computed(() =>
  store.ready ? store.completedCount / manifest.stats.lessons : 0,
);

const stats = [
  { label: "модулей", value: manifest.stats.modules },
  { label: "уроков", value: manifest.stats.lessons },
  { label: "схем", value: manifest.stats.diagrams },
  { label: "вопросов", value: manifest.stats.questions },
];

const steps = [
  {
    icon: BookOpen,
    title: "Читайте",
    text: "Короткие уроки с примерами на цифрах, схемами и готовыми фразами для собеседования.",
    accent: "sky",
  },
  {
    icon: CircleHelp,
    title: "Проверяйте себя",
    text: "Вопросы с раскрывающимися ответами в каждом уроке и большие тренажёры в конце модулей.",
    accent: "lavender",
  },
  {
    icon: ListChecks,
    title: "Отмечайте прогресс",
    text: "Ставьте галочки у разделов и уроков — сайт помнит, где вы остановились, даже офлайн.",
    accent: "mint",
  },
];

const terms = [
  "G54",
  "G43 H05",
  "Ø25k6",
  "CNMG 120408",
  "Ra 1,6",
  "M30",
  "H7/g6",
  "G71 U2. R0.5",
  "ШВП",
  "Нониус 0,05",
  "Feed Hold",
  "PCLNR 2525M12",
  "G83 Q5.",
  "Биение 0,02",
  "Т15К6",
  "M29 S500",
  "Концевые меры",
  "Попутное фрезерование",
];
</script>

<template>
  <div>
    <!-- HERO -->
    <section
      class="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 lg:pb-24 lg:pt-16 xl:grid-cols-[1.05fr_1fr] xl:gap-14"
    >
      <div>
        <div
          class="chip accent-lavender animate-fade-up border-accent-mid bg-accent-soft text-ink"
        >
          <Sparkles class="h-3.5 w-3.5 text-accent" /> Курс подготовки оператора
          станков с ЧПУ
        </div>
        <h1
          class="mt-6 font-display text-[clamp(1.75rem,8.4vw,2.4rem)] font-semibold leading-[1.08] text-ink sm:text-6xl xl:text-[4rem]"
        >
          <span class="animate-fade-up block" style="animation-delay: 80ms"
            >Станок с ЧПУ —</span
          >
          <span
            class="animate-fade-up accent-lavender shimmer-text block"
            style="animation-delay: 180ms"
            >от нуля до собеседования</span
          >
        </h1>
        <p
          class="animate-fade-up mt-6 max-w-xl text-[17px] leading-relaxed text-muted sm:text-lg"
          style="animation-delay: 280ms"
        >
          Устройство станков, чертежи, измерения, G-код, режущий инструмент и
          охрана труда — понятным языком, с примерами и вопросами для
          самопроверки.
        </p>
        <div
          class="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
          style="animation-delay: 380ms"
        >
          <NuxtLink :to="cta.to" class="btn-primary group">
            {{ cta.label }}
            <ArrowRight
              class="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1"
            />
          </NuxtLink>
          <NuxtLink to="/modules" class="btn-secondary"
            ><LayoutGrid class="h-4 w-4" /> Все модули</NuxtLink
          >
        </div>
        <p
          class="animate-fade-up mt-3 truncate text-sm text-muted"
          style="animation-delay: 420ms"
        >
          → {{ cta.sub }}
        </p>

        <dl class="mt-10 grid max-w-lg grid-cols-4 gap-3">
          <div
            v-for="(s, i) in stats"
            :key="s.label"
            class="animate-fade-up"
            :style="{ animationDelay: `${480 + i * 80}ms` }"
          >
            <dt class="sr-only">{{ s.label }}</dt>
            <dd
              class="font-display text-2xl font-semibold text-ink sm:text-3xl"
            >
              <AnimatedNumber :value="s.value" :delay="500 + i * 100" />
            </dd>
            <p class="text-xs font-semibold text-muted sm:text-sm">
              {{ s.label }}
            </p>
          </div>
        </dl>
      </div>
      <div
        class="animate-fade-up mx-auto w-full max-w-xl xl:max-w-none"
        style="animation-delay: 200ms"
      >
        <HeroMachine />
      </div>
    </section>

    <!-- ПРОГРЕСС -->
    <section class="mx-auto max-w-7xl px-4 sm:px-6">
      <NuxtLink
        to="/progress"
        class="card accent-mint group flex flex-col items-start gap-5 p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift sm:flex-row sm:items-center sm:p-6"
        v-reveal
      >
        <ProgressRing :value="overall" :size="76" :stroke="7">
          <template #default="{ value }">
            <span class="font-display text-lg font-semibold text-ink"
              >{{ Math.round(value * 100) }}<span class="text-xs">%</span></span
            >
          </template>
        </ProgressRing>
        <div class="flex-1">
          <p class="eyebrow">Ваш прогресс</p>
          <p
            class="mt-1 font-display text-lg font-semibold text-ink sm:text-xl"
          >
            Пройдено {{ store.ready ? store.completedCount : 0 }} из
            {{ manifest.stats.lessons }} уроков
          </p>
          <p class="mt-1 text-sm text-muted">
            Прогресс сохраняется в браузере и работает без интернета.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="chip"
            ><Flame class="h-4 w-4 text-[var(--peach-strong)]" />
            {{ store.ready ? store.streak : 0 }}
            {{
              pluralize(store.ready ? store.streak : 0, "день", "дня", "дней")
            }}
            подряд</span
          >
          <span
            class="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface transition-all duration-500 group-hover:bg-accent group-hover:text-surface"
            ><Trophy class="h-4 w-4"
          /></span>
        </div>
      </NuxtLink>
    </section>

    <!-- МОДУЛИ -->
    <section id="modules" class="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:pt-28">
      <div
        class="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        v-reveal
      >
        <div>
          <p class="eyebrow">Программа курса</p>
          <h2
            class="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl"
          >
            Шесть модулей — один путь
          </h2>
        </div>
        <p class="max-w-md text-muted">
          Проходите по порядку: каждый модуль опирается на предыдущий, а детали
          из примеров сквозные — от чертежа до программы.
        </p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ModuleCard
          v-for="(m, i) in manifest.modules"
          :key="m.slug"
          :module="m"
          :delay="i * 70"
        />
      </div>
    </section>

    <!-- КАК УЧИТЬСЯ -->
    <section class="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:pt-28">
      <div class="grid gap-5 md:grid-cols-3">
        <div
          v-for="(s, i) in steps"
          :key="s.title"
          :class="`accent-${s.accent}`"
          class="card relative overflow-hidden p-6"
          v-reveal="i * 90"
        >
          <span
            class="absolute right-5 top-4 font-display text-5xl font-bold text-outline"
            >0{{ i + 1 }}</span
          >
          <span
            class="grid h-12 w-12 place-items-center rounded-2xl border border-accent-mid bg-accent-soft text-accent"
            ><component :is="s.icon" class="h-6 w-6"
          /></span>
          <h3 class="mt-5 font-display text-lg font-semibold text-ink">
            {{ s.title }}
          </h3>
          <p class="mt-2 text-[15px] leading-relaxed text-muted">
            {{ s.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- БЕГУЩАЯ СТРОКА -->
    <section
      class="relative mt-20 overflow-hidden py-4 lg:mt-28"
      aria-hidden="true"
    >
      <div class="marquee flex w-max gap-3">
        <span
          v-for="(t, i) in [...terms, ...terms]"
          :key="i"
          :class="`accent-${['sky', 'lavender', 'mint', 'peach', 'butter', 'rose'][i % 6]}`"
          class="rounded-full border border-accent-mid bg-accent-soft px-5 py-2.5 font-mono text-sm font-semibold text-ink"
          >{{ t }}</span
        >
      </div>
      <div class="marquee reverse mt-3 flex w-max gap-3">
        <span
          v-for="(t, i) in [
            ...terms.slice().reverse(),
            ...terms.slice().reverse(),
          ]"
          :key="i"
          class="rounded-full border border-line bg-surface px-5 py-2.5 font-mono text-sm font-semibold text-muted"
          >{{ t }}</span
        >
      </div>
      <div
        class="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg to-transparent"
      />
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg to-transparent"
      />
    </section>

    <!-- CTA -->
    <section class="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:pt-24">
      <div
        class="card accent-lavender relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16"
        v-reveal
      >
        <div class="blueprint absolute inset-0 opacity-70" />
        <div
          class="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[var(--lavender-soft)] blur-3xl"
        />
        <div
          class="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[var(--mint-soft)] blur-3xl"
        />
        <div class="relative">
          <h2
            class="mx-auto max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl"
          >
            Деталь не лучше, чем знания того, кто стоит у станка
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-muted">
            Около {{ formatHours(manifest.stats.minutes) }} чтения — и вы будете
            говорить с мастером на одном языке.
          </p>
          <NuxtLink :to="cta.to" class="btn-primary group mt-8">
            {{ cta.label }}
            <ArrowRight
              class="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1"
            />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.marquee {
  animation: marquee 48s linear infinite;
}
.marquee.reverse {
  animation-direction: reverse;
  animation-duration: 56s;
}
.marquee:hover {
  animation-play-state: paused;
}
</style>
