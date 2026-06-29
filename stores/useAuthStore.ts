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

/** Cross-tab auth messages exchanged over the `pp-auth` BroadcastChannel. */
type AuthMessage =
  | { kind: 'auth'; token: string; user: AuthUser | null }
  | { kind: 'logout' }
  | { kind: 'request' }

const AUTH_BACKUP_KEY = 'auth-backup'

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
    /** Login-time "remember me" choice; gates cross-session (localStorage) persistence. */
    const rememberMe = ref(false)
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    // Token refresh timer
    let refreshTimerId: ReturnType<typeof setTimeout> | null = null
    // In-tab single-flight guard: concurrent 401s (or the refresh timer firing
    // mid-request) share one in-flight refresh. Cross-tab serialization is
    // handled separately by the Web Locks API in refreshAccessToken().
    let refreshInFlight: Promise<string | null> | null = null
    // Cross-tab channel: propagates a freshly refreshed access token to sibling
    // tabs and broadcasts logout, so tabs never independently rotate the refresh
    // cookie (which would trip the backend's token-theft family revocation).
    let authChannel: BroadcastChannel | null = null

    // Getters
    const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)
    const hasClub = computed(() => !!(currentUser.value as any)?.club)
    const isVerified = computed(() => (currentUser.value as any)?.verified ?? false)
    const isVip = computed(() => ((currentUser.value as any)?.vipLevel ?? 0) > 0)

    // --- Persistence helpers ---------------------------------------------------

    // The Pinia plugin persists state to sessionStorage (survives a reload but
    // ends with the tab/browser). Remembered sessions additionally keep a
    // localStorage backup so they survive a full restart.
    const writeBackup = (token: string) => {
      if (!import.meta.client) return
      localStorage.setItem(
        AUTH_BACKUP_KEY,
        JSON.stringify({ authToken: token, currentUser: currentUser.value }),
      )
    }

    // --- Internal helpers ------------------------------------------------------

    const clearAuthState = () => {
      authToken.value = null
      currentUser.value = null
      rememberMe.value = false

      if (refreshTimerId) {
        clearTimeout(refreshTimerId)
        refreshTimerId = null
      }

      if (import.meta.client) {
        useGqlToken(null)
        localStorage.removeItem(AUTH_BACKUP_KEY)
      }
    }

    const setupTokenRefreshTimer = () => {
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

    const broadcastAuth = () => {
      if (authChannel && authToken.value) {
        authChannel.postMessage({ kind: 'auth', token: authToken.value, user: currentUser.value })
      }
    }

    const broadcastLogout = () => {
      authChannel?.postMessage({ kind: 'logout' })
    }

    // Adopt a token pushed by a sibling tab. No network, no re-broadcast: just
    // wire the new access token into this tab and reset the proactive timer.
    const adoptToken = (token: string, user?: AuthUser | null) => {
      if (!token) return
      authToken.value = token
      if (user) currentUser.value = user
      if (import.meta.client) {
        useGqlToken(token)
        if (rememberMe.value) writeBackup(token)
        setupTokenRefreshTimer()
      }
    }

    const storeAuthState = (token: string, user: AuthUser) => {
      authToken.value = token
      currentUser.value = user

      if (import.meta.client) {
        useGqlToken(token)
        // localStorage survives browser restarts, so only keep the backup when
        // the user asked to be remembered; otherwise the session lives in
        // sessionStorage and ends with the browser.
        if (rememberMe.value) {
          writeBackup(token)
        } else {
          localStorage.removeItem(AUTH_BACKUP_KEY)
        }
        setupTokenRefreshTimer()
        broadcastAuth()
      }
    }

    // Send the user to /login. `withReturn` appends the current path so the
    // login page can bounce back after re-authentication.
    const redirectToLogin = (withReturn: boolean) => {
      if (!import.meta.client) return
      const current = window.location.pathname + window.location.search
      if (current.startsWith('/login')) return
      navigateTo({
        path: '/login',
        query: withReturn && current ? { redirect: current } : undefined,
      })
    }

    // The session is no longer valid (refresh token gone/revoked, hard 401).
    // Clear everything, tell other tabs, and route to login. This is the single
    // place that turns an invalid session into a clean redirect.
    const sessionExpired = () => {
      const wasAuthed = !!authToken.value
      clearAuthState()
      if (import.meta.client) {
        useClubStore().clearSelectedClub()
        if (wasAuthed) broadcastLogout()
        redirectToLogin(true)
      }
    }

    // Hit POST /auth/refresh, rotating the refresh cookie and returning a new
    // access token. Runs inside a process-wide Web Lock so two tabs never
    // present the same refresh cookie at once (concurrent rotation would revoke
    // the whole token family). Inside the lock we re-check freshness, since a
    // sibling may have just refreshed and broadcast a new token.
    const doRefresh = async (): Promise<string | null> => {
      const current = authToken.value
      if (current) {
        const expMs = decodeExpMs(current)
        if (expMs !== null && expMs - Date.now() > 60_000) {
          return current
        }
      }

      try {
        const config = useRuntimeConfig()
        const baseUrl = config.public.authBaseUrl as string
        const response = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (!response.ok) return null

        const data = await response.json()
        const newToken = data.token
        if (!newToken) return null

        authToken.value = newToken
        if (import.meta.client) {
          useGqlToken(newToken)
          if (rememberMe.value) writeBackup(newToken)
          broadcastAuth()
        }
        return newToken
      } catch {
        return null
      }
    }

    const refreshAccessToken = async (): Promise<string | null> => {
      if (refreshInFlight) return refreshInFlight
      refreshInFlight = (async () => {
        try {
          if (import.meta.client && navigator.locks?.request) {
            return await navigator.locks.request('pp-auth-refresh', doRefresh)
          }
          return await doRefresh()
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

    // Ask sibling tabs to share their current session, resolving as soon as one
    // replies (adoptToken sets authToken) or after a short timeout. Lets a newly
    // opened tab join a session-only (not remembered) login already live
    // elsewhere, instead of forcing a re-login per tab.
    const requestAuthFromOtherTabs = (timeoutMs: number): Promise<void> => {
      return new Promise((resolve) => {
        if (!authChannel) return resolve()
        authChannel.postMessage({ kind: 'request' })
        const start = Date.now()
        const interval = setInterval(() => {
          if (authToken.value || Date.now() - start > timeoutMs) {
            clearInterval(interval)
            resolve()
          }
        }, 25)
      })
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

    // User-initiated sign-out: revoke the refresh token family server-side, then
    // clear locally, tell other tabs, and land on a clean /login (no return).
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
        // Continue with local logout even if the server request fails
      } finally {
        const wasAuthed = !!authToken.value
        clearAuthState()
        useClubStore().clearSelectedClub()
        if (wasAuthed) broadcastLogout()
        isLoading.value = false
        redirectToLogin(false)
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
        // Token might be expired/invalid, or the request transiently failed.
        // Don't tear down state here - the caller (initialize / error handler)
        // decides whether to refresh or expire the session.
        console.error('Failed to fetch user:', err)
        return null
      } finally {
        isLoading.value = false
      }
    }

    const initialize = async () => {
      if (!import.meta.client) return

      // sessionStorage (Pinia) covers same-session reloads. If it was empty,
      // restore a remembered session from the localStorage backup.
      if (!authToken.value || !currentUser.value) {
        const backup = localStorage.getItem(AUTH_BACKUP_KEY)
        if (backup) {
          try {
            const parsed = JSON.parse(backup)
            if (parsed.authToken && parsed.currentUser) {
              authToken.value = parsed.authToken
              currentUser.value = parsed.currentUser
              // A backup only exists for remembered sessions.
              rememberMe.value = true
              useGqlToken(parsed.authToken)
            }
          } catch {
            // Silently ignore restore errors
          }
        }
      } else {
        useGqlToken(authToken.value)
      }

      // Still nothing? A sibling tab may hold a live (session-only) login.
      if (!authToken.value) {
        await requestAuthFromOtherTabs(250)
      }

      if (!authToken.value) return

      // Validate the restored token; refresh once if it has expired.
      const user = await fetchMe()
      if (user) {
        setupTokenRefreshTimer()
        return
      }

      const newToken = await refreshAccessToken()
      if (newToken) {
        await fetchMe()
        setupTokenRefreshTimer()
      } else {
        // Token dead and no refresh possible: clean redirect to login.
        sessionExpired()
      }
    }

    // Wire the cross-tab channel once, after all handlers above exist. The
    // sender never receives its own messages, so there's no echo loop.
    if (import.meta.client && typeof BroadcastChannel !== 'undefined') {
      authChannel = new BroadcastChannel('pp-auth')
      authChannel.addEventListener('message', (event: MessageEvent<AuthMessage>) => {
        const msg = event.data
        if (!msg) return
        if (msg.kind === 'auth') {
          adoptToken(msg.token, msg.user)
        } else if (msg.kind === 'logout') {
          // Another tab signed out or its session died: mirror it here.
          clearAuthState()
          useClubStore().clearSelectedClub()
          redirectToLogin(true)
        } else if (msg.kind === 'request') {
          // A newly opened tab wants the current session; share it if we have one.
          broadcastAuth()
        }
      })
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
      sessionExpired,
    }
  },
  {
    persist: {
      // Session-scoped: a reload keeps you signed in, closing the browser ends a
      // not-remembered session. Remembered sessions are additionally backed up
      // to localStorage (see writeBackup) and restored in initialize().
      storage: piniaPluginPersistedstate.sessionStorage(),
      pick: ['currentUser', 'authToken', 'rememberMe'],
    },
  },
)
