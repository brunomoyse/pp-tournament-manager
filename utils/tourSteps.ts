/**
 * Guided tour script. Each step lives on a real page and points at an element
 * tagged with `data-tour="<id>"`. Title/description i18n keys are derived from
 * the id: `tour.steps.<id>.title` / `tour.steps.<id>.desc`.
 *
 * The same `data-tour` value may exist on several elements (e.g. sidebar nav
 * on desktop AND the bottom tab bar on mobile); the engine picks whichever
 * one is actually visible in the viewport.
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
  { id: 'dashboard-stats', route: '/', padding: 12 },
  { id: 'nav', route: '/', placement: 'right', padding: 8 },
  { id: 'create-tournament', route: '/tournaments' },
  { id: 'add-players', route: '/players' },
  { id: 'templates', route: '/templates', padding: 10 },
  { id: 'reports', route: '/reports', padding: 10 },
  { id: 'setup-guide', route: '/', padding: 12 },
]
