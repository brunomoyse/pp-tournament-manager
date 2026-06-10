export type Role = 'ADMIN' | 'MANAGER' | 'PLAYER'

export interface User {
  id: string
  email: string
  username?: string | null
  firstName: string
  lastName?: string | null
  phone?: string | null
  isActive: boolean
  role: Role
  managedClub?: Club | null
}

export interface Club {
  id: string
  name: string
  city?: string | null
}

// Club roster entry. The canonical club player identity, distinct from an app
// `User`: it has no email. `appUserId`/`isClaimed` are set once an app user
// claims the entry. Account-less players live here with `isClaimed = false`.
export interface ClubPlayer {
  id: string
  clubId: string
  displayName: string
  appUserId?: string | null
  isClaimed: boolean
  isActive: boolean
}

// Notification types
export type NotificationType =
  | 'TOURNAMENT_STARTING_SOON'
  | 'REGISTRATION_CONFIRMED'
  | 'TOURNAMENT_STATUS_CHANGED'

export interface UserNotification {
  id: string
  userId: string
  notificationType: NotificationType
  title: string
  message: string
  tournamentId?: string | null
  createdAt: string
}

// Auth types
export interface AuthPayload {
  token: string
  user: User
}

export interface UserRegistrationInput {
  email: string
  password: string
  firstName: string
  lastName: string
  username?: string
}

export interface UserLoginInput {
  email: string
  password: string
}

export interface OAuthUrlResponse {
  authUrl: string
  csrfToken: string
}

export interface OAuthCallbackInput {
  provider: string
  code: string
  csrfToken: string
}

// Player management types
export interface CreatePlayerInput {
  email: string
  firstName: string
  lastName?: string
  username?: string
  phone?: string
  clubId: string
}

export interface UpdatePlayerInput {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  username?: string
  phone?: string
}

export interface PlayerFormData {
  email: string
  firstName: string
  lastName: string
  username: string
  phone: string
}
