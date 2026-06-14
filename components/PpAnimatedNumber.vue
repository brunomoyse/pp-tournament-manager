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
let inView = false
let reducedMotion = false

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function runCountUp() {
  if (rafId !== null) cancelAnimationFrame(rafId)
  const start = performance.now()
  const durationMs = props.duration * 1000

  const tick = (now: number) => {
    const t = Math.min((now - start) / durationMs, 1)
    // Read the target live every frame. The stat cards are above the fold, so
    // the observer fires while async data is still loading (value === 0); a
    // frozen target would keep writing 0 and clobber the value once it lands.
    display.value = formatter.format(Math.round(easeOut(t) * props.value))
    rafId = t < 1 ? requestAnimationFrame(tick) : null
  }
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  if (typeof window === 'undefined' || !el.value) return

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) {
    inView = true
    display.value = formatter.format(props.value)
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        inView = true
        runCountUp()
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

// Reflect values that arrive (or change) after the first paint: re-run the
// count-up if already visible, snap if reduced motion. If not yet in view, the
// observer starts the animation later and reads the live value.
watch(
  () => props.value,
  () => {
    if (!inView) return
    if (reducedMotion) {
      display.value = formatter.format(props.value)
    } else {
      runCountUp()
    }
  },
)
</script>

<template>
  <span ref="el" class="font-mono tabular-nums">{{ prefix }}{{ display }}{{ suffix }}</span>
</template>
