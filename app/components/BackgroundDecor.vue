<template>
  <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
    <div class="blueprint blueprint-fade absolute inset-0" />
    <div class="blob left-[-10vw] top-[-12vh] h-[55vh] w-[55vh] bg-[var(--lavender-soft)]" style="animation-duration: 26s" />
    <div class="blob right-[-12vw] top-[8vh] h-[50vh] w-[50vh] bg-[var(--sky-soft)]" style="animation-duration: 32s; animation-delay: -8s" />
    <div class="blob bottom-[-18vh] left-[20vw] h-[48vh] w-[48vh] bg-[var(--mint-soft)]" style="animation-duration: 36s; animation-delay: -14s" />
    <div class="blob bottom-[5vh] right-[10vw] h-[34vh] w-[34vh] bg-[var(--peach-soft)] opacity-70" style="animation-duration: 30s; animation-delay: -4s" />
  </div>
</template>

<style scoped>
.blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(70px);
  opacity: 0.85;
  animation: blob 28s ease-in-out infinite;
  transition: background-color 0.6s ease;
}
:global(.dark) .blob { opacity: 0.55; }
</style>
