<script setup lang="ts">
import { useProgressStore } from "~/stores/progress";

const { manifest } = useContent();
const store = useProgressStore();
useSeoMeta({
  title: "Модули курса",
  description: `Все ${manifest.stats.modules} модулей курса оператора станков с ЧПУ: ${manifest.modules.map((m) => m.title).join(", ")}.`,
});
const modulesDone = computed(() =>
  store.ready
    ? manifest.modules.filter((m) => store.moduleStats(m).complete).length
    : 0,
);
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:pt-14">
    <div
      class="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
    >
      <div class="animate-fade-up">
        <p class="eyebrow">Программа</p>
        <h1
          class="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl"
        >
          Модули курса
        </h1>
        <p class="mt-3 max-w-xl text-muted">
          {{ manifest.stats.lessons }} уроков · около
          {{ formatHours(manifest.stats.minutes) }} ·
          {{ manifest.stats.questions }} вопросов для самопроверки
        </p>
      </div>
      <div class="chip animate-fade-up self-start sm:self-auto">
        Завершено модулей:
        <b class="text-ink">{{ modulesDone }}/{{ manifest.stats.modules }}</b>
      </div>
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
</template>
