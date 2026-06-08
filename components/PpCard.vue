<script setup lang="ts">
import { computed } from 'vue'

/**
 * PpCard — shared panel primitive built on the global `.pp-card` utility
 * (gradient + border + shadow). Locks the corner radius to --radius-2xl and
 * a small padding scale so every card on the page shares one rhythm.
 *
 * `interactive` cards mirror pp-landing's restraint: border brightens and a
 * faint gold ring appears on hover — no translateY lift. Static info cards
 * stay put (this component neutralizes the legacy global `.pp-card:hover`
 * lift from main.css for its own instances).
 */
const props = withDefaults(
  defineProps<{
    as?: string
    interactive?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }>(),
  {
    as: 'div',
    interactive: false,
    padding: 'md',
  },
)

const paddingClass = computed(
  () =>
    ({
      none: '',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-7',
    })[props.padding],
)
</script>

<template>
  <component
    :is="as"
    class="pp-card ppc"
    :class="[paddingClass, { 'is-interactive': interactive }]"
  >
    <slot />
  </component>
</template>

<style scoped>
.ppc {
  border-radius: var(--radius-2xl);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* Override the global `.pp-card:hover` lift (main.css) — PpCard owns its hover.
   Scoped specificity (attribute selector) wins over the global rule. */
.ppc:hover {
  transform: none;
}

.is-interactive {
  cursor: pointer;
}

@media (hover: hover) {
  .is-interactive:hover {
    border-color: var(--color-pp-border-strong);
    box-shadow:
      var(--shadow-card),
      0 0 0 1px rgba(254, 231, 138, 0.1);
  }
}
</style>
