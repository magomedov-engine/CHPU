<script setup lang="ts">
useHead({
  titleTemplate: (t) =>
    t ? `${t} · RE:ACTABLE` : "RE:ACTABLE — подготовка оператора станков с ЧПУ",
  bodyAttrs: { class: "min-h-dvh" },
});
</script>

<template>
  <NuxtPwaManifest />
  <NuxtLoadingIndicator
    color="linear-gradient(90deg,#bfb0f2,#a9c6f5,#9fd9bd)"
    :height="3"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
