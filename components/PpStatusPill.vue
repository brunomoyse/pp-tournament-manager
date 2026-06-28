<script setup lang="ts">
import { computed } from 'vue'

/**
 * PpStatusPill: tinted status pill (≈14% fill, ≈30% border, coloured text)
 * driven by a semantic tone. Complements PpBadge: use PpBadge for the existing
 * tournament/registration status variants, PpStatusPill for the refreshed
 * dashboard / live / card surfaces that need a leading dot (optionally pulsing
 * for live events) and the sky/orange status palette from the design tokens.
 */
type Tone = 'live' | 'danger' | 'success' | 'info' | 'warning' | 'gold' | 'neutral'

const props = withDefaults(
  defineProps<{
    tone?: Tone
    /** Show a leading dot. `live` tone pulses it automatically. */
    dot?: boolean
  }>(),
  {
    tone: 'neutral',
    dot: false,
  },
)

const pulsing = computed(() => props.dot && props.tone === 'live')
</script>

<template>
  <span class="pp-pill" :class="`pp-pill--${tone}`">
    <span v-if="dot" class="pp-pill__dot" :class="{ 'pp-pill__dot--pulse': pulsing }" />
    <slot />
  </span>
</template>

<style scoped>
.pp-pill {
  --pill-rgb: 255, 255, 255;
  --pill-color: var(--color-pp-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  white-space: nowrap;
  color: var(--pill-color);
  background: rgba(var(--pill-rgb), 0.14);
  border: 1px solid rgba(var(--pill-rgb), 0.3);
}

.pp-pill__dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: var(--pill-color);
  flex-shrink: 0;
}

.pp-pill__dot--pulse {
  animation: pp-pill-pulse 2s ease-in-out infinite;
}

.pp-pill--live,
.pp-pill--danger {
  --pill-rgb: var(--pp-danger-rgb);
  --pill-color: #f87171;
}
.pp-pill--success {
  --pill-rgb: var(--pp-success-rgb);
  --pill-color: #34d399;
}
.pp-pill--info {
  --pill-rgb: var(--pp-info-rgb);
  --pill-color: var(--color-pp-info);
}
.pp-pill--warning {
  --pill-rgb: var(--pp-warning-rgb);
  --pill-color: var(--color-pp-warning);
}
.pp-pill--gold {
  --pill-rgb: var(--pp-accent-rgb);
  --pill-color: var(--color-pp-gold);
}
.pp-pill--neutral {
  --pill-rgb: 161, 161, 170;
  --pill-color: var(--color-pp-text-muted);
}

@keyframes pp-pill-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(var(--pill-rgb), 0.55);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(var(--pill-rgb), 0);
  }
}
</style>
