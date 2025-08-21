import { ref, computed, watch } from 'vue'
import { useGraphQLMutation, useGraphQLClient } from './useGraphQL'
import type { User } from '~/types/graphql'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
}

export interface AuthResponse {
  token: string
  user: User
}

// Authentication API endpoints
const AUTH_CONFIG = {
  baseUrl: process.env.NUXT_AUTH_BASE_URL || 'http://localhost:8080',
  registerUrl: process.env.NUXT_AUTH_REGISTER_URL || 'http://localhost:8080/oauth/register',
  loginUrl: process.env.NUXT_AUTH_LOGIN_URL || 'http://localhost:8080/oauth/login',
}

// GraphQL mutations for authentication
const LOGIN_MUTATION = `
  mutation LoginUser($input: UserLoginInput!) {
    loginUser(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
        username
        phone
        isActive
        role
      }
    }
  }
`

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        email
        avatar
        verified
        vipLevel
        memberSince
        club {
          id
          name
          location
        }
      }
    }
  }
`

const GOOGLE_AUTH_MUTATION = `
  mutation GoogleAuth($token: String!) {
    googleAuth(token: $token) {
      token
      user {
        id
        username
        email
        avatar
        verified
        vipLevel
        memberSince
        club {
          id
          name
          location
        }
      }
    }
  }
`

const LOGOUT_MUTATION = `
  mutation Logout {
    logout {
      success
    }
  }
`

// Global auth state
const currentUser = ref<User | null>(null)
const authToken = ref<string | null>(null)
const isAuthenticated = computed(() => !!authToken.value && !!currentUser.value)

// Initialize auth state from storage
function initializeAuthState() {
  if (process.client) {
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token')
    const userData = localStorage.getItem('user-data') || sessionStorage.getItem('user-data')
    
    if (token && userData) {
      try {
        authToken.value = token
        currentUser.value = JSON.parse(userData)
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
  
  if (process.client) {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user-data')
    sessionStorage.removeItem('auth-token')
    sessionStorage.removeItem('user-data')
  }
}

// Store auth state
function storeAuthState(token: string, user: User, rememberMe = false) {
  authToken.value = token
  currentUser.value = user
  
  if (process.client) {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem('auth-token', token)
    storage.setItem('user-data', JSON.stringify(user))
  }
}

export function useAuth() {
  const { setAuthToken, clearCache } = useGraphQLClient()
  
  // Mutations
  const loginMutation = useGraphQLMutation<{ loginUser: AuthResponse }>(LOGIN_MUTATION)
  const registerMutation = useGraphQLMutation<{ register: AuthResponse }>(REGISTER_MUTATION)
  const googleAuthMutation = useGraphQLMutation<{ googleAuth: AuthResponse }>(GOOGLE_AUTH_MUTATION)
  const logoutMutation = useGraphQLMutation<{ logout: { success: boolean } }>(LOGOUT_MUTATION)

  // Initialize auth state on first use
  if (process.client && !authToken.value) {
    initializeAuthState()
  }

  // Watch auth token changes and update GraphQL client
  watch(authToken, (newToken) => {
    setAuthToken(newToken)
  }, { immediate: true })

  // Login with email/password
  const login = async (credentials: LoginCredentials, rememberMe = false): Promise<User | null> => {
    try {
      // Try GraphQL first (primary method)
      try {
        const response = await loginMutation.mutate({ input: credentials })
        
        if (response?.loginUser) {
          const { token, user } = response.loginUser
          storeAuthState(token, user, rememberMe)
          return user
        }
      } catch (graphqlError) {
        console.warn('GraphQL login failed, trying REST API fallback:', graphqlError)
        
        // Fallback to REST API
        const formData = new URLSearchParams()
        formData.append('email', credentials.email)
        formData.append('password', credentials.password)
        
        const response = await $fetch<AuthResponse>(AUTH_CONFIG.loginUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        
        if (response?.token && response?.user) {
          storeAuthState(response.token, response.user, rememberMe)
          return response.user
        }
      }
      
      return null
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // Register new user
  const register = async (data: RegisterData): Promise<User | null> => {
    try {
      // Try REST API first
      try {
        const formData = new URLSearchParams()
        formData.append('username', data.username)
        formData.append('email', data.email)
        formData.append('password', data.password)
        
        const response = await $fetch<AuthResponse>(AUTH_CONFIG.registerUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        
        if (response?.token && response?.user) {
          storeAuthState(response.token, response.user, false) // Don't remember by default on registration
          return response.user
        }
      } catch (apiError) {
        console.warn('REST API registration failed, trying GraphQL fallback:', apiError)
        
        // Fallback to GraphQL
        const response = await registerMutation.mutate({ input: data })
        
        if (response?.register) {
          const { token, user } = response.register
          storeAuthState(token, user, false)
          return user
        }
      }
      
      return null
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  // Google OAuth login
  const loginWithGoogle = async (googleToken: string): Promise<User | null> => {
    try {
      const response = await googleAuthMutation.mutate({ token: googleToken })
      
      if (response?.googleAuth) {
        const { token, user } = response.googleAuth
        storeAuthState(token, user, false)
        return user
      }
      
      return null
    } catch (error) {
      console.error('Google login failed:', error)
      throw error
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutate()
    } catch (error) {
      console.error('Logout request failed:', error)
      // Continue with local logout even if server request fails
    } finally {
      clearAuthState()
      clearCache() // Clear GraphQL cache on logout
    }
  }

  // Check if user has specific permissions/features
  const hasClub = computed(() => !!currentUser.value?.club)
  const isVerified = computed(() => currentUser.value?.verified ?? false)
  const isVip = computed(() => (currentUser.value?.vipLevel ?? 0) > 0)

  // Loading states
  const isLoggingIn = computed(() => loginMutation.loading.value)
  const isRegistering = computed(() => registerMutation.loading.value)
  const isGoogleLogging = computed(() => googleAuthMutation.loading.value)
  const isLoggingOut = computed(() => logoutMutation.loading.value)
  const isLoading = computed(() => 
    isLoggingIn.value || isRegistering.value || isGoogleLogging.value || isLoggingOut.value
  )

  // Error states
  const loginError = computed(() => loginMutation.error.value)
  const registerError = computed(() => registerMutation.error.value)
  const googleAuthError = computed(() => googleAuthMutation.error.value)
  const authError = computed(() => 
    loginError.value || registerError.value || googleAuthError.value
  )

  return {
    // State
    currentUser: readonly(currentUser),
    isAuthenticated,
    hasClub,
    isVerified,
    isVip,
    
    // Actions
    login,
    register,
    loginWithGoogle,
    logout,
    
    // Loading states
    isLoading,
    isLoggingIn,
    isRegistering,
    isGoogleLogging,
    isLoggingOut,
    
    // Error states
    authError,
    loginError,
    registerError,
    googleAuthError,
  }
}

// Initialize auth state immediately when module loads
if (process.client) {
  initializeAuthState()
}