<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useTourStore } from '~/stores/useTourStore'
import { useI18n } from '~/composables/useI18n'
import { useToast } from '~/composables/useToast'
import type { HoleRect } from '~/utils/tourPositioning'
import {
  holeFromTarget,
  collapsedHole,
  spotlightPath,
  placePopover,
  tweenHole,
  waitForTourTarget,
  prefersReducedMotion,
} from '~/utils/tourPositioning'
import type { TourStep } from '~/utils/tourSteps'
import TourPopover from '~/components/tour/TourPopover.vue'

/**
 * TourOverlay: the guided-tour engine. A full-viewport even-odd SVG path dims
 * the app and punches a click-through hole over the current target; a gold
 * ring hugs the hole and a glass popover explains the step. The hole morphs
 * (iris close → navigate → iris open) when steps live on different pages.
 */
const tourStore = useTourStore()
const route = useRoute()
const { t } = useI18n()
const toast = useToast()

const reduced = prefersReducedMotion()

// --- Spotlight state -------------------------------------------------------
const hole = ref<HoleRect | null>(null)
const vw = ref(0)
const vh = ref(0)

const pathD = computed(() =>
  hole.value ? spotlightPath(hole.value, vw.value, vh.value) : `M0 0H${vw.value}V${vh.value}H0Z`,
)

const ringStyle = computed(() => {
  if (!hole.value) return { opacity: '0' }
  const { x, y, w, h, r } = hole.value
  return {
    transform: `translate(${x}px, ${y}px)`,
    width: `${w}px`,
    height: `${h}px`,
    borderRadius: `${r}px`,
    opacity: tourStore.isTransitioning ? '0' : '1',
  }
})

// --- Popover state ---------------------------------------------------------
const popoverEl = ref<HTMLElement | null>(null)
const popoverVisible = ref(false)
const popoverMeasured = ref(false)
const popoverPos = ref({ x: 0, y: 0 })
const lastPopoverSize = ref({ width: 336, height: 220 })

const isMobile = computed(() => vw.value > 0 && vw.value < 768)

const popoverStyle = computed(() => {
  if (isMobile.value) return undefined
  return {
    transform: `translate(${popoverPos.value.x}px, ${popoverPos.value.y}px)`,
  }
})

// --- Step orchestration ----------------------------------------------------
let sequence = 0
let cancelTween: (() => void) | null = null
let currentTarget: HTMLElement | null = null
let resizeObserver: ResizeObserver | null = null

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const updateViewport = () => {
  vw.value = window.innerWidth
  vh.value = window.innerHeight
}

const setHole = (rect: HoleRect) => {
  hole.value = rect
}

/** Re-glue the spotlight + popover to the target without animating. */
const syncToTarget = () => {
  if (!currentTarget || tourStore.isTransitioning || !tourStore.currentStep) return
  updateViewport()
  const next = holeFromTarget(currentTarget, tourStore.currentStep.padding ?? 8)
  setHole(next)
  if (!isMobile.value && popoverMeasured.value) {
    const pos = placePopover(next, lastPopoverSize.value, tourStore.currentStep.placement ?? 'auto')
    popoverPos.value = { x: pos.x, y: pos.y }
  }
}

let syncFrame = 0
const requestSync = () => {
  cancelAnimationFrame(syncFrame)
  syncFrame = requestAnimationFrame(syncToTarget)
}

const observeTarget = (el: HTMLElement) => {
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(requestSync)
  resizeObserver.observe(el)
}

const showPopoverAt = async (targetHole: HoleRect, step: TourStep) => {
  popoverMeasured.value = false
  popoverVisible.value = true
  await nextTick()
  // One frame so the card has real dimensions before we place it.
  await new Promise(requestAnimationFrame)
  if (!isMobile.value && popoverEl.value) {
    const { offsetWidth, offsetHeight } = popoverEl.value
    lastPopoverSize.value = { width: offsetWidth, height: offsetHeight }
    const pos = placePopover(targetHole, lastPopoverSize.value, step.placement ?? 'auto')
    popoverPos.value = { x: pos.x, y: pos.y }
  }
  popoverMeasured.value = true
}

const goToStep = async (step: TourStep) => {
  const token = ++sequence
  cancelTween?.()
  popoverVisible.value = false
  tourStore.isTransitioning = true
  updateViewport()

  // Iris-close on the page we're leaving.
  if (route.path !== step.route) {
    if (hole.value && !reduced) {
      await new Promise<void>((resolve) => {
        cancelTween = tweenHole(hole.value!, collapsedHole(hole.value!), setHole, {
          duration: 260,
          onDone: resolve,
        })
      })
    }
    if (token !== sequence) return
    await navigateTo(step.route)
  }

  const el = await waitForTourTarget(step.id, 5000)
  if (token !== sequence) return

  if (!el) {
    console.warn(`[tour] target "${step.id}" not found, skipping step`)
    if (tourStore.isLastStep) {
      tourStore.finishTour()
    } else {
      tourStore.nextStep()
    }
    return
  }

  el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
  await sleep(reduced ? 60 : 380)
  if (token !== sequence) return

  const targetHole = holeFromTarget(el, step.padding ?? 8)
  const from = hole.value ?? collapsedHole(targetHole)
  currentTarget = el
  observeTarget(el)

  await new Promise<void>((resolve) => {
    cancelTween = tweenHole(from, targetHole, setHole, {
      duration: reduced ? 0 : 480,
      onDone: resolve,
    })
  })
  if (token !== sequence) return

  tourStore.isTransitioning = false
  await showPopoverAt(targetHole, step)
}

