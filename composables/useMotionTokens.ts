/**
 * Motion design tokens — shared timing + easing + spring presets so every
 * animation in the app feels like it came from the same place. Mirrors the
 * landing's framer-motion constants so cross-app polish stays in sync.
 */

export const easing = [0.16, 1, 0.3, 1] as const

export const duration = {
  micro: 0.2,
  standard: 0.6,
  slow: 1.0,
} as const

export const spring = {
  default: { type: 'spring' as const, stiffness: 260, damping: 20, mass: 0.4 },
  gentle: { type: 'spring' as const, stiffness: 180, damping: 25, mass: 0.5 },
  bouncy: { type: 'spring' as const, stiffness: 320, damping: 16, mass: 0.4 },
} as const

export function useMotionTokens() {
  return { easing, duration, spring }
}
