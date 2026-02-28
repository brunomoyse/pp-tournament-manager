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
  rememberMe?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<AuthUser | null>(null)
  const authToken = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Token refresh timer
  let refreshTimerId: ReturnType<typeof setTimeout> | null = null

  // Getters
  const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)
  const hasClub = computed(() => !!(currentUser.value as any)?.club)
  const isVerified = computed(() => (currentUser.value as any)?.verified ?? false)
  const isVip = computed(() => ((currentUser.value as any)?.vipLevel ?? 0) > 0)

  // Internal helper functions
  const clearAuthState = () => {
    authToken.value = null
    currentUser.value = null

    // Clear refresh timer
    if (refreshTimerId) {
      clearTimeout(refreshTimerId)
      refreshTimerId = null
    }

    if (import.meta.client) {
      // Clear token from GraphQL client
      useGqlToken(null)
      // Clear backup localStorage
      localStorage.removeItem('auth-backup')
    }
  }

  const setupTokenRefreshTimer = () => {
    // Clear any existing timer
    if (refreshTimerId) {
      clearTimeout(refreshTimerId)
      refreshTimerId = null
    }

    // Refresh 1 minute before expiry (access token = 15 min, refresh at 14 min)
    const REFRESH_INTERVAL_MS = 14 * 60 * 1000
    refreshTimerId = setTimeout(async () => {
      const newToken = await refreshAccessToken()
      if (newToken) {
        setupTokenRefreshTimer()
      }
    }, REFRESH_INTERVAL_MS)
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

      // Set up proactive token refresh
      setupTokenRefreshTimer()
    }
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const config = useRuntimeConfig()
      const baseUrl = config.public.authBaseUrl as string

      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const newToken = data.token

      if (newToken) {
        authToken.value = newToken

        if (import.meta.client) {
          useGqlToken(newToken)

          // Update backup localStorage
          localStorage.setItem('auth-backup', JSON.stringify({
            authToken: newToken,
            currentUser: currentUser.value
          }))
        }

        return newToken
      }

      return null
    } catch {
      return null
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
      const config = useRuntimeConfig()
      const baseUrl = config.public.authBaseUrl as string

      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      // Continue with local logout even if server request fails
    } finally {
      clearAuthState()
      // Also clear club store
      const clubStore = useClubStore()
      clubStore.clearSelectedClub()
      isLoading.value = false
    }
  }

  const fetchMe = async (): Promise<AuthUser | null> => {
    if (!authToken.value) return null

    isLoading.value = true
    try {
      const result = await GqlGetMe()

      if (result?.me) {
        const user = result.me as AuthUser
        currentUser.value = user

        // Update club store if user has a managed club
        if (user.managedClub) {
          const clubStore = useClubStore()
          clubStore.setSelectedClub({
            id: user.managedClub.id,
            name: user.managedClub.name,
            city: user.managedClub.city || ''
          })
        }

        return user
      }

      return null
    } catch (err) {
      // Token might be expired or invalid
      console.error('Failed to fetch user:', err)
      clearAuthState()
      return null
    } finally {
      isLoading.value = false
    }
  }

  const initialize = async () => {
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

      // If we have a token, validate it by fetching user data
      if (authToken.value) {
        const user = await fetchMe()
        if (!user) {
          // Token might be expired, try refreshing
          const newToken = await refreshAccessToken()
          if (newToken) {
            // Refresh succeeded, fetch user again
            await fetchMe()
            setupTokenRefreshTimer()
          } else {
            // Refresh failed, clear auth state
            clearAuthState()
          }
        } else {
          // Token is valid, set up refresh timer
          setupTokenRefreshTimer()
        }
      }
    }
  }

  return {
    // State (not readonly - required for Pinia persistence plugin)
    currentUser,
    authToken,
    isLoading,
    error,

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
    refreshAccessToken,
  }
}, {
  persist: {
    pick: ['currentUser', 'authToken']
  }
})
