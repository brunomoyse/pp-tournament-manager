/**
 * Geometry helpers for the guided tour: spotlight hole math, the SVG
 * even-odd cutout path, popover placement with viewport clamping, and a
 * small rAF tween used to morph the spotlight between steps.
 */

export interface HoleRect {
  x: number
  y: number
  w: number
  h: number
  r: number
}

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

/**
 * First element carrying `data-tour="<id>"` that is actually visible inside
 * the viewport. `offsetParent` checks fail for `position: fixed` elements
 * (sidebar, tab bar), so visibility is judged from the client rect instead;
 * this also rejects the mobile sidebar parked off-screen at translateX(-100%).
 */
export function findTourTarget(id: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)
  for (const el of candidates) {
    const rect = el.getBoundingClientRect()
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight &&
      getComputedStyle(el).visibility !== 'hidden'
    if (visible) return el
  }
  return null
}

export function holeFromTarget(el: HTMLElement, padding = 8, radius = 14): HoleRect {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.left - padding,
    y: rect.top - padding,
    w: rect.width + padding * 2,
    h: rect.height + padding * 2,
    r: radius,
  }
}

/** Zero-size hole at the center of another, used for the iris close/open. */
export function collapsedHole(from: HoleRect): HoleRect {
  return { x: from.x + from.w / 2, y: from.y + from.h / 2, w: 0, h: 0, r: 0 }
}

/**
 * Full-viewport rect + rounded-rect hole as a single even-odd path. With
 * `pointer-events: fill` the dimmed area swallows clicks while the hole lets
 * them through to the highlighted element.
 */
export function spotlightPath(hole: HoleRect, vw: number, vh: number): string {
  const r = Math.max(0, Math.min(hole.r, hole.w / 2, hole.h / 2))
  const { x, y, w, h } = hole
  const outer = `M0 0H${vw}V${vh}H0Z`
  const inner =
    `M${x + r} ${y}` +
    `H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  return outer + inner
}

export interface PopoverPosition {
  x: number
  y: number
  placement: PopoverPlacement
}

const GAP = 16
const EDGE = 16

/**
 * Place a popover of `size` next to the hole, preferring `preferred` then
 * falling back to whichever side fits; coordinates are clamped to keep the
 * card fully on screen.
 */
export function placePopover(
  hole: HoleRect,
  size: { width: number; height: number },
  preferred: PopoverPlacement | 'auto' = 'auto',
): PopoverPosition {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const fits: Record<PopoverPlacement, boolean> = {
    bottom: hole.y + hole.h + GAP + size.height <= vh - EDGE,
    top: hole.y - GAP - size.height >= EDGE,
    right: hole.x + hole.w + GAP + size.width <= vw - EDGE,
    left: hole.x - GAP - size.width >= EDGE,
  }

  const order: PopoverPlacement[] =
    preferred !== 'auto'
      ? [preferred, 'bottom', 'top', 'right', 'left']
      : ['bottom', 'top', 'right', 'left']
  const placement = order.find((p) => fits[p]) ?? 'bottom'

  let x: number
  let y: number
  switch (placement) {
    case 'bottom':
      x = hole.x + hole.w / 2 - size.width / 2
      y = hole.y + hole.h + GAP
      break
    case 'top':
      x = hole.x + hole.w / 2 - size.width / 2
      y = hole.y - GAP - size.height
      break
    case 'right':
      x = hole.x + hole.w + GAP
      y = hole.y + hole.h / 2 - size.height / 2
      break
    case 'left':
      x = hole.x - GAP - size.width
      y = hole.y + hole.h / 2 - size.height / 2
      break
  }

  x = Math.min(Math.max(x, EDGE), vw - size.width - EDGE)
  y = Math.min(Math.max(y, EDGE), vh - size.height - EDGE)
  return { x, y, placement }
}

/** Mirrors the app-wide [0.16, 1, 0.3, 1] feel closely enough for the morph. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * Tween one hole rect into another over `duration` ms, invoking `onFrame`
 * with the interpolated rect each animation frame. Returns a cancel handle.
 */
export function tweenHole(
  from: HoleRect,
  to: HoleRect,
  onFrame: (rect: HoleRect) => void,
  options: { duration?: number; onDone?: () => void } = {},
): () => void {
  const duration = options.duration ?? 480
  if (duration <= 0) {
    onFrame(to)
    options.onDone?.()
    return () => {}
  }

  let raf = 0
  const start = performance.now()
  const step = (now: number) => {
    const t = easeOutExpo(Math.min(1, (now - start) / duration))
    onFrame({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      w: from.w + (to.w - from.w) * t,
      h: from.h + (to.h - from.h) * t,
      r: from.r + (to.r - from.r) * t,
    })
    if (t < 1) {
      raf = requestAnimationFrame(step)
    } else {
      options.onDone?.()
    }
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}

/** Poll for a tour target until it exists or `timeout` ms elapse. */
export function waitForTourTarget(id: string, timeout = 5000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = performance.now()
    const tick = () => {
      const el = findTourTarget(id)
      if (el) return resolve(el)
      if (performance.now() - start > timeout) return resolve(null)
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
