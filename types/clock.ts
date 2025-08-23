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

export type ClockStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';