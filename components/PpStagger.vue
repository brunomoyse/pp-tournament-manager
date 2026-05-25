<script setup lang="ts">
import { computed } from 'vue'
import { Motion } from 'motion-v'

const props = withDefaults(
  defineProps<{
    delayChildren?: number
    staggerChildren?: number
    amount?: number
    once?: boolean
  }>(),
  {
    delayChildren: 0.05,
    staggerChildren: 0.06,
    amount: 0.15,
    once: true,
  },
)

const variants = computed(() => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: props.delayChildren,
      staggerChildren: props.staggerChildren,
    },
  },
}))
</script>

<template>
  <Motion
    :variants="variants"
    initial="hidden"
    while-in-view="visible"
    :in-view-options="{ once: props.once, amount: props.amount, margin: '0px 0px -5% 0px' }"
  >
    <slot />
  </Motion>
</template>
