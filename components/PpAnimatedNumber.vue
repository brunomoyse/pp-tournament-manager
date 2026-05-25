<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { duration as durationTokens } from '~/composables/useMotionTokens'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    locale?: string
    prefix?: string
    suffix?: string
  }>(),
  {
    duration: durationTokens.slow + 0.2,
    locale: 'nl-BE',
    prefix: '',
    suffix: '',
  },
)

const formatter = new Intl.NumberFormat(props.locale, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const display = ref('0')
const el = ref<HTMLSpanElement | null>(null)
let rafId: number | null = null
let hasAnimated = false

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function startCountUp() {
  if (hasAnimated) return
  hasAnimated = true
  const start = performance.now()
  const target = props.value
  const durationMs = props.duration * 1000

  const tick = (now: number) => {
    const elapsed = now - start
    const t = Math.min(elapsed / durationMs, 1)
    const current = Math.round(easeOut(t) * target)
    display.value = formatter.format(current)
    if (t < 1) rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (typeof window === 'undefined' || !el.value) return

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    display.value = formatter.format(props.value)
    hasAnimated = true
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        startCountUp()
        observer.disconnect()
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(el.value)
})

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})

watch(
  () => props.value,
  (next) => {
    if (hasAnimated) display.value = formatter.format(next)
  },
)
</script>

<template>
  <span ref="el" class="font-mono tabular-nums">{{ prefix }}{{ display }}{{ suffix }}</span>
</template>
