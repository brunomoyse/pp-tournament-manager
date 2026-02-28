// Registration status label via i18n
export const getRegistrationStatusLabel = (status: string, t: (key: string) => string): string => {
  const key = `registrationStatuses.${status}`
  return t(key) || status
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
    case 'AWAY':
      return 'pp-status--orange'
    case 'CANCELLED':
      return 'pp-status--gray'
    case 'WITHDREW':
    case 'NO_SHOW':
      return 'pp-status--gray'
    default:
      return 'pp-status--default'
  }
}
