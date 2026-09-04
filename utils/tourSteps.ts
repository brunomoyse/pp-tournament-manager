/**
 * Guided tour script. Each step lives on a real page and points at an element
 * tagged with `data-tour="<id>"`. Title/description i18n keys are derived from
 * the id: `tour.steps.<id>.title` / `tour.steps.<id>.desc`.
 *
 * Kept deliberately short: the tour exists to get a new club owner to their
 * first tournament, not to narrate the menu. Steps that spotlighted the
 * dashboard stats, the nav rail, templates and reports were dropped — a new
 * club's stats are all zero, the nav explains itself, every club is seeded with
 * default templates, and there is nothing to report on yet.
 */
export interface TourStep {
  /** Step id; doubles as the `data-tour` attribute value. */
  id: string
  /** Route the step lives on; the engine navigates there if needed. */
  route: string
  /** Preferred popover side; 'auto' tries bottom → top → right → left. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  /** Extra breathing room around the target, in px. */
  padding?: number
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'create-tournament', route: '/tournaments' },
  { id: 'add-players', route: '/players' },
  { id: 'team', route: '/team', padding: 10 },
  { id: 'setup-guide', route: '/', padding: 12 },
]
