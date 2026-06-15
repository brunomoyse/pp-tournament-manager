import type { RecurrenceFrequency, TournamentStructure } from '~/types/tournament'

export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === undefined || seconds === null || seconds < 0) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const formatBlinds = (structure: TournamentStructure | null | undefined): string => {
  if (!structure) return '0/0'
  return `${structure.smallBlind}/${structure.bigBlind}`
}

export const formatPrice = (cents: number | null | undefined, locale: string = 'fr-BE'): string => {
  if (cents) {
    const euros = cents / 100
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(euros)
  }
  return '0,00€'
}

// Add n weeks to a date (preserves time of day).
export const addWeeks = (date: Date, n: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

// Add n months to a date, clamping overflowing days (e.g. Jan 31 + 1 month → Feb 28),
// matching the backend's chrono `checked_add_months` behaviour.
export const addMonths = (date: Date, n: number): Date => {
  const d = new Date(date)
  const targetDay = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(targetDay, daysInTargetMonth))
  return d
}

// How many occurrences a recurrence spec produces: the start plus one per
// interval up to (and including) `end`. Display-only; the backend is the source
// of truth. Returns 0 for an invalid range.
export const countOccurrences = (
  start: Date,
  end: Date,
  frequency: RecurrenceFrequency,
): number => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0
  let count = 0
  let current = new Date(start)
  // Cap mirrors the backend MAX_OCCURRENCES safety ceiling.
  while (current <= end && count < 104) {
    count++
    current = frequency === 'WEEKLY' ? addWeeks(start, count) : addMonths(start, count)
  }
  return count
}
