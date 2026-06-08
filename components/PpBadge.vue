<script setup lang="ts">
/**
 * PpBadge — status chip primitive, styled after pp-landing's mono pill
 * (font-mono, low-alpha tinted fill + matching border, fully rounded).
 *
 * Collapses the legacy 8-colour `.pp-status--*` palette into a semantic set.
 * Wire it from utils/tournamentStatus.ts and utils/registrationStatus.ts via
 * the *Variant() helpers.
 */
withDefaults(
  defineProps<{
    variant?: 'gold' | 'success' | 'info' | 'warning' | 'danger' | 'neutral'
  }>(),
  {
    variant: 'neutral',
  },
)
</script>

<template>
  <span class="pp-badge" :class="`pp-badge--${variant}`">
    <slot />
  </span>
</template>

<style scoped>
.pp-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  white-space: nowrap;
  border: 1px solid transparent;
}

.pp-badge--gold {
  color: var(--color-pp-gold);
  background: rgba(254, 231, 138, 0.08);
  border-color: rgba(254, 231, 138, 0.3);
}
.pp-badge--success {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}
.pp-badge--info {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
}
.pp-badge--warning {
  color: #fb923c;
  background: rgba(249, 115, 22, 0.1);
  border-color: rgba(249, 115, 22, 0.3);
}
.pp-badge--danger {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}
.pp-badge--neutral {
  color: var(--color-pp-text-muted);
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-pp-border-strong);
}
</style>
