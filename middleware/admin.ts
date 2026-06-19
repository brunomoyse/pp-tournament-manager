import { useAuthStore } from '~/stores/useAuthStore'

// Guards platform-admin-only routes (e.g. the trial-code generator). Managers
// and players who reach one directly by URL are bounced home.
export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
  if ((authStore.currentUser as any)?.role !== 'ADMIN') {
    return navigateTo('/')
  }
})
