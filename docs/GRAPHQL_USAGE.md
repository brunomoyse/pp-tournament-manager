# GraphQL Client Usage Guide

## Overview

This project includes a comprehensive GraphQL client with TypeScript support, automatic caching, error handling, and request deduplication. The client is built using Vue 3 composables and designed specifically for your poker tournament application.

## Setup

1. **Environment Configuration**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Update the GraphQL endpoint
   NUXT_GRAPHQL_ENDPOINT=https://your-api-endpoint.com/graphql
   ```

2. **Authentication**
   The client automatically includes JWT tokens from localStorage/sessionStorage in the Authorization header.

## Basic Usage

### 1. Simple Query

```vue
<script setup>
import { useTournaments } from '@/composables/usePokerAPI'

// Fetch all tournaments
const { data, loading, error, refetch } = useTournaments()

// Access the data
const tournaments = computed(() => data.value?.tournaments || [])
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error[0]?.message }}</div>
  <div v-else>
    <div v-for="tournament in tournaments" :key="tournament.id">
      {{ tournament.name }}
    </div>
  </div>
</template>
```

### 2. Query with Variables

```vue
<script setup>
import { ref, computed } from 'vue'
import { useTournaments } from '@/composables/usePokerAPI'

const selectedClubId = ref('club-123')
const status = ref('upcoming')

// Reactive variables
const variables = computed(() => ({
  clubId: selectedClubId.value,
  status: status.value,
  limit: 10
}))

const { data, loading, error, refresh } = useTournaments(variables)
</script>
```

### 3. Manual Query Execution

```vue
<script setup>
import { useGraphQLQuery } from '@/composables/useGraphQL'

const CUSTOM_QUERY = `
  query GetTournamentStats($clubId: ID!) {
    tournamentStats(clubId: $clubId) {
      totalTournaments
      totalPlayers
      totalPrizePool
    }
  }
`

const variables = ref({ clubId: 'club-123' })

const { data, loading, error, refetch } = useGraphQLQuery(
  CUSTOM_QUERY,
  variables,
  { 
    immediate: false, // Don't execute immediately
    cache: true 
  }
)

// Execute manually
const fetchStats = () => refetch()
</script>
```

### 4. Mutations

```vue
<script setup>
import { useTournamentRegistration } from '@/composables/usePokerAPI'

const { register, registering, error } = useTournamentRegistration()

const handleRegister = async (tournamentId) => {
  const result = await register(tournamentId)
  if (result) {
    console.log('Registered successfully:', result)
  }
}
</script>

<template>
  <IonButton 
    @click="handleRegister('tournament-123')"
    :disabled="registering"
  >
    {{ registering ? 'Registering...' : 'Register' }}
  </IonButton>
</template>
```

### 5. Pagination

```vue
<script setup>
import { usePaginatedTournaments } from '@/composables/usePokerAPI'

const clubId = ref('club-123')

const {
  data,
  loading,
  error,
  nextPage,
  prevPage,
  hasNextPage,
  hasPrevPage,
  page
} = usePaginatedTournaments(clubId)
</script>

<template>
  <div v-for="tournament in data?.tournaments" :key="tournament.id">
    {{ tournament.name }}
  </div>
  
  <IonButton @click="prevPage" :disabled="!hasPrevPage">
    Previous
  </IonButton>
  
  <span>Page {{ page }}</span>
  
  <IonButton @click="nextPage" :disabled="!hasNextPage">
    Next
  </IonButton>
</template>
```

## Advanced Features

### 1. Custom Error Handling

```vue
<script setup>
import { watch } from 'vue'
import { useTournaments } from '@/composables/usePokerAPI'

const { data, loading, error } = useTournaments()

watch(error, (newError) => {
  if (newError) {
    // Handle specific error types
    const errorMessage = newError[0]?.message
    
    if (errorMessage.includes('Unauthorized')) {
      // Redirect to login
      navigateTo('/login')
    } else if (errorMessage.includes('Network')) {
      // Show network error toast
      showToast('Network error. Please check your connection.')
    } else {
      // Generic error handling
      showToast('Something went wrong. Please try again.')
    }
  }
})
</script>
```

### 2. Cache Management

```vue
<script setup>
import { useGraphQLClient } from '@/composables/useGraphQL'

