// Tournament status label via i18n
export const getTournamentStatusLabel = (status: string, t: (key: string) => string): string => {
  const key = `tournamentStatuses.${status}`
  return t(key) || status
}

// Tournament status colors for consistent styling
export const getTournamentStatusClass = (status: string): string => {
  switch (status) {
    case 'IN_PROGRESS':
    case 'FINAL_TABLE':
      return 'bg-pp-accent-gold/20 text-pp-accent-gold border-pp-accent-gold/30'
    case 'COMPLETED':
    case 'FINISHED':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'NOT_STARTED':
    case 'SCHEDULED':
    case 'UPCOMING':
    case 'REGISTRATION_OPEN':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'BREAK':
    case 'PAUSED':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    case 'DRAFT':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    default:
      return 'bg-pp-border text-pp-text-primary border-pp-border'
  }
}
