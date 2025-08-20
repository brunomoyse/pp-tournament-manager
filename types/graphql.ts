// GraphQL Types and Interfaces

export interface GraphQLResponse<T = any> {
  data?: T
  errors?: GraphQLError[]
}

export interface GraphQLError {
  message: string
  locations?: Array<{
    line: number
    column: number
  }>
  path?: Array<string | number>
  extensions?: Record<string, any>
}

export interface GraphQLRequest {
  query: string
  variables?: Record<string, any>
  operationName?: string
}

export interface GraphQLClientOptions {
  endpoint: string
  headers?: Record<string, string>
  cache?: boolean
  timeout?: number
}

export interface UseGraphQLOptions {
  cache?: boolean
  immediate?: boolean
  timeout?: number
  retry?: number
  retryDelay?: number
}

export interface GraphQLQueryResult<T = any> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<GraphQLError[] | null>
  refetch: () => Promise<void>
  refresh: () => Promise<void>
}

export interface GraphQLMutationResult<T = any> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<GraphQLError[] | null>
  mutate: (variables?: Record<string, any>) => Promise<T | null>
}

// Domain-specific types
export interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  phone: string
  is_active: boolean
  role: string
  created_at: string
  updated_at: string
  display_preference: 'real_name' | 'username' | 'both'
  display_name?: string
}

export interface Club {
  id: string
  name: string
  city: string
  // Extended fields that might be needed
  location?: string
  members?: number
  events?: number
  logo?: string
}

export interface Tournament {
  id: string
  title: string
  description?: string
  clubId: string
  startTime: string
  endTime?: string
  buyInCents: number
  seatCap: number
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' // ENUM for tabs
  liveStatus: string | null // Can be 'NOT_STARTED', 'REGISTRATION_OPEN', 'LATE_REGISTRATION', 'IN_PROGRESS', 'BREAK', 'FINAL_TABLE', 'FINISHED', etc.
  createdAt: string
  updatedAt: string
  club: Club
  // Extended fields that might be needed for display
  name?: string
  type?: string
  buyIn?: string
  maxPlayers?: number
  registeredPlayers?: number
  prizePool?: number
  structure?: string
}

export interface TournamentLiveState {
  id: string
  currentLevel: number
  playersRemaining: number
  breakUntil?: string
  currentSmallBlind: number
  currentBigBlind: number
  currentAnte?: number
  levelStartedAt: string
  levelDurationMinutes: number
  createdAt: string
  updatedAt: string
}

export interface TournamentComplete {
  tournament: Tournament
  liveState?: TournamentLiveState
  totalRegistered: number
}

export interface TournamentPlayer {
  registration: {
    id: string
    status: string
    registrationTime: string
    notes?: string
  }
  user: {
    id: string
    firstName: string
    lastName: string
    username: string
    email: string
    isActive: boolean
  }
}

export interface SeatAssignment {
  id: string
  seatNumber: number
  stackSize?: number
  isCurrent: boolean
  assignedAt: string
  unassignedAt?: string
  notes?: string
}

export interface TableSeat {
  assignment: SeatAssignment
  player: {
    id: string
    firstName: string
    lastName: string
    username: string
  }
}

export interface TournamentTable {
  id: string
  tableNumber: number
  maxSeats: number
  isActive: boolean
  tableName: string
  createdAt: string
}

export interface TournamentSeatingChart {
  tables: {
    table: TournamentTable
    seats: TableSeat[]
  }[]
  unassignedPlayers: {
    id: string
    firstName: string
    lastName: string
    username: string
  }[]
}

export interface TournamentRegistration {
  id: string
  tournament: Tournament
  user: User
  registeredAt: string
  status: 'confirmed' | 'pending' | 'cancelled'
  seatNumber?: number
  tableNumber?: number
}

export interface LeaderboardEntry {
  id: string
  user: User
  rank: number
  points: number
  totalWins: number
  totalWinnings: number
  tournamentsPlayed: number
  winRate: number
  trend?: 'up' | 'down' | 'stable'
  club: Club
}

export interface TournamentResult {
  id: string
  tournament: Tournament
  user: User
  position: number
  totalPlayers: number
  winnings: number
  roi?: number
  playedAt: string
}