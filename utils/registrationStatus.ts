// Registration status label via i18n
export const getRegistrationStatusLabel = (status: string, t: (key: string) => string): string => {
  const key = `registrationStatuses.${status}`
  return t(key) || status
}

// Registration status colors for consistent styling
export const getRegistrationStatusClass = (status: string): string => {
  switch (status) {
    case 'SEATED':
      return 'bg-pp-accent-gold/20 text-pp-accent-gold border-pp-accent-gold/30'
    case 'CHECKED_IN':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'REGISTERED':
    case 'LATE_REGISTRATION':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'WAITLISTED':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'BUSTED':
    case 'ELIMINATED':
    case 'DISQUALIFIED':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'AWAY':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'CANCELLED':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    case 'WITHDREW':
    case 'NO_SHOW':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    default:
      return 'bg-pp-border text-pp-text-primary border-pp-border'
  }
}
