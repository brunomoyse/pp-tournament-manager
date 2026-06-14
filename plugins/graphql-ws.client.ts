// plugins/graphql-ws.client.ts
import { createClient } from 'graphql-ws'
import type { Client } from 'graphql-ws'
import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtPlugin((_nuxtApp) => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  // e.g. wss://api.example.com/graphql
  const url = config.public.graphqlWsEndpoint || 'ws://localhost:8080/graphql'

  const wsClient: Client | null = import.meta.client
    ? createClient({
        url,
        // Runs on every (re)connect. Refresh just-in-time so a reconnect after
        // the tab was suspended past expiry presents a valid token — the backend
        // only authenticates at connection_init, so a stale token here means the
        // socket fails auth and retries forever, wedging live updates.
        connectionParams: async () => {
          const token = await authStore.ensureFreshToken()
          return {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        },
        lazy: true,
        keepAlive: 15000,
        retryAttempts: 10,
        shouldRetry: () => true,
      })
    : null

  return { provide: { gqlWs: wsClient } }
})
