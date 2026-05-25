<script setup lang="ts">
import { Motion } from 'motion-v'
import { easing } from '~/composables/useMotionTokens'

const variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easing as unknown as number[] },
  },
}
</script>

<template>
  <Motion :variants="variants">
    <slot />
  </Motion>
</template>
