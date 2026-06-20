import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  pages: true,
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/ionic',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nuxt-graphql-client',
  ],
  ionic: {
    css: {
      // Imported manually in assets/css/main.css under @layer ionic. The
      // module would inject these unlayered, and Ionic's normalize ships a
      // `button { padding: 0; border-radius: 0 }` reset that an unlayered
      // rule lets win over every Tailwind utility (rounded-full, px-*).
      core: false,
      basic: false,
      utilities: false,
    },
  },
  ssr: false,
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap',
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  'graphql-client': {
    clients: {
      default: {
        host: process.env.NUXT_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
        headers: {
          'Content-Type': 'application/json',
        },
        corsOptions: {
          mode: 'cors',
          credentials: 'include',
        },
        tokenStorage: {
          mode: 'cookie',
          cookieOptions: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          },
        },
      },
    },
    codegen: process.env.DISABLE_CODEGEN !== 'true',
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
      graphqlEndpoint: process.env.NUXT_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      graphqlWsEndpoint: process.env.NUXT_GRAPHQL_WS_ENDPOINT || 'ws://localhost:8080/graphql',
      authBaseUrl: process.env.NUXT_AUTH_BASE_URL || 'http://localhost:8080',
      authRegisterUrl: process.env.NUXT_AUTH_REGISTER_URL || 'http://localhost:8080/oauth/register',
      authLoginUrl: process.env.NUXT_AUTH_LOGIN_URL || 'http://localhost:8080/oauth/login',
      // Base URL of the Mollie payments microservice (see tsb-service). Empty
      // until that service is deployed; the upgrade CTA falls back to contact.
      paymentsBaseUrl: process.env.NUXT_PUBLIC_PAYMENTS_BASE_URL || '',
      // Sentry DSN (Sentry project pp-tournament-manager). Baked at build time
      // (SPA). A browser DSN is write-only and ships in the bundle anyway, so
      // the project DSN is the default; override per-env with NUXT_PUBLIC_SENTRY_DSN.
      sentryDsn:
        process.env.NUXT_PUBLIC_SENTRY_DSN ||
        'https://a2bcbfef60cfef1b8ff91927d27b77f4@o4511241813819392.ingest.de.sentry.io/4511597219938384',
    },
  },
})
