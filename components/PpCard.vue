<script setup lang="ts">
import { computed } from 'vue'

/**
 * PpCard: shared panel primitive built on the global `.pp-card` utility
 * (gradient + border + shadow). Locks the corner radius to --radius-2xl and
 * a small padding scale so every card on the page shares one rhythm.
 *
 * `interactive` cards mirror pp-landing's restraint: border brightens and a
 * faint gold spotlight follows the cursor on hover, no translateY lift.
 * Static info cards stay put (this component neutralizes the legacy global
 * `.pp-card:hover` lift from main.css for its own instances).
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

// Track the cursor as CSS vars on the element directly (no reactive state ->
// no per-frame re-render). The spotlight ::before reads --pp-mx / --pp-my.
function onMove(e: PointerEvent) {
  if (!props.interactive) return
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  el.style.setProperty('--pp-mx', `${((e.clientX - r.left) / r.width) * 100}%`)
  el.style.setProperty('--pp-my', `${((e.clientY - r.top) / r.height) * 100}%`)
}
function onLeave(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  el.style.removeProperty('--pp-mx')
  el.style.removeProperty('--pp-my')
}

// Keyboard parity for interactive cards: Enter/Space activate the same way a
// click does. Synthesizing a native click fires whatever @click the consumer
// attached (fallthrough), so callers need no extra wiring.
function onKeydown(e: KeyboardEvent) {
  if (!props.interactive) return
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).click()
  }
}
</script>

<template>
  <component
    :is="as"
    class="pp-card ppc"
    :class="[paddingClass, { 'is-interactive': interactive }]"
    :role="interactive ? 'button' : undefined"
    :tabindex="interactive ? 0 : undefined"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @keydown="onKeydown"
  >
    <slot />
  </component>
</template>

<style scoped>
.ppc {
  position: relative;
  isolation: isolate;
  border-radius: var(--radius-2xl);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* Override the global `.pp-card:hover` lift (main.css); PpCard owns its hover.
   Scoped specificity (attribute selector) wins over the global rule. */
.ppc:hover {
  transform: none;
}

.is-interactive {
  cursor: pointer;
}

/* Cursor-following gold spotlight, painted above the card background but
   below content (negative z within the card's own stacking context). */
.is-interactive::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: radial-gradient(
    220px circle at var(--pp-mx, 50%) var(--pp-my, 0%),
    rgba(var(--pp-accent-rgb), 0.1),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

@media (hover: hover) {
  .is-interactive:hover {
    border-color: var(--color-pp-border-strong);
    box-shadow:
      var(--shadow-card),
      0 0 0 1px rgba(var(--pp-accent-rgb), 0.1);
  }
  .is-interactive:hover::before {
    opacity: 1;
  }
}
</style>
