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
            connectionParams: async () => ({
                // mirror the same auth as nuxt-graphql-client
                headers: authStore.authToken ? { Authorization: `Bearer ${authStore.authToken}` } : undefined,
            }),
            lazy: true,
            keepAlive: 15000,
            retryAttempts: 10,
            shouldRetry: () => true,
        })
        : null

    return { provide: { gqlWs: wsClient } }
})
