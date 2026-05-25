<script setup lang="ts">
import { ref } from 'vue'
import { Motion } from 'motion-v'
import { spring } from '~/composables/useMotionTokens'

const props = withDefaults(
  defineProps<{
    strength?: number
  }>(),
  {
    strength: 14,
  },
)

const x = ref(0)
const y = ref(0)
const root = ref<HTMLElement | null>(null)

function onMove(e: PointerEvent) {
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
  const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
  x.value = dx * props.strength
  y.value = dy * props.strength
}

function reset() {
  x.value = 0
  y.value = 0
}
</script>

<template>
  <Motion
    ref="root"
    tag="button"
    :animate="{ x, y }"
    :transition="spring.default"
    :while-tap="{ scale: 0.97 }"
    @pointermove="onMove"
    @pointerleave="reset"
  >
    <slot />
  </Motion>
</template>
