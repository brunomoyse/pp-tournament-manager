import { useAuthStore } from '~/stores/useAuthStore'
import { useClubStore } from '~/stores/useClubStore'

export default defineNuxtPlugin(async () => {
  // Initialize stores on app start. Pinia persistence has already hydrated the
  // store synchronously by the time this runs, so we can initialize directly.
  const authStore = useAuthStore()
  const clubStore = useClubStore()

  clubStore.initializeFromStorage()

  // Await so the session is fully validated (token checked / refreshed, or
  // expired -> redirect) BEFORE the first route's auth middleware runs. This is
  // what makes a hard reload on a dead session land on /login instead of a
  // half-broken protected page.
  await authStore.initialize()
})
