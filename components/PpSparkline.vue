<script setup lang="ts">
import { computed } from 'vue'

/**
 * PpSparkline: a tiny inline SVG trend line built from a number array. Pure
 * presentation, no axes. Used inside PpStatTile and anywhere a figure wants a
 * one-glance trend. Colour follows the tone (gold by default). The line is
 * drawn in a 100x32 viewBox and stretched to fit via preserveAspectRatio.
 */
type Tone = 'gold' | 'success' | 'danger' | 'info' | 'warning' | 'neutral'

const props = withDefaults(
  defineProps<{
    points: number[]
    tone?: Tone
    /** Render a faint area fill under the line. */
    area?: boolean
  }>(),
  {
    tone: 'gold',
    area: false,
  },
)

const W = 100
const H = 32
const PAD = 3

const coords = computed(() => {
  const pts = props.points
  if (!pts || pts.length === 0) return []
  if (pts.length === 1)
    return [
      { x: 0, y: H / 2 },
      { x: W, y: H / 2 },
    ]
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const stepX = W / (pts.length - 1)
  return pts.map((p, i) => ({
    x: i * stepX,
    y: PAD + (H - PAD * 2) * (1 - (p - min) / span),
  }))
})

const linePath = computed(() => coords.value.map((c) => `${c.x},${c.y}`).join(' '))

const areaPath = computed(() => {
  if (!props.area || coords.value.length === 0) return ''
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  const mid = coords.value.map((c) => `L ${c.x} ${c.y}`).join(' ')
  return `M ${first.x} ${H} L ${first.x} ${first.y} ${mid} L ${last.x} ${H} Z`
})
</script>

<template>
  <svg
    class="pp-sparkline"
    :class="`pp-sparkline--${tone}`"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path v-if="area" class="pp-sparkline__area" :d="areaPath" />
    <polyline class="pp-sparkline__line" :points="linePath" />
  </svg>
</template>

<style scoped>
.pp-sparkline {
  --spark: var(--color-pp-gold);
  --spark-rgb: var(--pp-accent-rgb);
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.pp-sparkline__line {
  fill: none;
  stroke: var(--spark);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.pp-sparkline__area {
  fill: rgba(var(--spark-rgb), 0.12);
  stroke: none;
}

.pp-sparkline--gold {
  --spark: var(--color-pp-gold);
  --spark-rgb: var(--pp-accent-rgb);
}
.pp-sparkline--success {
  --spark: #34d399;
  --spark-rgb: var(--pp-success-rgb);
}
.pp-sparkline--danger {
  --spark: #f87171;
  --spark-rgb: var(--pp-danger-rgb);
}
.pp-sparkline--info {
  --spark: var(--color-pp-info);
  --spark-rgb: var(--pp-info-rgb);
}
.pp-sparkline--warning {
  --spark: var(--color-pp-warning);
  --spark-rgb: var(--pp-warning-rgb);
}
.pp-sparkline--neutral {
  --spark: var(--color-pp-text-muted);
  --spark-rgb: 161, 161, 170;
}
</style>
