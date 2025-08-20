import { computed, type Ref } from 'vue'
import { useGraphQLQuery, useGraphQLMutation, useGraphQLSubscription } from './useGraphQL'
import type {
  User,
  Club,
  Tournament,
  TournamentRegistration,
  LeaderboardEntry,
  TournamentResult,
} from '~/types/graphql'

// GraphQL Queries
const TOURNAMENTS_QUERY = `
  query ListTournaments($clubId: UUID, $from: DateTime, $to: DateTime, $limit: Int, $offset: Int) {
    tournaments(clubId: $clubId, from: $from, to: $to, limit: $limit, offset: $offset) {
      id
      title
      description
      status
      liveStatus
      startTime
      endTime
      buyInCents
      seatCap
      createdAt
      updatedAt
      club {
        id
        name
        city
      }
    }
  }
`

const TOURNAMENT_COMPLETE_QUERY = `
  query GetCompleteTournamentData($tournamentId: UUID!) {
    # Complete tournament data in one call
    tournamentComplete(tournamentId: $tournamentId) {
      # Static tournament data
      tournament {
        id
        title
        description
        clubId
        startTime
        endTime
        buyInCents
        seatCap
        status
        liveStatus
        createdAt
        updatedAt
        club {
          id
          name
          city
        }
      }

      # Live state (clock, blinds, level info)
      liveState {
        id
        currentLevel
        playersRemaining
        breakUntil
        currentSmallBlind
        currentBigBlind
        currentAnte
        levelStartedAt
        levelDurationMinutes
        createdAt
        updatedAt
      }

      # Registration count
      totalRegistered
    }

    # All registered players
    tournamentPlayers(tournamentId: $tournamentId) {
      registration {
        id
        status
        registrationTime
        notes
      }
      user {
        id
        firstName
        lastName
        username
        email
        isActive
      }
    }

    # Live seating chart
    tournamentSeatingChart(tournamentId: $tournamentId) {
      tables {
        table {
          id
          tableNumber
          maxSeats
          isActive
          tableName
          createdAt
        }
        seats {
          assignment {
            id
            seatNumber
            stackSize
            isCurrent
            assignedAt
            unassignedAt
            notes
          }
          player {
            id
            firstName
            lastName
            username
          }
        }
      }
      unassignedPlayers {
        id
        firstName
        lastName
        username
      }
    }
  }
`

const ME_QUERY = `
  query GetMe {
    me {
      id
      email
      username
      first_name
      last_name
      phone
      is_active
      role
      created_at
      updated_at
      display_preference
      display_name
    }
  }
`

const USER_PROFILE_QUERY = `
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      email
      username
      first_name
      last_name
      phone
      is_active
      role
      created_at
      updated_at
    }
  }
`

const USER_REGISTRATIONS_QUERY = `
  query GetUserRegistrations($userId: ID!, $status: String) {
    userRegistrations(userId: $userId, status: $status) {
      id
      registeredAt
      status
      seatNumber
      tableNumber
      tournament {
        id
        name
        type
        status
        buyIn
        startTime
        club {
          id
          name
        }
      }
    }
  }
`

const LEADERBOARD_QUERY = `
  query GetLeaderboard($clubId: ID, $period: String, $limit: Int) {
    leaderboard(clubId: $clubId, period: $period, limit: $limit) {
      id
      rank
      points
      totalWins
      totalWinnings
      tournamentsPlayed
      winRate
      trend
      user {
        id
        email
        username
        first_name
        last_name
        phone
        is_active
        role
        created_at
        updated_at
      }
      club {
        id
        name
      }
    }
  }
`

const TOURNAMENT_HISTORY_QUERY = `
  query GetTournamentHistory($userId: ID!, $clubId: ID, $limit: Int, $offset: Int) {
    tournamentHistory(userId: $userId, clubId: $clubId, limit: $limit, offset: $offset) {
      id
      position
      totalPlayers
      winnings
      roi
      playedAt
      tournament {
        id
        name
        type
        buyIn
        startTime
        club {
          id
          name
        }
      }
    }
  }
`

const CLUBS_QUERY = `
  query GetClubs {
    clubs {
      id
      name
      city
    }
  }
`

const USERS_SEARCH_QUERY = `
  query SearchUsers($query: String!, $clubId: ID, $limit: Int) {
    searchUsers(query: $query, clubId: $clubId, limit: $limit) {
      id
      email
      username
      first_name
      last_name
      phone
      is_active
      role
      created_at
      updated_at
    }
  }
`

const LEADERBOARD_QUERY_NEW = `
  query GetLeaderboard($period: LeaderboardPeriod!, $limit: Int, $clubId: UUID) {
    leaderboard(period: $period, limit: $limit, clubId: $clubId) {
      entries {
        rank
        user {
          username
          firstName
          lastName
          email
          isActive
        }
        totalTournaments
        totalBuyIns
        totalWinnings
        netProfit
        itmPercentage
        roiPercentage
        points
        firstPlaces
        finalTables
        averageFinish
        totalItm
      }
      totalPlayers
      period
    }
  }
`

