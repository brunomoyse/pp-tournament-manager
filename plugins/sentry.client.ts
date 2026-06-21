import * as Sentry from '@sentry/vue'

/**
 * Crash/error reporting (Sentry project pp-tournament-manager). Client-only -
 * this is an SPA (`ssr: false`), so all errors originate in the browser.
 * No-op when no DSN is configured (local dev without NUXT_PUBLIC_SENTRY_DSN).
 *
 * `enforce: 'pre'` runs this before the other client plugins so errors thrown
 * during their setup are captured too. Vue render/lifecycle errors are caught
 * automatically via the `app` binding; non-auth GraphQL failures are forwarded
 * explicitly from `gql-error-handler.client.ts`.
 */
export default defineNuxtPlugin({
  name: 'sentry',
  enforce: 'pre',
  setup(nuxtApp) {
    const dsn = useRuntimeConfig().public.sentryDsn
    if (!dsn) return

    Sentry.init({
      app: nuxtApp.vueApp,
      dsn,
      // Keep manager PII (emails, names) out of events, mirroring the backend.
      sendDefaultPii: false,
      // Errors only for the pilot - no performance tracing.
      tracesSampleRate: 0,
    })
  },
})
