# Testing Infrastructure

This directory contains the test suite for the PocketPair Tournament Manager application.

## Stack

- **Vitest** 4.0.18 - Fast unit test framework
- **Vue Test Utils** 2.4.6 - Official testing utilities for Vue 3
- **Happy DOM** 20.6.1 - Lightweight DOM implementation
- **@vitest/coverage-v8** 4.0.18 - Code coverage reporting

## Running Tests

```bash
npm test              # Run tests in watch mode
npm test -- --run     # Run tests once
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

## Directory Structure

```
tests/
├── setup.ts                    # Global test setup and mocks
├── stores/                     # Store tests
│   └── useAuthStore.test.ts
├── components/                 # Component tests
│   └── TournamentHeader.test.ts
└── utils/                      # Test utilities
    └── graphql-mocks.ts        # GraphQL mock helpers
```

## Writing Tests

### Store Tests

Store tests use Pinia with a fresh instance for each test:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/useAuthStore'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should login successfully', async () => {
    const store = useAuthStore()
    // test implementation
  })
})
```

### Component Tests

Component tests use Vue Test Utils with Ionic components stubbed:

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '~/components/MyComponent.vue'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        // props here
      },
    })

    expect(wrapper.text()).toContain('Expected text')
  })
})
```

### GraphQL Mocks

Use the mock utilities for consistent test data:

```ts
import { createMockTournament, mockGraphQLQueries } from '~/tests/utils/graphql-mocks'

// In beforeEach or test
mockGraphQLQueries()

// Custom overrides
const tournament = createMockTournament({
  title: 'Custom Tournament',
  status: 'IN_PROGRESS',
})
```

## Mocked Globals

The `tests/setup.ts` file automatically mocks:

- **Nuxt composables**: `useRuntimeConfig`, `navigateTo`, `definePageMeta`, etc.
- **GraphQL client**: `useGqlToken`, `GqlLoginUser`, `GqlGetMe`, etc.
- **localStorage**: Full implementation with get/set/remove/clear
- **window.matchMedia**: For responsive design tests
- **Ionic Vue components**: All ion-* components are stubbed

## Coverage

Coverage reports are generated in the `coverage/` directory:

- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON report

Coverage excludes:
- node_modules
- .nuxt directory
- dist directory
- Config files
- GraphQL generated files

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Clear mocks**: Use `beforeEach` to reset state
3. **Test behavior, not implementation**: Focus on what the code does, not how
4. **Use descriptive test names**: "should login successfully" not "test 1"
5. **Test edge cases**: Invalid input, errors, loading states
6. **Keep tests fast**: Avoid unnecessary delays or async operations
7. **Mock external dependencies**: GraphQL, fetch, timers

## Common Patterns

### Testing async actions

```ts
it('should fetch user data', async () => {
  const store = useAuthStore()

  vi.mocked(GqlGetMe).mockResolvedValue({
    me: createMockUser(),
  })

  await store.fetchMe()

  expect(store.currentUser).not.toBeNull()
})
```

### Testing error handling

```ts
it('should handle errors', async () => {
  const store = useAuthStore()

  vi.mocked(GqlLoginUser).mockRejectedValue(
    new Error('Network error')
  )

  await expect(
    store.login({ email: 'test', password: 'test' })
  ).rejects.toThrow('Network error')
})
```

### Testing computed properties

```ts
it('should compute isAuthenticated', () => {
  const store = useAuthStore()

  expect(store.isAuthenticated).toBe(false)

  store.authToken = 'token'
  store.currentUser = createMockUser()

  expect(store.isAuthenticated).toBe(true)
})
```
