import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/useAuthStore'
import { useClubStore } from '~/stores/useClubStore'
import { Role } from '~/types/enums'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have null user and token initially', () => {
      const store = useAuthStore()
      expect(store.currentUser).toBeNull()
      expect(store.authToken).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should not be loading initially', () => {
      const store = useAuthStore()
      expect(store.isLoading).toBe(false)
    })

    it('should have no error initially', () => {
      const store = useAuthStore()
      expect(store.error).toBeNull()
    })
  })

  describe('computed properties', () => {
    it('should compute isAuthenticated correctly', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)

      store.authToken = 'test-token'
      expect(store.isAuthenticated).toBe(false)

      store.currentUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
      }
      expect(store.isAuthenticated).toBe(true)
    })

    it('should compute hasClub correctly', () => {
      const store = useAuthStore()
      expect(store.hasClub).toBe(false)

      // The hasClub getter checks for (currentUser as any)?.club not managedClub
      store.currentUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        club: {
          id: 'club-1',
          name: 'Test Club',
        },
      } as any
      expect(store.hasClub).toBe(true)
    })
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const store = useAuthStore()
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: Role.PLAYER,
      }

      vi.mocked(GqlLoginUser).mockResolvedValue({
        loginUser: {
          token: 'test-token',
          user: mockUser,
        },
      })

      const result = await store.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toEqual(mockUser)
      expect(store.currentUser).toEqual(mockUser)
      expect(store.authToken).toBe('test-token')
      expect(store.isAuthenticated).toBe(true)
    })

    it('should set user managed club in club store on login', async () => {
      const store = useAuthStore()
      const clubStore = useClubStore()
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        role: Role.MANAGER,
        managedClub: {
          id: 'club-1',
          name: 'Test Club',
        },
      }

      vi.mocked(GqlLoginUser).mockResolvedValue({
        loginUser: {
          token: 'test-token',
          user: mockUser,
        },
      })

      await store.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(clubStore.selectedClub).toEqual({
        id: 'club-1',
        name: 'Test Club',
        city: '',
      })
    })

    it('should handle login error', async () => {
      const store = useAuthStore()
      const error = new Error('Invalid credentials')

      vi.mocked(GqlLoginUser).mockRejectedValue(error)

      await expect(
        store.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials')

      expect(store.error).toEqual(error)
      expect(store.isAuthenticated).toBe(false)
    })

    it('should set loading state during login', async () => {
      const store = useAuthStore()

      vi.mocked(GqlLoginUser).mockImplementation(async () => {
        expect(store.isLoading).toBe(true)
        return {
          loginUser: {
            token: 'test-token',
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'Test',
              role: Role.PLAYER,
            },
          },
        }
      })

      await store.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(store.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear auth state on logout', async () => {
      const store = useAuthStore()
      store.authToken = 'test-token'
      store.currentUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
      }

      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await store.logout()

      expect(store.authToken).toBeNull()
      expect(store.currentUser).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should clear club store on logout', async () => {
      const store = useAuthStore()
      const clubStore = useClubStore()

      clubStore.setSelectedClub({
        id: 'club-1',
        name: 'Test Club',
        city: 'Test City',
      })

      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await store.logout()

      expect(clubStore.selectedClub).toBeNull()
    })

    it('should clear localStorage on logout', async () => {
      const store = useAuthStore()
      store.authToken = 'test-token'
      store.currentUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
      }

      // Wait for persistence to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await store.logout()

      // Wait for localStorage clear to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(localStorage.getItem('auth-backup')).toBeNull()
    })

    it('should logout even if server request fails', async () => {
      const store = useAuthStore()
      store.authToken = 'test-token'
      store.currentUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
      }

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await store.logout()

      expect(store.authToken).toBeNull()
      expect(store.currentUser).toBeNull()
    })
  })

  describe('fetchMe', () => {
    it('should fetch current user data', async () => {
      const store = useAuthStore()
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.PLAYER,
      }

      store.authToken = 'test-token'

      vi.mocked(GqlGetMe).mockResolvedValue({
        me: mockUser,
      })

      const result = await store.fetchMe()

      expect(result).toEqual(mockUser)
      expect(store.currentUser).toEqual(mockUser)
    })

    it('should return null if no token', async () => {
      const store = useAuthStore()
      const result = await store.fetchMe()

      expect(result).toBeNull()
      expect(GqlGetMe).not.toHaveBeenCalled()
    })

    it('should clear auth state if fetch fails', async () => {
      const store = useAuthStore()
      store.authToken = 'invalid-token'
      store.currentUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
      }

      vi.mocked(GqlGetMe).mockRejectedValue(new Error('Unauthorized'))

      const result = await store.fetchMe()

      expect(result).toBeNull()
      expect(store.authToken).toBeNull()
      expect(store.currentUser).toBeNull()
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const store = useAuthStore()
      store.authToken = 'old-token'
      store.currentUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'new-token' }),
      })

      const newToken = await store.refreshAccessToken()

      expect(newToken).toBe('new-token')
      expect(store.authToken).toBe('new-token')
    })

    it('should return null if refresh fails', async () => {
      const store = useAuthStore()

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      })

      const result = await store.refreshAccessToken()

      expect(result).toBeNull()
    })

    it('should handle network errors', async () => {
      const store = useAuthStore()

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await store.refreshAccessToken()

      expect(result).toBeNull()
    })
  })
})