// GraphQL Subscriptions
const TOURNAMENT_CLOCK_SUBSCRIPTION = `
  subscription TournamentClockUpdates($tournamentId: UUID!) {
    tournamentClockUpdates(tournamentId: $tournamentId) {
      tournamentId
      status
      currentLevel
      timeRemainingSeconds
      smallBlind
      bigBlind
      ante
      isBreak
      nextLevelPreview {
        levelNumber
        smallBlind
        bigBlind
        ante
        durationMinutes
      }
    }
  }
`

// GraphQL Mutations
const REGISTER_TOURNAMENT_MUTATION = `
  mutation RegisterTournament($tournamentId: ID!) {
    registerTournament(tournamentId: $tournamentId) {
      id
      status
      registeredAt
      seatNumber
      tableNumber
    }
  }
`

const CANCEL_REGISTRATION_MUTATION = `
  mutation CancelRegistration($registrationId: ID!) {
    cancelRegistration(registrationId: $registrationId) {
      id
      status
    }
  }
`

const FOLLOW_USER_MUTATION = `
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      id
      followedAt
    }
  }
`

const UNFOLLOW_USER_MUTATION = `
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      success
    }
  }
`

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      username
      first_name
      last_name
      phone
      is_active
      role
      created_at
      updated_at
      display_preference
      display_name
    }
  }
