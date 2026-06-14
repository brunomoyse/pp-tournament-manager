import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const nuxtApp = useNuxtApp()
  const toast = useToast()

  // Translate via the i18n instance the i18n plugin provides. Resolved lazily
  // (at error time) so it's populated regardless of plugin load order; falls
  // back to the raw key if i18n isn't ready.
  const translate = (key: string) => {
    const t = nuxtApp.$i18n?.global?.t
    return typeof t === 'function' ? t(key) : key
  }

  // Set up global GraphQL error handler
  useGqlError((err: any) => {
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
            query: currentPath !== '/login' ? { redirect: currentPath } : undefined,
          })
        }
        // If refresh succeeded the token is updated for subsequent requests.
        // This is now only a safety net: the gql:auth:init hook refreshes the
        // token just-in-time before each request, so reaching here normally
        // means the refresh token itself is gone (revoked/expired) — hence the
        // logout above. The one operation that raced the expiry isn't retried.
      })
      return
    }

    // Non-auth failure (server error, network drop, validation): surface a
    // toast instead of failing silently so the user knows the action didn't go
    // through. A generic message avoids leaking backend internals.
    console.error('[gql] request failed', err)
    toast.error(translate('error.boundary.defaultMessage'))
  })
})
