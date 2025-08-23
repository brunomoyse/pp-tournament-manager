import type { Club } from './user'

export interface TournamentComplete {
    tournament: Tournament
    liveState?: TournamentLiveState
    totalRegistered: number
}

export interface Tournament {
    id: string
    title: string
    description: string
    startTime: string
    endTime: string
    buyInCents: number
    status: TournamentStatus
    liveStatus: TournamentLiveStatus

    club: Club
}

export type TournamentStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'
export type TournamentLiveStatus = 'NOT_STARTED' | 'REGISTRATION_OPEN' | 'LATE_REGISTRATION' | 'IN_PROGRESS' | 'BREAK' | 'FINAL_TABLE' | 'FINISHED'

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

export interface TournamentRegistration {
    id: string
    tournament_id: string
    user_id: string
    registration_time: string,
    status: string,
    notes?: string
}

export interface TournamentResult {
    id: string,
    tournamentId: string,
    userId: string,
    finalPosition: number,
    prizeCents: number,
    points: number,
    notes?: string,
    createdAt: string,
}

export interface TournamentStructure {
    id: string
    tournamentId: string
    levelNumber: number
    smallBlind: number
    bigBlind: number
    ante: number
    durationMinutes: number
    isBreak: boolean
    breakDurationMinutes?: number
}