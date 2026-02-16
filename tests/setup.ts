import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import * as vueExports from 'vue'

// Re-export Vue composables as globals
Object.assign(global, vueExports)

// Mock Nuxt auto-imports
global.defineNuxtRouteMiddleware = vi.fn((fn) => fn)
global.definePageMeta = vi.fn()
global.navigateTo = vi.fn()
global.useRuntimeConfig = vi.fn(() => ({
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
global.useGqlToken = vi.fn()
global.GqlLoginUser = vi.fn()
global.GqlGetMe = vi.fn()
global.GqlGetTournaments = vi.fn()
global.GqlGetTournament = vi.fn()

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
  value: vi.fn().mockImplementation((query) => ({
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
