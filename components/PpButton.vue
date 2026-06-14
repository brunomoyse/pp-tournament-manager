<script setup lang="ts">
import { computed, ref } from 'vue'
import { Motion } from 'motion-v'
import { spring } from '~/composables/useMotionTokens'

/**
 * PpButton: shared button primitive, ported from pp-landing's <Button>.
 *
 * Pill shape (rounded-full), gold primary with the landing's signature glow,
 * focus-visible ring, and an :active press. Renders as <button> by default,
 * as <NuxtLink> when `to` is set, <a> when `href` is set, or any `tag`
 * (e.g. "span") for a decorative pill inside an already-clickable parent.
 *
 * Set `magnetic` on a primary CTA for the landing's cursor-tracking spring
 * (button-only; auto-disabled under prefers-reduced-motion).
 *
 * Replaces the legacy `.pp-action-button*` CSS classes.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
    to?: string
    href?: string
    tag?: string
    block?: boolean
    loading?: boolean
    disabled?: boolean
    magnetic?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    tag: 'button',
    block: false,
    loading: false,
    disabled: false,
    magnetic: false,
  },
)

// NuxtLink is globally registered, so the string form resolves correctly.
const is = computed(() => (props.to ? 'NuxtLink' : props.href ? 'a' : props.tag))

const isDisabled = computed(() => props.disabled || props.loading)

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-pp-gold focus-visible:outline-offset-2 cursor-pointer active:scale-[0.98]'

const sizes: Record<NonNullable<typeof props.size>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}

const variants: Record<NonNullable<typeof props.variant>, string> = {
  primary:
    'bg-pp-gold text-[color:var(--color-pp-on-accent)] hover:bg-pp-gold-strong shadow-[0_8px_30px_-8px_rgba(var(--pp-accent-rgb),0.5)]',
  secondary:
    'bg-pp-surface text-pp-text border border-pp-border hover:border-pp-border-strong hover:bg-pp-surface-2',
  ghost: 'text-pp-text-muted hover:text-pp-text hover:bg-white/5',
  danger:
    'bg-pp-danger/10 text-pp-danger border border-pp-danger/30 hover:bg-pp-danger/20 hover:border-pp-danger/50',
  success:
    'bg-pp-success/10 text-pp-success border border-pp-success/30 hover:bg-pp-success/20 hover:border-pp-success/50',
  warning:
    'text-[#fb923c] bg-[#fb923c]/10 border border-[#fb923c]/30 hover:bg-[#fb923c]/20 hover:border-[#fb923c]/50',
}

const classes = computed(() => [
  base,
  sizes[props.size],
  variants[props.variant],
  props.block && 'w-full',
  isDisabled.value && 'opacity-50 pointer-events-none',
])

// --- Magnetic (opt-in, button-only) ---
const prefersReduced =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const useMagnetic = computed(
  () => props.magnetic && is.value === 'button' && !isDisabled.value && !prefersReduced,
)

const mx = ref(0)
const my = ref(0)

function onMagnetMove(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  mx.value = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 6
  my.value = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * 6
}
function onMagnetLeave() {
  mx.value = 0
  my.value = 0
}
</script>

<template>
  <Motion
    v-if="useMagnetic"
    tag="button"
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    :class="classes"
    :animate="{ x: mx, y: my }"
    :transition="spring.default"
    @pointermove="onMagnetMove"
    @pointerleave="onMagnetLeave"
  >
    <span v-if="loading" class="pp-btn-spinner" aria-hidden="true" />
    <slot />
  </Motion>

  <component
    :is="is"
    v-else
    :to="to || undefined"
    :href="href || undefined"
    :type="is === 'button' ? type : undefined"
    :disabled="is === 'button' ? isDisabled : undefined"
    :aria-busy="loading || undefined"
    :aria-disabled="is !== 'button' && isDisabled ? 'true' : undefined"
    :class="classes"
  >
    <span v-if="loading" class="pp-btn-spinner" aria-hidden="true" />
    <slot />
  </component>
</template>

<style scoped>
.pp-btn-spinner {
  width: 1em;
  height: 1em;
  border-radius: 9999px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: pp-btn-spin 0.6s linear infinite;
}
@keyframes pp-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
