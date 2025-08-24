import type {TournamentStructure} from "~/types/tournament";

export interface TournamentClock {
    id: string;
    tournamentId: string;
    status: ClockStatus;
    currentLevel: number;
    timeRemainingSeconds?: number | null;
    levelStartedAt?: any | null;
    levelEndTime?: any | null;
    totalPauseDurationSeconds: number;
    autoAdvance: boolean;
    currentStructure?: TournamentStructure | null;
    nextStructure?: TournamentStructure | null;
}

export type ClockStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';