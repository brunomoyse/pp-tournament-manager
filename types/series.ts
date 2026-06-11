// Multi-day series / flights.

export interface SeriesFlight {
  id: string
  title: string
  flightLabel?: string | null
  isFinalDay: boolean
  status: string
  liveStatus: string
  startTime: string
}

export interface FlightQualification {
  clubPlayerId: string
  fromTournamentId: string
  chipCount: number
  isBest: boolean
}

export interface TournamentSeries {
  id: string
  clubId: string
  title: string
  bestStackForward: boolean
  flights: SeriesFlight[]
  qualifications: FlightQualification[]
}

export interface SeriesListItem {
  id: string
  title: string
  bestStackForward: boolean
  createdAt: string
}

/** A flight definition while building the create-series wizard. */
export interface FlightDraft {
  label: string
  startTime: string
}
