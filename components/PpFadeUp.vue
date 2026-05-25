<script setup lang="ts">
import { Motion } from 'motion-v'
import { easing, duration as durationTokens } from '~/composables/useMotionTokens'

const props = withDefaults(
  defineProps<{
    delay?: number
    duration?: number
    y?: number
    once?: boolean
    amount?: number
  }>(),
  {
    delay: 0,
    duration: durationTokens.standard,
    y: 24,
    once: true,
    amount: 0.2,
  },
)
</script>

<template>
  <Motion
    :initial="{ opacity: 0, y: props.y }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :in-view-options="{ once: props.once, amount: props.amount, margin: '0px 0px -10% 0px' }"
    :transition="{ duration: props.duration, ease: easing as unknown as number[], delay: props.delay }"
  >
    <slot />
  </Motion>
</template>
