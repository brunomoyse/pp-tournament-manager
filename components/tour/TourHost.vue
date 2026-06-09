<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useTourStore } from '~/stores/useTourStore'
import { useAuthStore } from '~/stores/useAuthStore'
import TourWelcomeModal from '~/components/tour/TourWelcomeModal.vue'
import TourOverlay from '~/components/tour/TourOverlay.vue'

/**
 * TourHost: mounts the onboarding pieces once in the default layout and
 * handles the triggers around them — first-run welcome on the dashboard,
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

// Checklist signals: visiting a section counts as exploring it.
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/templates')) tourStore.visitedTemplates = true
    if (path.startsWith('/reports')) tourStore.visitedReports = true
  },
  { immediate: true },
)

// Logout mid-tour: close everything quietly (flags stay persisted).
// isAuthenticated can flap for a moment during the proactive token refresh,
// so only a sustained false counts as a real logout.
let logoutTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => authStore.isAuthenticated,
  (authed) => {
    if (authed) {
      if (logoutTimer) {
        clearTimeout(logoutTimer)
        logoutTimer = null
      }
      return
    }
    logoutTimer = setTimeout(() => {
      logoutTimer = null
      if (authStore.isAuthenticated) return
      if (tourStore.isActive) tourStore.abortTour()
      tourStore.welcomeOpen = false
    }, 1500)
  },
)

onBeforeUnmount(() => {
  if (welcomeTimer) clearTimeout(welcomeTimer)
  if (logoutTimer) clearTimeout(logoutTimer)
})
</script>

<template>
  <TourWelcomeModal />
  <TourOverlay />
</template>
