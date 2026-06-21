import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  // NOTE: tests require `.nuxt/tsconfig.*` to exist (root tsconfig.json
  // references them). Generate it first with `DISABLE_CODEGEN=true nuxt prepare`
  // - this is run by the `postinstall` hook, so a plain `npm ci` is enough in CI.
  test: {
    globals: true,
    environment: 'happy-dom',
    // Only run unit/component tests. The Playwright specs under `e2e/` are run
    // separately via `npm run test:e2e` and must not be picked up by vitest.
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.nuxt/**',
        'dist/**',
        '*.config.*',
        'coverage/**',
        'graphql/**',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
