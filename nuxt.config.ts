import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  pages: true,
  devtools: { enabled: true },
  modules: ['@nuxtjs/ionic', '@pinia/nuxt'],
  ssr: false,
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  }
})