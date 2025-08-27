import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  pages: true,
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/ionic',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    'nuxt-graphql-client'
  ],
  ssr: false,
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  'graphql-client': {
    clients: {
      default: {
        host: process.env.NUXT_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
        headers: {
          'Content-Type': 'application/json',
        },
        tokenStorage: {
          mode: 'cookie',
          cookieOptions: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          }
        }
      },
    },
    codegen: true, // Disable for now until we set up proper types
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8080',
      graphqlEndpoint: process.env.NUXT_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
      graphqlWsEndpoint: process.env.NUXT_GRAPHQL_WS_ENDPOINT || 'ws://localhost:8080/graphql',
      authBaseUrl: process.env.NUXT_AUTH_BASE_URL || 'http://localhost:8080',
      authRegisterUrl: process.env.NUXT_AUTH_REGISTER_URL || 'http://localhost:8080/oauth/register',
      authLoginUrl: process.env.NUXT_AUTH_LOGIN_URL || 'http://localhost:8080/oauth/login',
    }
  }
})