// Configurable leaderboards / leagues.

export type PositionCurve = 'SQRT' | 'HARMONIC' | 'LINEAR'
export type MembershipMode = 'ALL_IN_PERIOD' | 'TAGGED'

export interface ScoringFormula {
  basePoints: number
  fieldMultiplier: number
  buyinMultiplier: number
  positionCurve: PositionCurve
  minPlayers: number
  cap: number
  countBestN?: number | null
}

export interface LeaderboardConfig {
  id: string
  clubId: string
  name: string
  formula: ScoringFormula
  membershipMode: MembershipMode
  periodStart?: string | null
  periodEnd?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface LeaderboardAdjustment {
  id: string
  configId: string
  clubPlayerId: string
  pointsDelta: number
  reason: string
  createdBy?: string | null
  createdAt: string
}

/** A blank formula seeded with the backend defaults (reproduces today's points). */
export const DEFAULT_FORMULA: ScoringFormula = {
  basePoints: 2,
  fieldMultiplier: 3,
  buyinMultiplier: 1,
  positionCurve: 'SQRT',
  minPlayers: 1,
  cap: 60,
  countBestN: null,
}
