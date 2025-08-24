import type { Club } from './user'
import type {TournamentClock} from "~/types/clock";

export interface Tournament {
    id: string;
    buyInCents: number;
    clubId?: string;
    createdAt?: any;
    description?: string | null;
    endTime?: any | null;
    liveStatus: TournamentLiveStatus;
    seatCap?: number | null;
    startTime: any;
    status: TournamentStatus;
    title: string;
    updatedAt?: any;

    clock?: TournamentClock | null;
    club?: Club;
    registrations: TournamentRegistration[];
    structure: TournamentStructure[];
}

export type TournamentStatus = 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'
export type TournamentLiveStatus = 'NOT_STARTED' | 'REGISTRATION_OPEN' | 'LATE_REGISTRATION' | 'IN_PROGRESS' | 'BREAK' | 'FINAL_TABLE' | 'FINISHED'

export interface TournamentRegistration {
    id: string;
    notes?: string | null;
    registrationTime: any;
    status: RegistrationStatus,
    userId: string;
}

export type RegistrationStatus = 'REGISTERED' | 'CHECKED_IN' | 'SEATED' | 'BUSTED' | 'WAITLISTED' | 'CANCELLED' | 'NO_SHOW'

export interface TournamentResult {
    id: string,
    createdAt: string,
    finalPosition: number,
    notes?: string,
    points: number,
    prizeCents: number,
    tournamentId: string,
    userId: string,
}

export interface TournamentStructure {
    id: string;
    ante: number;
    bigBlind: number;
    breakDurationMinutes?: number | null;
    durationMinutes: number;
    isBreak: boolean;
    levelNumber: number;
    smallBlind: number;
    tournamentId: string;
}