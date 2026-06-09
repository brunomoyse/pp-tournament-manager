import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { TOUR_STEPS } from '~/utils/tourSteps'

/**
 * Onboarding state: first-run welcome, guided tour progress, and the
 * dashboard setup-guide checklist. Step transitions (route changes, target
 * measurement) are orchestrated by <TourHost>; this store only holds state.
 */
export const useTourStore = defineStore(
  'tour',
  () => {
    // Persisted flags
    const hasSeenWelcome = ref(false)
    /** True once the tour was finished OR explicitly skipped. */
    const tourCompleted = ref(false)
    const checklistDismissed = ref(false)
    const visitedTemplates = ref(false)
    const visitedReports = ref(false)

    // Ephemeral tour state
    const isActive = ref(false)
    const currentStepIndex = ref(0)
    /** True while navigating between steps / searching for a target. */
    const isTransitioning = ref(false)
    const welcomeOpen = ref(false)

    // Getters
    const steps = TOUR_STEPS
    const currentStep = computed(() => (isActive.value ? steps[currentStepIndex.value] : undefined))
    const isLastStep = computed(() => currentStepIndex.value === steps.length - 1)
    const shouldOfferWelcome = computed(
      () => !hasSeenWelcome.value && !tourCompleted.value && !isActive.value,
    )

    // Actions
    const openWelcome = () => {
      welcomeOpen.value = true
    }

    const acceptWelcome = () => {
      hasSeenWelcome.value = true
      welcomeOpen.value = false
      startTour()
    }

    const dismissWelcome = () => {
      hasSeenWelcome.value = true
      welcomeOpen.value = false
    }

    const startTour = () => {
      currentStepIndex.value = 0
      isActive.value = true
    }

    const nextStep = () => {
      if (isLastStep.value) {
        finishTour()
      } else {
        currentStepIndex.value++
      }
    }

    const prevStep = () => {
      if (currentStepIndex.value > 0) currentStepIndex.value--
    }

    const finishTour = () => {
      tourCompleted.value = true
      isActive.value = false
      isTransitioning.value = false
    }

    const skipTour = () => {
      tourCompleted.value = true
      isActive.value = false
      isTransitioning.value = false
    }

    /** Close the tour without marking it completed (e.g. on logout). */
    const abortTour = () => {
      isActive.value = false
      isTransitioning.value = false
      currentStepIndex.value = 0
    }

    const dismissChecklist = () => {
      checklistDismissed.value = true
    }

    /** Dev helper: replay the whole onboarding from scratch. */
    const resetOnboarding = () => {
      hasSeenWelcome.value = false
      tourCompleted.value = false
      checklistDismissed.value = false
      visitedTemplates.value = false
      visitedReports.value = false
      isActive.value = false
      welcomeOpen.value = false
      currentStepIndex.value = 0
      isTransitioning.value = false
    }

    return {
      // State
      hasSeenWelcome,
      tourCompleted,
      checklistDismissed,
      visitedTemplates,
      visitedReports,
      isActive,
      currentStepIndex,
      isTransitioning,
      welcomeOpen,

      // Getters
      steps,
      currentStep,
      isLastStep,
      shouldOfferWelcome,

      // Actions
      openWelcome,
      acceptWelcome,
      dismissWelcome,
      startTour,
      nextStep,
      prevStep,
      finishTour,
      skipTour,
      abortTour,
      dismissChecklist,
      resetOnboarding,
    }
  },
  {
    persist: {
      pick: [
        'hasSeenWelcome',
        'tourCompleted',
        'checklistDismissed',
        'visitedTemplates',
        'visitedReports',
      ],
    },
  },
)
