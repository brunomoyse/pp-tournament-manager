import { useAuthStore } from '~/stores/useAuthStore'

// Guards player-facing/paid-only features (announcements, leagues/leaderboards).
// Free ("Home Game") clubs are a private host tool, so redirect them home if
// they reach one of these routes directly by URL.
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  const plan = (authStore.currentUser as any)?.managedClub?.plan ?? 'FREE'
  if (plan === 'FREE') {
    return navigateTo('/')
  }
})
