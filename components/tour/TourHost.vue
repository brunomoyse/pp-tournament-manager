<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useTourStore } from '~/stores/useTourStore'
import { useAuthStore } from '~/stores/useAuthStore'
import TourWelcomeModal from '~/components/tour/TourWelcomeModal.vue'
import TourOverlay from '~/components/tour/TourOverlay.vue'

/**
 * TourHost: mounts the onboarding pieces once in the default layout and
 * handles the triggers around them: first-run welcome on the dashboard,
 * checklist "visited" signals, and cleanup when the user logs out.
 */
const tourStore = useTourStore()
const authStore = useAuthStore()
const clubStore = useClubStore()
const route = useRoute()

let welcomeTimer: ReturnType<typeof setTimeout> | null = null

// First-run welcome: offered once, on the dashboard, after the page settles.
watch(
  () => [route.path, authStore.isAuthenticated, clubStore.hasSelectedClub] as const,
  ([path, authed, hasClub]) => {
    if (welcomeTimer) {
      clearTimeout(welcomeTimer)
      welcomeTimer = null
    }
    if (path === '/' && authed && hasClub && tourStore.shouldOfferWelcome) {
      welcomeTimer = setTimeout(() => {
        if (tourStore.shouldOfferWelcome && route.path === '/') tourStore.openWelcome()
      }, 800)
    }
  },
  { immediate: true },
)

// Checklist signals: visiting a section counts as exploring it — but only
// when the user navigates there themselves. The tour drives the route through
// /templates and /reports as part of its steps, which must not pre-tick the
// checklist items.
watch(
  () => route.path,
  (path) => {
    if (tourStore.isActive) return
    if (path.startsWith('/templates')) tourStore.visitedTemplates = true
    if (path.startsWith('/reports')) tourStore.visitedReports = true
  },
  { immediate: true },
)

// Logout mid-tour: this component lives in the default layout, which only
// unmounts when the user really leaves the authenticated app (login and
// club-registration pages use layout: false). Cleaning up here is more
// reliable than watching isAuthenticated, which flaps during token refresh.
onBeforeUnmount(() => {
  if (welcomeTimer) clearTimeout(welcomeTimer)
  if (tourStore.isActive) tourStore.abortTour()
  tourStore.welcomeOpen = false
})
</script>

<template>
  <TourWelcomeModal />
  <TourOverlay />
</template>
