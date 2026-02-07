import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})