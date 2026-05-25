<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    initialSeconds?: number
    loop?: boolean
  }>(),
  {
    initialSeconds: 1062, // 17:42
    loop: true,
  },
)

const seconds = ref(props.initialSeconds)
let intervalId: ReturnType<typeof setInterval> | null = null

function formatMMSS(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
  intervalId = setInterval(() => {
    if (seconds.value <= 1) {
      seconds.value = props.loop ? props.initialSeconds : 0
    } else {
      seconds.value -= 1
    }
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <span class="font-mono tabular-nums">{{ formatMMSS(seconds) }}</span>
</template>
