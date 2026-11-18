<script setup lang="ts">
import {
  ArrowRight,
  Clock,
  BookOpen,
  CircleHelp,
  ChevronDown,
  CheckCheck,
  RotateCcw,
} from "lucide-vue-next";
import { useProgressStore } from "~/stores/progress";

const route = useRoute();
const { getModule, loadModuleIntro } = useContent();
const store = useProgressStore();
const { burst } = useConfetti();
const { push } = useToasts();

const mod = getModule(String(route.params.module));
if (!mod)
  throw createError({
    statusCode: 404,
    statusMessage: "Модуль не найден",
    fatal: true,
  });
const m = mod;

const intro = shallowRef(await loadModuleIntro(m.slug));

useSeoMeta({
  title: m.title,
  description: m.description,
  ogTitle: m.title,
  ogDescription: m.description,
});

const stats = computed(() => store.moduleStats(m));
const fraction = computed(() => (store.ready ? stats.value.fraction : 0));
const nextLesson = computed(
  () =>
    m.lessons.find((l) => !(store.ready && store.isDone(l.id))) || m.lessons[0],
);
const questions = m.lessons.reduce((s, l) => s + l.questions, 0);
const showIntro = ref(false);

function toggleLesson(id: string, sections: string[], e: MouseEvent) {
  const wasComplete = stats.value.complete;
  const done = store.toggleLesson(
    id,
    sections.map((s) => s),
  );
  if (done) burst(e.currentTarget as HTMLElement);
  if (!wasComplete && store.moduleStats(m).complete) {
    burst(null, true);
    push({
      title: `Модуль «${m.title}» пройден!`,
      text: "Отличная работа — так держать 🎉",
    });
  }
}
function markAll() {
  const complete = stats.value.complete;
  for (const l of m.lessons)
    store.setLesson(
      l.id,
      !complete,
      l.sections.map((s) => s.id),
    );
  if (!complete) {
    burst(null, true);
    push({ title: "Весь модуль отмечен пройденным" });
  } else push({ title: "Отметки модуля сброшены", tone: "info" });
}
const lineFill = computed(() => {
  if (!store.ready) return 0;
  let last = -1;
  m.lessons.forEach((l, i) => store.isDone(l.id) && (last = i));
  return m.lessons.length > 1 ? Math.max(0, last) / (m.lessons.length - 1) : 0;
});
</script>

