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

export interface OnboardClubInput {
  firstName: string
  lastName: string
  email: string
  password: string
  clubName: string
  country: string
  /** GraphQL ClubPlan enum value: 'FREE' (Home Game, no VAT) or 'CLUB' (paid, VAT required). */
  plan?: 'FREE' | 'CLUB'
  address?: string
  city?: string
  postalCode?: string
  vatNumber?: string
}

/** Decode a JWT's `exp` claim (ms epoch). Returns null if unparseable. */
function decodeExpMs(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore(
  'auth',
  () => {
    // State
    const currentUser = ref<AuthUser | null>(null)
    const authToken = ref<string | null>(null)
    /** Login-time "remember me" choice; gates cross-session persistence. */
    const rememberMe = ref(false)
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    // Token refresh timer
    let refreshTimerId: ReturnType<typeof setTimeout> | null = null
    // Single-flight guard: concurrent 401s (or the refresh timer firing mid-
    // request) must share one in-flight refresh. Parallel rotations would
    // invalidate each other's refresh cookie and cascade into a forced sign-out.
    let refreshInFlight: Promise<string | null> | null = null

    // Getters
    const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)
    const hasClub = computed(() => !!(currentUser.value as any)?.club)
    const isVerified = computed(() => (currentUser.value as any)?.verified ?? false)
    const isVip = computed(() => ((currentUser.value as any)?.vipLevel ?? 0) > 0)

    // Internal helper functions
    const clearAuthState = () => {
      authToken.value = null
      currentUser.value = null
      rememberMe.value = false

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

        // localStorage survives browser restarts, so only keep the backup when
        // the user asked to be remembered; otherwise the session must end with
        // the browser (matching the session-scoped refresh cookie).
        if (rememberMe.value) {
          localStorage.setItem(
            'auth-backup',
            JSON.stringify({
              authToken: token,
              currentUser: user,
            }),
          )
        } else {
          localStorage.removeItem('auth-backup')
        }

        // Set up proactive token refresh
        setupTokenRefreshTimer()
      }
    }

    const refreshAccessToken = async (): Promise<string | null> => {
      if (refreshInFlight) return refreshInFlight
      refreshInFlight = (async (): Promise<string | null> => {
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

              // Update backup localStorage (remembered sessions only)
              if (rememberMe.value) {
                localStorage.setItem(
                  'auth-backup',
                  JSON.stringify({
                    authToken: newToken,
                    currentUser: currentUser.value,
                  }),
                )
              }
            }

            return newToken
          }

          return null
        } catch {
          return null
        } finally {
          refreshInFlight = null
        }
      })()
      return refreshInFlight
    }

    // Return a token guaranteed fresh for the next ~minute, refreshing in place
    // when it's within 60s of expiry. Called just-in-time before every HTTP
    // request (gql:auth:init hook) and every WS (re)connect (connectionParams),
    // so neither path ever leaves with an already-expired token even if the
    // proactive timer was suspended (backgrounded tab / asleep machine).
    const ensureFreshToken = async (): Promise<string | null> => {
      const token = authToken.value
      if (!token) return null
      const expMs = decodeExpMs(token)
      if (expMs !== null && expMs - Date.now() < 60_000) {
        const newToken = await refreshAccessToken()
        if (newToken) {
          setupTokenRefreshTimer()
          return newToken
        }
        // Refresh failed (offline / revoked). Hand back whatever we have; the
        // gql error handler signs out on the resulting hard 401.
        return authToken.value
      }
      return token
    }

    // Actions
    const login = async (credentials: LoginCredentials): Promise<AuthUser | null> => {
      isLoading.value = true
      error.value = null

      try {
        const result = await GqlLoginUser({ input: credentials })

        if (result?.loginUser?.token && result?.loginUser?.user) {
          const { token, user } = result.loginUser
          rememberMe.value = credentials.rememberMe ?? false
          storeAuthState(token, user)

          // Store managedClub in club store if available
          if (user.managedClub) {
            const clubStore = useClubStore()
            clubStore.setSelectedClub({
              id: user.managedClub.id,
              name: user.managedClub.name,
              city: '',
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

    // Self-serve onboarding: create the owner account + club, then log straight
    // in with the returned JWT. Mirrors login()'s token/club plumbing.
    const register = async (input: OnboardClubInput): Promise<AuthUser | null> => {
      isLoading.value = true
      error.value = null

      try {
        const result = await GqlOnboardClub({ input })

        if (result?.onboardClub?.token && result?.onboardClub?.user) {
          const { token, user } = result.onboardClub
          // A fresh club owner shouldn't be logged out by closing the browser.
          rememberMe.value = true
          storeAuthState(token, user)

          if (user.managedClub) {
            const clubStore = useClubStore()
            clubStore.setSelectedClub({
              id: user.managedClub.id,
              name: user.managedClub.name,
              city: '',
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
      } catch {
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
              city: user.managedClub.city || '',
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
            } catch {
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
      rememberMe,
      isLoading,
      error,

      // Getters
      isAuthenticated,
      hasClub,
      isVerified,
      isVip,

      // Actions
      login,
      register,
      logout,
      fetchMe,
      initialize,
      refreshAccessToken,
      ensureFreshToken,
    }
  },
  {
    persist: {
      pick: ['currentUser', 'authToken', 'rememberMe'],
    },
  },
)
