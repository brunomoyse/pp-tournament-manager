import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useClubStore } from './useClubStore'
// Use a flexible user type to match GraphQL response
interface AuthUser {
  id: string
  email: string
  username?: string | null
  firstName: string
  lastName?: string | null
  role?: any
  [key: string]: any // Allow additional properties
}

export interface LoginCredentials {
  email: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<AuthUser | null>(null)
  const authToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)
  const hasClub = computed(() => !!(currentUser.value as any)?.club)
  const isVerified = computed(() => (currentUser.value as any)?.verified ?? false)
  const isVip = computed(() => ((currentUser.value as any)?.vipLevel ?? 0) > 0)

  // Internal helper functions
  const clearAuthState = () => {
    authToken.value = null
    currentUser.value = null
    
    if (import.meta.client) {
      // Clear token from GraphQL client
      useGqlToken(null)
      // Clear backup localStorage
      localStorage.removeItem('auth-backup')
    }
  }

  const storeAuthState = (token: string, user: AuthUser) => {
    authToken.value = token
    currentUser.value = user
    
    if (import.meta.client) {
      // Set token for GraphQL client
      useGqlToken(token)
      
      // Force save to localStorage as backup (in case Pinia persistence fails)
      localStorage.setItem('auth-backup', JSON.stringify({
        authToken: token,
        currentUser: user
      }))
    }
  }

  // Actions
  const login = async (credentials: LoginCredentials): Promise<AuthUser | null> => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await GqlLoginUser({ input: credentials })
      
      if (result?.loginUser?.token && result?.loginUser?.user) {
        const { token, user } = result.loginUser
        storeAuthState(token, user)
        
        // Store managedClub in club store if available
        if (user.managedClub) {
          const clubStore = useClubStore()
          clubStore.setSelectedClub({
            id: user.managedClub.id,
            name: user.managedClub.name,
            city: ''
          })
        }
        
        return user
      }
      
      return null
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true
    error.value = null
    
    try {
      // @TODO: Call logout mutation
    } catch (err) {
      // Continue with local logout even if server request fails
    } finally {
      clearAuthState()
      isLoading.value = false
    }
  }

  const fetchMe = async (): Promise<AuthUser | null> => {
    if (!authToken.value) return null
    
    try {
      // @TODO: Implement GqlMe query when available
      return currentUser.value
    } catch (err) {
      return null
    }
  }

  const initialize = () => {
    if (import.meta.client) {
      // Always try to restore from backup localStorage if we don't have data
      if (!authToken.value || !currentUser.value) {
        const backup = localStorage.getItem('auth-backup')
        if (backup) {
          try {
            const parsed = JSON.parse(backup)
            if (parsed.authToken && parsed.currentUser) {
              authToken.value = parsed.authToken
              currentUser.value = parsed.currentUser
              useGqlToken(parsed.authToken)
            }
          } catch (e) {
            // Silently ignore restore errors
          }
        }
      } else {
        useGqlToken(authToken.value)
      }
    }
  }

  return {
    // State
    currentUser: readonly(currentUser),
    authToken: readonly(authToken),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Getters
    isAuthenticated,
    hasClub,
    isVerified,
    isVip,
    
    // Actions
    login,
    logout,
    fetchMe,
    initialize,
  }
}, {
  persist: true
})