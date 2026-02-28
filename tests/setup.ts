import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import * as vueExports from 'vue'

// Re-export Vue composables as globals
Object.assign(global, vueExports)

// Mock Nuxt auto-imports
;(global as any).defineNuxtRouteMiddleware = vi.fn((fn: any) => fn)
;(global as any).definePageMeta = vi.fn()
;(global as any).navigateTo = vi.fn()
;(global as any).useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:8080',
    graphqlEndpoint: 'http://localhost:8080/graphql',
    graphqlWsEndpoint: 'ws://localhost:8080/graphql',
    authBaseUrl: 'http://localhost:8080',
    authRegisterUrl: 'http://localhost:8080/oauth/register',
    authLoginUrl: 'http://localhost:8080/oauth/login',
  },
}))

// Stub Ionic Vue components
config.global.stubs = {
  IonHeader: true,
  IonToolbar: true,
  IonTitle: true,
  IonButtons: true,
  IonButton: true,
  IonNote: true,
  IonSelect: true,
  IonSelectOption: true,
  IonModal: true,
  IonContent: true,
  IonIcon: true,
  IonPage: true,
  IonList: true,
  IonItem: true,
}

// Mock GraphQL client
;(global as any).useGqlToken = vi.fn()
;(global as any).GqlLoginUser = vi.fn()
;(global as any).GqlGetMe = vi.fn()
;(global as any).GqlGetTournaments = vi.fn()
;(global as any).GqlGetTournament = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
