import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side to avoid SSR issues with persistence
  if (import.meta.server) return
  
  // Check localStorage first - if we have persisted data, user should be authenticated
  const storedData = localStorage.getItem('auth-store')
  const backupData = localStorage.getItem('auth-backup')
  
  // If we have persisted auth data, allow access immediately
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData)
      if (parsed.authToken && parsed.currentUser) {
        // Make sure GraphQL token is set
        if (import.meta.client) {
          useGqlToken(parsed.authToken)
        }
        
        return // Allow access
      }
    } catch (e) {
      // Silently continue to back up check
    }
  }
  
  // Fallback: try backup localStorage
  if (backupData) {
    try {
      const parsed = JSON.parse(backupData)
      if (parsed.authToken && parsed.currentUser) {
        // Make sure GraphQL token is set
        if (import.meta.client) {
          useGqlToken(parsed.authToken)
        }
        
        return // Allow access
      }
    } catch (e) {
      // Silently continue to redirect
    }
  }
  
  // No valid auth data found, redirect to login
  return navigateTo({
    path: '/login',
    query: {
      redirect: to.fullPath
    }
  })
})