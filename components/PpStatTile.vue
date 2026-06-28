<script setup lang="ts">
/**
 * PpStatTile: one cell of the dashboard / reports stat strip. A mono kicker, a
 * big Space Grotesk figure (gold by default), an optional inline sparkline, and
 * an optional coloured trend line at the foot. Built on PpCard so it shares the
 * surface, radius, and hover with every other panel.
 *
 * Pass the figure via `value` (string or number, already formatted) or the
 * default slot for richer content. Sparkline data is `sparkline` (number[]).
 */
type Tone = 'gold' | 'success' | 'danger' | 'info' | 'warning' | 'neutral'

withDefaults(
  defineProps<{
    kicker: string
    value?: string | number
    /** Small caption under the figure (e.g. "vs last week"). */
    trend?: string
    /** Colour for the trend caption + sparkline. */
    tone?: Tone
    sparkline?: number[]
  }>(),
  {
    tone: 'gold',
  },
)
</script>

<template>
  <PpCard padding="none" class="pp-stat-tile">
    <div class="pp-stat-tile__body">
      <PpEyebrow size="sm">{{ kicker }}</PpEyebrow>

      <div class="pp-stat-tile__figure" :class="`pp-stat-tile__figure--${tone}`">
        <slot>{{ value }}</slot>
      </div>

      <div v-if="trend" class="pp-stat-tile__trend" :class="`pp-stat-tile__trend--${tone}`">
        {{ trend }}
      </div>
    </div>

    <div v-if="sparkline && sparkline.length" class="pp-stat-tile__spark">
      <PpSparkline :points="sparkline" :tone="tone" area />
    </div>
  </PpCard>
</template>

<style scoped>
.pp-stat-tile {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.125rem 1.25rem;
  min-height: 7rem;
}

.pp-stat-tile__body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pp-stat-tile__figure {
  font-family: var(--font-display);
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text);
}
.pp-stat-tile__figure--gold {
  color: var(--color-pp-gold);
}

.pp-stat-tile__trend {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text-muted);
}
.pp-stat-tile__trend--success {
  color: #34d399;
}
.pp-stat-tile__trend--danger {
  color: #f87171;
}
.pp-stat-tile__trend--info {
  color: var(--color-pp-info);
}
.pp-stat-tile__trend--warning {
  color: var(--color-pp-warning);
}

.pp-stat-tile__spark {
  height: 2rem;
  margin-top: 0.25rem;
}
</style>
