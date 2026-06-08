// Tournament status label via i18n
export const getTournamentStatusLabel = (status: string, t: (key: string) => string): string => {
  const key = `tournamentStatuses.${status}`
  return t(key) || status
}

// Semantic badge variant for <PpBadge> (preferred). The legacy
// getTournamentStatusClass below stays until every page is migrated.
export type StatusVariant = 'gold' | 'success' | 'info' | 'warning' | 'danger' | 'neutral'

export const getTournamentStatusVariant = (status: string): StatusVariant => {
  switch (status) {
    case 'IN_PROGRESS':
    case 'FINAL_TABLE':
      return 'gold'
    case 'COMPLETED':
    case 'FINISHED':
      return 'success'
    case 'NOT_STARTED':
    case 'SCHEDULED':
    case 'UPCOMING':
    case 'REGISTRATION_OPEN':
      return 'info'
    case 'CANCELLED':
      return 'danger'
    case 'BREAK':
    case 'PAUSED':
      return 'warning'
    case 'DRAFT':
      return 'neutral'
    default:
      return 'neutral'
  }
}

// Tournament status colors for consistent styling
export const getTournamentStatusClass = (status: string): string => {
  switch (status) {
    case 'IN_PROGRESS':
    case 'FINAL_TABLE':
      return 'pp-status--gold'
    case 'COMPLETED':
    case 'FINISHED':
      return 'pp-status--green'
    case 'NOT_STARTED':
    case 'SCHEDULED':
    case 'UPCOMING':
    case 'REGISTRATION_OPEN':
      return 'pp-status--purple'
    case 'CANCELLED':
      return 'pp-status--red'
    case 'BREAK':
    case 'PAUSED':
      return 'pp-status--orange'
    case 'DRAFT':
      return 'pp-status--gray'
    default:
      return 'pp-status--default'
  }
}
