export interface TournamentClock {
    id: string
    tournamentUd: string,
    status: ClockStatus,
    currentLevel: number,
    timeRemainingSeconds?: number,
    levelStartedAt?: string,
    levelEndTime?: string,
    totalPauseDurationSeconds: number,
    autoAdvance: boolean,
    currentStructure?: TournamentStructure,
    nextStructure?: TournamentStructure,
}

export interface TournamentStructure {
    id: string,
    tournament_id: string,
    levelNumber: number,
    smallBlind: number,
    bigBlind: number,
    ante: number,
    durationMinutes: number,
    isBreak: boolean,
    breakDurationMinutes?: number,
}

export type ClockStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';