`

// Composables for specific API operations

export function useTournaments(variables?: Ref<{ clubId?: string; from?: string; to?: string; limit?: number; offset?: number }>) {
  return useGraphQLQuery<{ tournaments: Tournament[] }>(
    TOURNAMENTS_QUERY,
    variables,
    { cache: true }
  )
}

export function useTournament(tournamentId: Ref<string> | string) {
  const variables = computed(() => ({ 
    tournamentId: isRef(tournamentId) ? tournamentId.value : tournamentId 
  }))
  
  return useGraphQLQuery<{
    tournamentComplete: {
      tournament: {
        id: string
        title: string
        description: string
        clubId: string
        startTime: string
        endTime: string
        buyInCents: number
        seatCap: number
        liveStatus: string
        createdAt: string
        updatedAt: string
        club: {
          id: string
          name: string
          city: string
        }
      }
      liveState: {
        id: string
        currentLevel: number
        playersRemaining: number
        breakUntil: string | null
        currentSmallBlind: number
        currentBigBlind: number
        currentAnte: number | null
        levelStartedAt: string
        levelDurationMinutes: number
        createdAt: string
        updatedAt: string
      } | null
      totalRegistered: number
    }
    tournamentPlayers: {
      registration: {
        id: string
        status: string
        registrationTime: string
        notes: string | null
      }
      user: {
        id: string
        firstName: string
        lastName: string
        username: string
        email: string
        isActive: boolean
      }
    }[]
    tournamentSeatingChart: {
      tables: {
        table: {
          id: string
          tableNumber: number
          maxSeats: number
          isActive: boolean
          tableName: string
          createdAt: string
        }
        seats: {
          assignment: {
            id: string
            seatNumber: number
            stackSize: number | null
            isCurrent: boolean
            assignedAt: string
            unassignedAt: string | null
            notes: string | null
          }
          player: {
            id: string
            firstName: string
            lastName: string
            username: string
          }
        }[]
      }[]
      unassignedPlayers: {
        id: string
        firstName: string
        lastName: string
        username: string
      }[]
    }
  }>(
    TOURNAMENT_COMPLETE_QUERY,
    variables,
    { cache: true }
  )
}

export function useMe() {
  return useGraphQLQuery<{ me: User }>(
    ME_QUERY,
    undefined,
    { cache: true }
  )
}

export function useUserProfile(userId: Ref<string> | string) {
  const variables = computed(() => ({ 
    id: isRef(userId) ? userId.value : userId 
  }))
  
  return useGraphQLQuery<{ user: User }>(
    USER_PROFILE_QUERY,
    variables,
    { cache: true }
  )
}

export function useUserRegistrations(variables?: Ref<{ userId: string; status?: string }>) {
  return useGraphQLQuery<{ userRegistrations: TournamentRegistration[] }>(
    USER_REGISTRATIONS_QUERY,
    variables,
    { cache: true }
  )
}

export function useLeaderboard(variables?: Ref<{ clubId?: string; period?: string; limit?: number }>) {
  return useGraphQLQuery<{ leaderboard: LeaderboardEntry[] }>(
    LEADERBOARD_QUERY,
    variables,
    { cache: true }
  )
}

export function useTournamentHistory(variables?: Ref<{ userId: string; clubId?: string; limit?: number; offset?: number }>) {
  return useGraphQLQuery<{ tournamentHistory: TournamentResult[] }>(
    TOURNAMENT_HISTORY_QUERY,
    variables,
    { cache: true }
  )
}

export function useClubs(variables?: Ref<{ limit?: number }>) {
  const { data, loading, error, refetch, refresh } = useGraphQLQuery<{ clubs: Club[] }>(
    CLUBS_QUERY,
    variables,
    { cache: true, immediate: true }
  )
  
  return {
    clubs: computed(() => data.value?.clubs || []),
    loading,
    error,
    refetch,
    refresh,
  }
}

export function useUsersSearch(variables: Ref<{ query: string; clubId?: string; limit?: number }>) {
  return useGraphQLQuery<{ searchUsers: User[] }>(
    USERS_SEARCH_QUERY,
    variables,
    { 
      cache: false, // Don't cache search results
      immediate: false // Only search when explicitly called
    }
  )
}

export function useLeaderboardNew(variables?: Ref<{ period?: string; limit?: number; clubId?: string }>) {
  return useGraphQLQuery<{
    leaderboard: {
      entries: {
        rank: number
        user: {
          username: string
          firstName: string
          lastName: string
          email: string
          isActive: boolean
        }
        totalTournaments: number
        totalBuyIns: number
        totalWinnings: number
        netProfit: number
        itmPercentage: number
        roiPercentage: number
        points: number
        firstPlaces: number
        finalTables: number
        averageFinish: number
        totalItm: number
      }[]
      totalPlayers: number
      period: string
    }
  }>(
    LEADERBOARD_QUERY_NEW,
    variables,
    { cache: true }
  )
}

// Mutation composables

export function useTournamentRegistration() {
  const registerMutation = useGraphQLMutation<{ registerTournament: TournamentRegistration }>(
    REGISTER_TOURNAMENT_MUTATION
  )
  
  const cancelMutation = useGraphQLMutation<{ cancelRegistration: TournamentRegistration }>(
    CANCEL_REGISTRATION_MUTATION
  )

  const register = (tournamentId: string) => registerMutation.mutate({ tournamentId })
  const cancel = (registrationId: string) => cancelMutation.mutate({ registrationId })

  return {
    register,
    cancel,
    registering: registerMutation.loading,
    cancelling: cancelMutation.loading,
    error: computed(() => registerMutation.error.value || cancelMutation.error.value),
  }
}

export function useUserFollow() {
  const followMutation = useGraphQLMutation(FOLLOW_USER_MUTATION)
  const unfollowMutation = useGraphQLMutation(UNFOLLOW_USER_MUTATION)

  const follow = (userId: string) => followMutation.mutate({ userId })
  const unfollow = (userId: string) => unfollowMutation.mutate({ userId })

  return {
    follow,
    unfollow,
    loading: computed(() => followMutation.loading.value || unfollowMutation.loading.value),
    error: computed(() => followMutation.error.value || unfollowMutation.error.value),
  }
}

export function useProfileUpdate() {
  return useGraphQLMutation<{ updateProfile: User }>(UPDATE_PROFILE_MUTATION)
}

// Utility composables for common patterns

export function useCurrentUser() {
  const { getAuthToken } = useGraphQLClient()
  const token = getAuthToken()
  
  if (!token) {
    return {
      data: ref(null),
      loading: ref(false),
      error: ref(null),
      refetch: () => Promise.resolve(),
      refresh: () => Promise.resolve(),
    }
  }

  // Use the me query instead of extracting user ID from token
  const result = useMe()
  
  return {
    data: computed(() => result.data.value?.me || null),
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
    refresh: result.refresh,
  }
}

export function usePaginatedTournaments(clubId?: Ref<string | undefined>, dateRange?: Ref<{ from?: string; to?: string }>) {
  const page = ref(1)
  const limit = 20
  
  const variables = computed(() => ({
    clubId: clubId?.value,
    from: dateRange?.value?.from,
    to: dateRange?.value?.to,
    offset: (page.value - 1) * limit,
    limit,
  }))
  
  const result = useTournaments(variables)
  
  const nextPage = () => {
    page.value++
  }
  
  const prevPage = () => {
    if (page.value > 1) {
      page.value--
    }
  }
  
  const hasNextPage = computed(() => {
    return result.data.value?.tournaments.length === limit
  })
  
  const hasPrevPage = computed(() => page.value > 1)
  
  return {
    ...result,
    page,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  }
}

// Tournament Clock Subscription
export function useTournamentClock(tournamentId: Ref<string> | string) {
  const variables = computed(() => {
    const id = isRef(tournamentId) ? tournamentId.value : tournamentId
    return { tournamentId: id }
  })
  
  return useGraphQLSubscription<{
    tournamentClockUpdates: {
      tournamentId: string
      status: string
      currentLevel: number
      timeRemainingSeconds: number
      smallBlind: number
      bigBlind: number
      ante: number | null
      isBreak: boolean
      nextLevelPreview: {
        levelNumber: number
        smallBlind: number
        bigBlind: number
        ante: number | null
        durationMinutes: number
      }
    }
  }>(
    TOURNAMENT_CLOCK_SUBSCRIPTION,
    variables,
    { immediate: true }
  )
}