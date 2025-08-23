import { ref, computed, watch } from 'vue'
import type { User } from '~/types/graphql'

export interface LoginCredentials {
  email: string
  password: string
}



// Global auth state
const currentUser = ref<User | null>(null)
const authToken = ref<string | null>(null)
const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)

// Initialize auth state from storage
function initializeAuthState() {
  if (import.meta.client) {
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')
    const userData = localStorage.getItem('user-data') || sessionStorage.getItem('user-data')
    
    if (token && userData) {
      try {
        authToken.value = token
        currentUser.value = JSON.parse(userData)
        // Set token for GraphQL client
        const { $gqlToken } = useNuxtApp()
        ;($gqlToken as any)?.(token)
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        clearAuthState()
      }
    }
  }
}

// Clear auth state
function clearAuthState() {
  authToken.value = null
  currentUser.value = null
  
  if (import.meta.client) {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
    sessionStorage.removeItem('auth-token')
    sessionStorage.removeItem('user-data')
    // Clear token from GraphQL client
    const { $gqlToken } = useNuxtApp()
    ;($gqlToken as any)?.(null)
  }
}

// Store auth state
function storeAuthState(token: string, user: User, rememberMe = false) {
  authToken.value = token
  currentUser.value = user
  
  if (import.meta.client) {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('auth-token', token)
    storage.setItem('user-data', JSON.stringify(user))
    // Set token for GraphQL client
    const { $gqlToken } = useNuxtApp()
    ;($gqlToken as any)?.(token)
  }
}

export function useAuth() {
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Initialize auth state on first use
  if (import.meta.client && !authToken.value) {
    initializeAuthState()
  }

  // Login with email/password - using GraphQL mutation
  const login = async (credentials: LoginCredentials, rememberMe = false): Promise<User | null> => {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await $fetch<any>('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          query: `
            mutation LoginUser($input: UserLoginInput!) {
              loginUser(input: $input) {
                token
                user {
                  id
                  email
                  username
                  firstName
                  lastName
                  role
                }
              }
            }
          `,
          variables: {
            input: {
              email: credentials.email,
              password: credentials.password
            }
          }
        }
      })
      
      if (result?.data?.loginUser?.token && result?.data?.loginUser?.user) {
        const { token, user } = result.data.loginUser
        storeAuthState(token, user, rememberMe)
        return user
      }
      
      return null
    } catch (err) {
      console.error('Login failed:', err)
      error.value = err as Error
      throw err
    } finally {
      isLoading.value = false
    }
  }


  // Logout using GraphQL mutation
  const logout = async (): Promise<void> => {
    isLoading.value = true
    error.value = null
    
    try {
      // Use the Gql function once it's generated
      await $fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken.value}`
        },
        body: {
          query: `
            mutation Logout {
              logout {
                success
              }
            }
          `
        }
      })
    } catch (err) {
      console.error('Logout request failed:', err)
      // Continue with local logout even if server request fails
    } finally {
      clearAuthState()
      isLoading.value = false
    }
  }

  // Fetch current user using GraphQL
  const fetchMe = async (): Promise<User | null> => {
    if (!authToken.value) return null
    
    try {
      const { data } = await useAsyncGql('GetMe')
      if ((data.value as any)?.me) {
        currentUser.value = (data.value as any).me
        return (data.value as any).me
      }
      return null
    } catch (err) {
      console.error('Failed to fetch user:', err)
      return null
    }
  }

  // Check if user has specific permissions/features  
  const hasClub = computed(() => !!(currentUser.value as any)?.club)
  const isVerified = computed(() => (currentUser.value as any)?.verified ?? false)
  const isVip = computed(() => ((currentUser.value as any)?.vipLevel ?? 0) > 0)

  return {
    // State
    currentUser: readonly(currentUser),
    isAuthenticated,
    hasClub,
    isVerified,
    isVip,
    
    // Actions
    login,
    logout,
    fetchMe,
    
    // Loading & Error states
    isLoading,
    error,
  }
}

// Initialize auth state immediately when module loads
if (import.meta.client) {
  initializeAuthState()
}