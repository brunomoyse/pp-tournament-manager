import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtPlugin(() => {
  const router = useRouter()

  // Set up global GraphQL error handler
  useGqlError((err) => {
    // Check if this is an authentication error
    const isAuthError = err?.gqlErrors?.some((gqlError: any) => {
      const message = gqlError?.message?.toLowerCase() || ''
      return (
        message.includes('must be logged') ||
        message.includes('not authenticated') ||
        message.includes('unauthorized') ||
        message.includes('authentication required') ||
        message.includes('invalid token') ||
        message.includes('token expired') ||
        message.includes('jwt expired')
      )
    })

    if (isAuthError) {
      console.warn('Authentication error detected, redirecting to login...')

      // Clear auth state
      const authStore = useAuthStore()
      authStore.logout()

      // Get current path for redirect after login
      const currentPath = router.currentRoute.value.fullPath

      // Redirect to login page
      router.push({
        path: '/login',
        query: currentPath !== '/login' ? { redirect: currentPath } : undefined
      })
    }
  })
})
