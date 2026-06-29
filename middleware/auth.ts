import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Not authenticated: send to login, remembering where they were headed so the
  // login page can bounce them back after re-authentication.
  if (!authStore.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: to.fullPath && to.fullPath !== '/login' ? { redirect: to.fullPath } : undefined,
    })
  }
})
