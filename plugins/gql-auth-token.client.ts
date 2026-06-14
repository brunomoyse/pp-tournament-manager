import type { Ref } from 'vue'
import { useAuthStore } from '~/stores/useAuthStore'

// nuxt-graphql-client fires this hook from its requestMiddleware but ships no
// type for it; declare it so the handler below is type-checked.
declare module '#app' {
  interface RuntimeNuxtHooks {
    'gql:auth:init': (params: {
      token: Ref<string | undefined>
      client: string
    }) => void | Promise<void>
  }
}

// nuxt-graphql-client awaits this hook before every request and uses the token
// we set here (taking precedence over its cookie storage). We hand it a token
// that's refreshed just-in-time when near expiry, so a request never leaves
// with an already-expired access token — the manager's reactive refresh can't
// retry the failed operation, so prevention is what keeps pages from blanking.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('gql:auth:init', async ({ token }) => {
    const authStore = useAuthStore()
    const fresh = await authStore.ensureFreshToken()
    // Raw token; nuxt-graphql-client prepends the `Bearer` scheme itself.
    if (fresh) token.value = fresh
  })
})
