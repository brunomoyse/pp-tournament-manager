import { useAuthStore } from '~/stores/useAuthStore'
import { useClubStore } from '~/stores/useClubStore'

export default defineNuxtPlugin(() => {
  // Initialize stores on app start
  const authStore = useAuthStore()
  const clubStore = useClubStore()

  // Wait for next tick to ensure persistence has been restored
  nextTick(() => {
    authStore.initialize()
    clubStore.initializeFromStorage()
  })
})