<template>
  <div :class="`accent-${m.accent}`">
    <!-- шапка -->
    <section class="relative overflow-hidden">
      <div
        class="absolute inset-0 bg-gradient-to-b from-accent-soft to-transparent"
      />
      <div class="blueprint blueprint-fade absolute inset-0" />
      <div
        class="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:pb-16 lg:pt-12"
      >
        <nav
          class="animate-fade-up mb-8 flex items-center gap-2 text-sm text-muted"
          aria-label="Хлебные крошки"
        >
          <NuxtLink to="/modules" class="hover:text-ink">Модули</NuxtLink>
          <span>/</span>
          <span class="font-semibold text-ink">{{ m.shortTitle }}</span>
        </nav>
        <div class="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <div class="flex items-center gap-4">
              <span
                class="grid h-16 w-16 place-items-center rounded-2xl border border-accent-mid bg-surface text-[34px] shadow-soft"
                :style="{ viewTransitionName: `vt-memoji-${m.number}` }"
                >{{ m.emoji }}</span
              >
              <span class="eyebrow"
                >Модуль {{ String(m.number).padStart(2, "0") }} из 06</span
              >
            </div>
            <h1
              class="mt-6 font-display text-[2.1rem] font-semibold leading-tight text-ink sm:text-5xl"
              :style="{ viewTransitionName: `vt-mtitle-${m.number}` }"
            >
              {{ m.title }}
            </h1>
            <p
              class="animate-fade-up mt-5 max-w-2xl text-[17px] leading-relaxed text-muted"
              style="animation-delay: 120ms"
            >
              {{ m.description }}
            </p>
            <div
              class="animate-fade-up mt-6 flex flex-wrap gap-2"
              style="animation-delay: 200ms"
            >
              <span class="chip"
                ><BookOpen class="h-4 w-4 text-accent" /> {{ m.lessons.length }}
                {{
                  pluralize(m.lessons.length, "урок", "урока", "уроков")
                }}</span
              >
              <span class="chip"
                ><Clock class="h-4 w-4 text-accent" />
                {{ formatHours(m.minutes) }}</span
              >
              <span class="chip"
                ><CircleHelp class="h-4 w-4 text-accent" />
                {{ questions }} вопросов</span
              >
            </div>
            <div
              class="animate-fade-up mt-8 flex flex-wrap gap-3"
              style="animation-delay: 280ms"
            >
              <NuxtLink
                :to="`/modules/${nextLesson!.id}`"
                class="btn-primary group"
              >
                {{ stats.done ? "Продолжить модуль" : "Начать модуль" }}
                <ArrowRight
                  class="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1"
                />
              </NuxtLink>
              <button type="button" class="btn-secondary" @click="markAll">
                <component
                  :is="stats.complete && store.ready ? RotateCcw : CheckCheck"
                  class="h-4 w-4"
                />
                {{
                  stats.complete && store.ready
                    ? "Сбросить отметки"
                    : "Отметить весь модуль"
                }}
              </button>
            </div>
          </div>
          <div
            class="animate-fade-up card hidden flex-col items-center gap-3 p-6 lg:flex"
            style="animation-delay: 160ms"
          >
            <ProgressRing :value="fraction" :size="150" :stroke="12">
              <template #default="{ value }">
                <div class="text-center">
                  <span class="font-display text-4xl font-semibold text-ink"
                    >{{ Math.round(value * 100)
                    }}<span class="text-lg">%</span></span
                  >
                </div>
              </template>
            </ProgressRing>
            <p class="text-sm font-semibold text-muted">
              {{ store.ready ? stats.done : 0 }} из {{ stats.total }} уроков
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- уроки -->
    <section class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="card mb-6 flex items-center gap-4 p-4 lg:hidden">
        <ProgressRing :value="fraction" :size="56" :stroke="6" />
        <p class="text-sm font-semibold text-ink-2">
          Пройдено {{ store.ready ? stats.done : 0 }} из
          {{ stats.total }} уроков
        </p>
      </div>
      <ol class="relative">
        <span
          class="absolute bottom-8 left-[27px] top-8 w-0.5 bg-[var(--line)] sm:left-[31px]"
        />
        <span
          class="line-fill absolute left-[27px] top-8 w-0.5 bg-gradient-to-b from-accent-mid to-accent sm:left-[31px]"
          :style="{ height: `calc((100% - 4rem) * ${lineFill})` }"
        />
        <li
          v-for="(l, i) in m.lessons"
          :key="l.id"
          class="relative"
          v-reveal="Math.min(i, 8) * 45"
        >
          <NuxtLink
            :to="`/modules/${l.id}`"
            class="group relative flex items-center gap-4 rounded-2xl p-3 transition-all duration-500 hover:bg-surface hover:shadow-soft sm:gap-5 sm:p-4"
          >
            <span
              class="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 font-mono text-[11px] font-bold transition-all duration-500 sm:h-8 sm:w-8"
              :class="
                store.ready && store.isDone(l.id)
                  ? 'border-accent bg-accent text-surface'
                  : 'border-line-2 bg-bg text-muted group-hover:border-accent-mid'
              "
            >
              {{ String(l.number).padStart(2, "0") }}
            </span>
            <span
              class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
              >{{ l.emoji }}</span
            >
            <span class="min-w-0 flex-1">
              <span
                class="block font-semibold leading-snug text-ink sm:text-[17px]"
                :style="{
                  viewTransitionName: `vt-ltitle-${m.number}-${l.number}`,
                }"
                >{{ l.shortTitle }}</span
              >
              <span class="mt-1 hidden text-sm text-muted sm:line-clamp-1">{{
                l.description
              }}</span>
              <span
                class="mt-1 flex items-center gap-3 text-xs font-semibold text-muted"
              >
                <span class="flex items-center gap-1"
                  ><Clock class="h-3.5 w-3.5" /> {{ l.minutes }} мин</span
                >
                <span v-if="l.questions" class="flex items-center gap-1"
                  ><CircleHelp class="h-3.5 w-3.5" /> {{ l.questions }}</span
                >
                <span
                  v-if="
                    store.ready &&
                    !store.isDone(l.id) &&
                    store.sectionsOf(l.id).length
                  "
                  class="text-accent"
                >
                  {{ store.sectionsOf(l.id).length }}/{{
                    l.sections.length
                  }}
                  разделов
                </span>
              </span>
            </span>
            <CheckToggle
              :checked="store.ready && store.isDone(l.id)"
              :label="`Урок «${l.shortTitle}» пройден`"
              @toggle="
                toggleLesson(
                  l.id,
                  l.sections.map((s) => s.id),
                  $event,
                )
              "
            />
          </NuxtLink>
        </li>
      </ol>

      <!-- обзор модуля -->
      <div v-if="intro?.html" class="card mt-10 overflow-hidden">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
          @click="showIntro = !showIntro"
        >
          <span>
            <span class="eyebrow">Оглавление из конспекта</span>
            <span class="mt-1 block font-display text-lg font-semibold text-ink"
              >Обзор модуля и условные обозначения</span
            >
          </span>
          <ChevronDown
            class="h-5 w-5 shrink-0 text-muted transition-transform duration-500"
            :class="showIntro && 'rotate-180'"
          />
        </button>
        <Transition name="expand">
          <div
            v-if="showIntro"
            class="border-t border-line px-5 pb-8 pt-2 sm:px-8"
          >
            <LessonContent :html="intro.html" />
          </div>
        </Transition>
      </div>
    </section>
  </div>
</template>

<style scoped>
.line-fill {
  transition: height 1.2s var(--ease-out-expo);
}
.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.5s var(--ease-spring);
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
