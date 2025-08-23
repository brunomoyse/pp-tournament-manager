import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  
  // TEMPORARY: Skip auth for development/testing
  console.log('Auth check - isAuthenticated:', isAuthenticated.value)
  console.log('Auth check - target path:', to.fullPath)
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: {
        // Store the intended destination for redirect after login
        redirect: to.fullPath
      }
    })
  }
})