const { clearCache, setAuthToken } = useGraphQLClient()

const logout = () => {
  // Clear authentication
  setAuthToken(null)
  
  // Clear all cached data
  clearCache()
  
  // Redirect to login
  navigateTo('/login')
}

const refreshAllData = () => {
  // Clear cache to force fresh data
  clearCache()
  
  // Trigger refetch on active queries
  // (they will automatically refetch when cache is cleared)
}
</script>
```

### 3. Real-time Updates with Refresh

```vue
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useLeaderboard } from '@/composables/usePokerAPI'

const { data, loading, error, refresh } = useLeaderboard()

// Refresh every 30 seconds
let refreshInterval: NodeJS.Timeout

onMounted(() => {
  refreshInterval = setInterval(() => {
    refresh()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
```

### 4. Search with Debouncing

```vue
<script setup>
import { ref, watch } from 'vue'
import { useUsersSearch } from '@/composables/usePokerAPI'
import { debounce } from 'lodash-es'

const searchQuery = ref('')
const clubId = ref(null)

const variables = ref({
  query: '',
  clubId: null,
  limit: 20
})

const { data, loading, error, refetch } = useUsersSearch(variables)

// Debounced search
const debouncedSearch = debounce((query: string) => {
  variables.value.query = query
  if (query.trim()) {
    refetch()
  }
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

watch(clubId, (newClubId) => {
  variables.value.clubId = newClubId
  if (variables.value.query.trim()) {
    refetch()
  }
})
</script>
```

## Available Composables

### Query Composables
- `useTournaments(variables?)` - Fetch tournaments list
- `useTournament(tournamentId)` - Fetch single tournament details
- `useUserProfile(userId)` - Fetch user profile
- `useUserRegistrations(variables?)` - Fetch user's tournament registrations
- `useLeaderboard(variables?)` - Fetch leaderboard data
- `useTournamentHistory(variables?)` - Fetch tournament history
- `useClubs(variables?)` - Fetch clubs list
- `useUsersSearch(variables)` - Search users
- `useCurrentUser()` - Get current authenticated user
- `usePaginatedTournaments(clubId?)` - Paginated tournaments

### Mutation Composables
- `useTournamentRegistration()` - Register/cancel tournament registration
- `useUserFollow()` - Follow/unfollow users
- `useProfileUpdate()` - Update user profile

### Utility Composables
- `useGraphQLQuery(query, variables?, options?)` - Low-level query composable
- `useGraphQLMutation(mutation, options?)` - Low-level mutation composable
- `useGraphQLClient()` - Client utilities (cache, auth, etc.)

## TypeScript Support

All composables include full TypeScript support with proper types:

```typescript
import type { Tournament, User, Club } from '@/types/graphql'

const { data } = useTournaments()
// data.value?.tournaments is typed as Tournament[]

const tournament = computed(() => {
  return data.value?.tournaments.find(t => t.id === 'tournament-123')
})
// tournament is typed as Tournament | undefined
```

## Error Handling Best Practices

1. **Always handle errors in templates**
2. **Use specific error messages when possible**
3. **Provide retry mechanisms for failed requests**
4. **Clear cache when authentication changes**
5. **Use loading states for better UX**

## Performance Tips

1. **Use caching appropriately** - Enable for static data, disable for dynamic searches
2. **Implement pagination** for large datasets
3. **Use immediate: false** for queries that shouldn't run on mount
4. **Debounce search inputs** to avoid excessive API calls
5. **Clear cache periodically** or when data changes

## Environment Variables

```bash
# Required
NUXT_GRAPHQL_ENDPOINT=https://api.example.com/graphql

# Optional
NUXT_GRAPHQL_WS_ENDPOINT=wss://api.example.com/graphql
NUXT_API_KEY=your-api-key
NUXT_DEBUG_GRAPHQL=true
```