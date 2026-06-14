import { useThemeStore } from '~/stores/useThemeStore'

/**
 * Apply the persisted theme to <html> as early as possible on app start,
 * before first paint, so there is no flash of the default theme.
 */
export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore()
  themeStore.apply()
})
