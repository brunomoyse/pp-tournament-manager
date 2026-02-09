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
      console.warn('Authentication error detected, attempting token refresh...')

      const authStore = useAuthStore()

      // Attempt to refresh the access token before logging out
      authStore.refreshAccessToken().then((newToken) => {
        if (!newToken) {
          // Refresh failed — logout and redirect to login
          authStore.logout()

          const currentPath = router.currentRoute.value.fullPath

          router.push({
            path: '/login',
            query: currentPath !== '/login' ? { redirect: currentPath } : undefined
          })
        }
        // If refresh succeeded, the token is updated.
        // The failed request won't be retried automatically —
        // the user/component will need to re-trigger the operation.
      })
    }
  })
})
