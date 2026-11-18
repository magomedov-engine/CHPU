<script setup lang="ts">
import { TransitionPresets } from '@vueuse/core'

const props = withDefaults(defineProps<{ value: number; duration?: number; delay?: number; decimals?: number }>(), {
  duration: 1400,
  delay: 0,
  decimals: 0,
})
const start = ref(0)
onMounted(() => (start.value = props.value))
watch(() => props.value, v => (start.value = v))
const v = useTransition(start, { duration: props.duration, delay: props.delay, transition: TransitionPresets.easeOutExpo })
const text = computed(() => v.value.toFixed(props.decimals).replace('.', ','))
</script>

<template>
  <span class="tabular-nums">{{ text }}</span>
</template>
