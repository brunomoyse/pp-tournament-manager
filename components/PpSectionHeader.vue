<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    accent?: string
    subtitle?: string
    /** Render h2 (default) or h1 (use for primary page heading). */
    as?: 'h1' | 'h2'
  }>(),
  {
    as: 'h2',
  },
)
</script>

<template>
  <header class="pp-section-header">
    <PpFadeUp v-if="eyebrow">
      <p class="eyebrow">{{ eyebrow }}</p>
    </PpFadeUp>

    <PpFadeUp :delay="0.06">
      <component :is="as" class="title">
        <span>{{ title }}</span>
        <span v-if="accent" class="pp-gold-text">&nbsp;{{ accent }}</span>
      </component>
    </PpFadeUp>

    <PpFadeUp v-if="subtitle" :delay="0.12">
      <p class="subtitle">{{ subtitle }}</p>
    </PpFadeUp>
  </header>
</template>

<style scoped>
.pp-section-header {
  margin-bottom: 2rem;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
  font-variant-numeric: tabular-nums;
}

.title {
  margin-top: 1rem;
  font-family: var(--font-display);
  font-size: clamp(1.875rem, 3vw + 1rem, 3rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
  line-height: 1.05;
}

.subtitle {
  margin-top: 1.25rem;
  font-size: 1.125rem;
  color: var(--color-pp-text-muted);
  max-width: 42rem;
  line-height: 1.55;
}
</style>
