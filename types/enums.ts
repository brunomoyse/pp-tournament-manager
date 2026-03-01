export const LeaderboardPeriod = {
  ALL_TIME: 'ALL_TIME',
  LAST_YEAR: 'LAST_YEAR',
  LAST_6_MONTHS: 'LAST_6_MONTHS',
  LAST_30_DAYS: 'LAST_30_DAYS',
  LAST_7_DAYS: 'LAST_7_DAYS',
} as const

export const TournamentLiveStatus = {
  NOT_STARTED: 'NOT_STARTED',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  LATE_REGISTRATION: 'LATE_REGISTRATION',
  IN_PROGRESS: 'IN_PROGRESS',
  BREAK: 'BREAK',
  FINAL_TABLE: 'FINAL_TABLE',
  FINISHED: 'FINISHED',
} as const

export const TournamentStatus = {
  UPCOMING: 'UPCOMING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const

export const EntryType = {
  INITIAL: 'INITIAL',
  REBUY: 'REBUY',
  RE_ENTRY: 'RE_ENTRY',
  ADDON: 'ADDON',
} as const

export const Role = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  PLAYER: 'PLAYER',
} as const
