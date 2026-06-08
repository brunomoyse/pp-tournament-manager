// Registration status label via i18n
export const getRegistrationStatusLabel = (status: string, t: (key: string) => string): string => {
  const key = `registrationStatuses.${status}`
  return t(key) || status
}

// Semantic badge variant for <PpBadge> (preferred). The legacy
// getRegistrationStatusClass below stays until every page is migrated.
import type { StatusVariant } from '~/utils/tournamentStatus'

export const getRegistrationStatusVariant = (status: string): StatusVariant => {
  switch (status) {
    case 'SEATED':
      return 'gold'
    case 'CHECKED_IN':
      return 'info'
    case 'REGISTERED':
    case 'LATE_REGISTRATION':
      return 'success'
    case 'WAITLISTED':
      return 'warning'
    case 'BUSTED':
    case 'ELIMINATED':
    case 'DISQUALIFIED':
      return 'danger'
    case 'CANCELLED':
    case 'WITHDREW':
    case 'NO_SHOW':
      return 'neutral'
    default:
      return 'neutral'
  }
}

// Registration status colors for consistent styling
export const getRegistrationStatusClass = (status: string): string => {
  switch (status) {
    case 'SEATED':
      return 'pp-status--gold'
    case 'CHECKED_IN':
      return 'pp-status--purple'
    case 'REGISTERED':
    case 'LATE_REGISTRATION':
      return 'pp-status--green'
    case 'WAITLISTED':
      return 'pp-status--amber'
    case 'BUSTED':
    case 'ELIMINATED':
    case 'DISQUALIFIED':
      return 'pp-status--red'
    case 'CANCELLED':
      return 'pp-status--gray'
    case 'WITHDREW':
    case 'NO_SHOW':
      return 'pp-status--gray'
    default:
      return 'pp-status--default'
  }
}
