import { useAuthStore } from '~/stores/useAuthStore'

export default defineNuxtPlugin(() => {
  // Initialize auth store on app start
  const authStore = useAuthStore()
  
  // Wait for next tick to ensure persistence has been restored
  nextTick(() => {
    authStore.initialize()
  })
})