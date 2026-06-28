<script setup lang="ts">
/**
 * PpEyebrow: the uppercase mono kicker that sits above every page title and
 * card-section heading. Deep-gold JetBrains Mono, wide tracking, ~11px.
 * Factored out so page headers (PpSectionHeader) and in-card section labels
 * share one rhythm. Text comes from the `label` prop or the default slot.
 */
withDefaults(
  defineProps<{
    label?: string
    /** Slightly tighter, smaller variant for dense card sections. */
    size?: 'sm' | 'md'
  }>(),
  {
    size: 'md',
  },
)
</script>

<template>
  <p class="pp-eyebrow" :class="`pp-eyebrow--${size}`">
    <slot>{{ label }}</slot>
  </p>
</template>

<style scoped>
.pp-eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  text-transform: uppercase;
  color: var(--color-pp-gold-deep);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.pp-eyebrow--md {
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
}

.pp-eyebrow--sm {
  font-size: 0.625rem;
  letter-spacing: 0.18em;
}
</style>
