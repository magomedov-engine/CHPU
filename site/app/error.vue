<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const is404 = computed(() => props.error?.statusCode === 404);
useSeoMeta({
  title: is404.value ? "Страница не найдена" : "Ошибка",
  robots: "noindex",
});
</script>

<template>
  <NuxtLayout>
    <section
      class="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center"
    >
      <div class="accent-peach relative mb-8">
        <span
          class="font-display text-[8rem] font-bold leading-none text-outline sm:text-[11rem]"
          >{{ error?.statusCode || 500 }}</span
        >
        <span
          class="absolute -right-2 top-4 rotate-12 rounded-xl border border-accent-mid bg-accent-soft px-3 py-1 font-mono text-sm font-bold text-accent shadow-soft"
          >ALARM</span
        >
      </div>
      <h1 class="font-display text-2xl font-semibold text-ink sm:text-3xl">
        {{ is404 ? "G00 в никуда: такой страницы нет" : "Что-то пошло не так" }}
      </h1>
      <p class="mt-4 text-muted">
        {{
          is404
            ? "Похоже, привязка сбилась. Нажмите RESET и вернитесь в ноль — на главную."
            : error?.message
        }}
      </p>
      <button
        type="button"
        class="btn-primary mt-8"
        @click="clearError({ redirect: '/' })"
      >
        RESET → на главную
      </button>
    </section>
  </NuxtLayout>
</template>
