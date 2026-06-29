import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import authMiddleware from '~/middleware/auth'
import { useAuthStore } from '~/stores/useAuthStore'

// `defineNuxtRouteMiddleware` is stubbed in tests/setup.ts as `(fn) => fn`, so the
// default export is the bare guard. `navigateTo` is a global vi.fn() from setup.
const navigateTo = (globalThis as { navigateTo: ReturnType<typeof vi.fn> }).navigateTo
const runGuard = (to: unknown = { fullPath: '/dashboard' }) =>
  (authMiddleware as (...a: unknown[]) => unknown)(to, undefined)

describe('auth route guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('redirects an unauthenticated visitor to /login', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)

    runGuard()

    expect(navigateTo).toHaveBeenCalledTimes(1)
    // The guard preserves the intended destination so login can bounce back.
    expect(navigateTo).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/dashboard' },
    })
  })

  it('lets an authenticated visitor through without redirecting', () => {
    const store = useAuthStore()
    store.authToken = 'tok'
    store.currentUser = { id: '1', email: 'a@b.io', firstName: 'A' } as never
    expect(store.isAuthenticated).toBe(true)

    runGuard()

    expect(navigateTo).not.toHaveBeenCalled()
  })
})
