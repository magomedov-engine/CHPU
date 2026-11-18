<script setup lang="ts">
const props = withDefaults(defineProps<{ checked: boolean; size?: 'sm' | 'md' | 'lg'; label?: string }>(), { size: 'md' })
const emit = defineEmits<{ toggle: [event: MouseEvent] }>()
const popping = ref(false)
watch(
  () => props.checked,
  v => {
    if (!v) return
    popping.value = false
    requestAnimationFrame(() => (popping.value = true))
  },
)
const dims = computed(() => ({ sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-11 w-11' })[props.size])
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :aria-label="label || (checked ? 'Снять отметку' : 'Отметить')"
    class="check group relative grid shrink-0 place-items-center rounded-full border-2 transition-all duration-300"
    :class="[dims, checked ? 'border-accent bg-accent text-surface' : 'border-line-2 bg-surface text-transparent hover:border-accent-mid', popping && 'is-pop']"
    @click.stop.prevent="emit('toggle', $event)"
    @animationend="popping = false"
  >
    <span v-if="checked" class="pointer-events-none absolute inset-0 rounded-full bg-accent-mid ripple" />
    <svg viewBox="0 0 24 24" class="relative h-[62%] w-[62%]" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" class="check-path" :class="{ drawn: checked }" />
    </svg>
  </button>
</template>

<style scoped>
.check-path { stroke-dasharray: 24; stroke-dashoffset: 24; transition: stroke-dashoffset 0.45s var(--ease-out-expo) 0.05s; }
.check-path.drawn { stroke-dashoffset: 0; }
.is-pop { animation: pop 0.45s var(--ease-spring); }
.ripple { animation: pulse-ring 0.7s var(--ease-out-expo) forwards; }
.check:active { transform: scale(0.9); }
</style>