// --- Actions ---------------------------------------------------------------
const onNext = () => {
  if (tourStore.isTransitioning) return
  if (tourStore.isLastStep) {
    tourStore.finishTour()
    toast.success(t('tour.finished'))
  } else {
    tourStore.nextStep()
  }
}

const onPrev = () => {
  if (!tourStore.isTransitioning) tourStore.prevStep()
}

const onSkip = () => {
  tourStore.skipTour()
}

// --- Global listeners ------------------------------------------------------
const onKeydown = (e: KeyboardEvent) => {
  if (!tourStore.isActive) return
  if (e.key === 'Escape') {
    e.preventDefault()
    onSkip()
  } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    e.preventDefault()
    onNext()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    onPrev()
  }
}

const attachListeners = () => {
  window.addEventListener('resize', requestSync)
  // Capture phase: scroll events don't bubble, but capture sees them all
  // (including ion-content's inner scroll container).
  window.addEventListener('scroll', requestSync, true)
  document.addEventListener('keydown', onKeydown)
}

const detachListeners = () => {
  window.removeEventListener('resize', requestSync)
  window.removeEventListener('scroll', requestSync, true)
  document.removeEventListener('keydown', onKeydown)
  resizeObserver?.disconnect()
  resizeObserver = null
  cancelAnimationFrame(syncFrame)
}

watch(
  () => [tourStore.isActive, tourStore.currentStepIndex] as const,
  ([active], previous) => {
    const wasActive = previous?.[0] ?? false
    if (active) {
      if (!wasActive) {
        attachListeners()
        hole.value = null
      }
      const step = tourStore.currentStep
      if (step) goToStep(step)
    } else if (wasActive) {
      sequence++
      cancelTween?.()
      detachListeners()
      popoverVisible.value = false
      currentTarget = null
      hole.value = null
    }
  },
)

onBeforeUnmount(detachListeners)
</script>

<template>
  <Teleport to="body">
    <Transition name="tour-fade">
      <div
        v-if="tourStore.isActive"
        class="tour-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="t('tour.ariaLabel')"
      >
        <svg class="tour-backdrop" :width="vw" :height="vh" :viewBox="`0 0 ${vw} ${vh}`">
          <path :d="pathD" fill-rule="evenodd" class="tour-dim" @click.stop />
        </svg>

        <div class="tour-ring" :class="{ 'tour-ring--pulse': !reduced }" :style="ringStyle" />

        <div
          v-if="popoverVisible && tourStore.currentStep"
          ref="popoverEl"
          class="tour-popover-wrap"
          :class="{
            'tour-popover-wrap--sheet': isMobile,
            'tour-popover-wrap--measuring': !popoverMeasured,
          }"
          :style="popoverStyle"
        >
          <TourPopover
            :step-id="tourStore.currentStep.id"
            :step-index="tourStore.currentStepIndex"
            :total="tourStore.steps.length"
            :is-last="tourStore.isLastStep"
            @next="onNext"
            @prev="onPrev"
            @skip="onSkip"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}

.tour-backdrop {
  position: absolute;
  inset: 0;
  display: block;
}

.tour-dim {
  fill: rgba(10, 10, 12, 0.78);
  pointer-events: fill;
  cursor: default;
}

.tour-ring {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  border: 1.5px solid rgba(254, 231, 138, 0.9);
  box-shadow:
    0 0 0 1px rgba(254, 231, 138, 0.15),
    0 0 24px rgba(254, 231, 138, 0.25),
    inset 0 0 18px rgba(254, 231, 138, 0.08);
  transition: opacity 0.25s ease;
  will-change: transform, width, height;
}

.tour-ring--pulse {
  animation: tour-ring-breathe 2.4s ease-in-out infinite;
}

@keyframes tour-ring-breathe {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(254, 231, 138, 0.15),
      0 0 24px rgba(254, 231, 138, 0.25),
      inset 0 0 18px rgba(254, 231, 138, 0.08);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(254, 231, 138, 0.25),
      0 0 38px rgba(254, 231, 138, 0.4),
      inset 0 0 24px rgba(254, 231, 138, 0.14);
  }
}

.tour-popover-wrap {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.tour-popover-wrap--measuring {
  transition: none;
  opacity: 0;
}

/* Mobile: bottom sheet pinned above the 70px tab bar. */
.tour-popover-wrap--sheet {
  position: fixed;
  top: auto;
  left: 1rem;
  right: 1rem;
  bottom: calc(70px + env(safe-area-inset-bottom) + 1rem);
  transform: none !important;
  transition: none;
}

.tour-popover-wrap--sheet :deep(.tour-popover) {
  width: 100%;
  max-width: none;
}

@media (prefers-reduced-motion: reduce) {
  .tour-popover-wrap {
    transition: none;
  }
}

/* Overlay enter/exit */
.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.3s ease;
}

.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}
</style>
