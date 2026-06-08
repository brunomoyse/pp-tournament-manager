# pp-tournament-manager → pp-landing design alignment

**Design read:** redesign-preserve of an internal admin/manager app (Nuxt 4 + Ionic Vue + Tailwind v4), aligning it to **pp-landing's dark-premium gold language**. The goal is component consistency, shape/motion discipline, and shared primitives — NOT forcing marketing-page section patterns (bento heroes, etc.) onto admin screens.

**Key finding:** the two apps already share `design-tokens.css` (same `#18181a` bg, `#fee78a` gold, Inter / Space Grotesk / JetBrains Mono, `.pp-card` / `.pp-glass` / `.pp-grain`). The palette and fonts are already correct. The gap is **execution discipline** — the manager drifted into per-page `<style>` blocks, legacy `.pp-action-button` classes, mixed corner radii, 8 ad-hoc badge colors, and a translateY card-lift that the landing deliberately avoids.

---

## Gap analysis: landing vs. manager

| Dimension    | pp-landing (target)                                                                                                                                        | pp-tournament-manager (current)                                                                                                                 | Action                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Buttons      | `<Button>` component, `rounded-full` pill, gold shadow `0_8px_30px_-8px_rgba(254,231,138,0.5)`, 3 variants (primary/secondary/ghost), `focus-visible` ring | legacy `.pp-action-button` CSS classes, `rounded-xl` (12px), `filter: brightness(1.1)` hover, 5 color variants, no focus ring, no loading state | Build `PpButton.vue`                          |
| Cards        | `rounded-2xl` everywhere, border-color + radial gold spotlight on hover (no lift)                                                                          | `.pp-card` + global `translateY(-2px)` lift, plus bespoke `.tournament-card` (0.75rem), `.stat-card`, `.recent-section` (1.25rem) — 4+ radii    | Build `PpCard.vue`, lock radius               |
| Badges       | minimal mono chip: `font-mono text-xs text-pp-gold border border-pp-gold/30 bg-pp-gold/5 rounded-full`                                                     | 8 color variants on legacy `--pp-{green,red,blue…}` palette                                                                                     | Build `PpBadge.vue`, collapse to semantic set |
| Modals       | `.pp-glass` frosted backdrop, refined                                                                                                                      | `.pp-modal-*` CSS, flat `rgba(0,0,0,0.6)` backdrop, 5 width variants, repeated per modal                                                        | Build `PpModal.vue` (slots)                   |
| Forms        | label-above, focus ring, error states                                                                                                                      | `.pp-input`/`.pp-label` CSS, error state only on login                                                                                          | Build `PpField.vue`                           |
| Shape system | **pill buttons + 20px cards** (clear rule)                                                                                                                 | mixed: 12px buttons, 12/16/20px cards                                                                                                           | Adopt landing's shape lock                    |
| Motion       | magnetic CTAs, card spotlight, split-word hero, unified easing `[0.16,1,0.3,1]`                                                                            | motion primitives exist (`PpFadeUp`, `PpStagger`, `PpMagneticButton`) but applied unevenly                                                      | Apply primitives consistently                 |
| Nav          | sticky glass header, active underline (`layoutId`)                                                                                                         | hamburger-drawer sidebar on **all** sizes (even desktop)                                                                                        | Suggestion: persistent desktop rail           |
| Per-page CSS | none — utilities + components                                                                                                                              | large `<style scoped>` blocks duplicating card/row/button styling                                                                               | Migrate to primitives, shrink `main.css`      |

---

## Phase 1 — Foundations (shared UI primitives) — highest leverage

Create `components/ui/` and port the landing's component discipline. Every later phase consumes these.

- [x] **`PpButton.vue`** — ported `pp-landing/src/components/ui/Button.tsx`. ✅ pill, gold glow, focus ring, `:active` press, `loading` spinner, `block`, renders button/NuxtLink/`a`/`tag`. Variants: primary/secondary/ghost/danger/success/warning. (placed flat in `components/` to match the existing `Pp*` auto-import convention, not `components/ui/`.)
  - Variants: `primary` (gold bg + `text-pp-bg` + gold shadow), `secondary` (surface + border), `ghost`, `danger`. Sizes: `md` (h-10) / `lg` (h-12).
  - `rounded-full` pill (adopt landing's shape — this sets the SHAPE LOCK).
  - `focus-visible:outline-2 outline-pp-gold`, `:active` `scale-[0.98]`, `disabled:opacity-50`.
  - Add `loading` prop (inline spinner) and `icon` slot — covers the IonIcon-in-button pattern used app-wide.
  - Drop `filter: brightness(1.1)` hover → use `hover:bg-pp-gold-strong` like the landing.
- [x] **`PpCard.vue`** — wraps shared `.pp-card`. ✅ Props `interactive`, `padding` (`none|sm|md|lg`), `as`. Fixed `rounded-2xl`. Neutralizes the global `translateY(-2px)` lift; interactive cards get border-brighten + faint gold ring on hover (landing restraint), static cards don't move.
- [x] **`PpBadge.vue`** — ✅ semantic set `gold | success | info | warning | danger | neutral` (kept `warning` — break/paused/waitlisted/late are distinct from danger). Mono pill matching the landing chip; self-contained (no legacy `--pp-{color}` palette dependency). Added `getTournamentStatusVariant()` / `getRegistrationStatusVariant()` helpers **alongside** the legacy `*Class()` ones so unmigrated pages keep working.
- [ ] **`PpModal.vue`** — slot-based (`#header` / default / `#footer`), `.pp-glass` backdrop blur, `size` prop (`sm|md|lg|xl`). Migrate the 8 modals onto it. _(deferred — not needed for index.vue)_
- [ ] **`PpField.vue` / `PpInput.vue` / `PpSelect.vue`** — unify `.pp-input` / `.pp-label`, add `error` slot/prop everywhere (currently login-only). Label-above, error-below. _(deferred — not needed for index.vue)_
- [ ] **Spacing scale** — define a small rhythm scale (e.g. card padding `md=1.25rem`, section gap `1rem`/`1.5rem`) and replace ad-hoc `1rem`/`1.1rem`/`1.5rem` values. _(partly addressed via PpCard's padding scale)_

## Phase 2 — Surface-by-surface migration

For each: swap bespoke buttons/cards/rows/badges for the Phase-1 primitives, lock radius to the new system, ensure `PpSectionHeader` + `PpFadeUp`/`PpStagger` are present.

- [ ] **`pages/login.vue`** — already custom full-screen; align inputs/button to primitives, keep as the most "landing-like" screen (add `.pp-grain` orb backdrop).
- [x] **`pages/index.vue` (Dashboard)** — ✅ reference migration. All `.pp-action-button` → `PpButton`; 4 stat cards + recent panel → `PpCard`; count chip + row status → `PpBadge`; smart-status returns `variant` not a CSS class. Removed ~50 lines of dead `<style>` (`.stat-card`, `.recent-section`, `.tournament-count-badge`, `.view-all-button`). lint + format clean.
- [x] **`pages/tournaments.vue`** — ✅ create button → `PpButton`; `.tournament-card` grid → `PpCard interactive` (flex-column so footers align); status → `PpBadge`; softened search/filter focus ring. (search/filter inputs still bespoke — pending `PpField` in Phase 1 backlog.)
- [x] **`pages/tournament/[id]/index.vue`** + Overview/Clock/Players tab cards — ✅ (Phase 2a). Warning actions / QR / settings-edit → `PpButton`; settings status → `PpBadge`. `TournamentStatusCard` actions + confirm dialog → `PpButton` (built-in loading); stepper keeps class helper. `TournamentClockCard` confirm dialog → `PpButton`, clock control cluster left bespoke by design. `TournamentPlayersTable` toolbar + in-row pills → `PpButton sm`, badges → `PpBadge`, ellipsis → self-contained icon button.
  - [x] _Detail-tab pieces (2c):_ `TournamentSeatingManager` (header/empty buttons + 3 inline modals), `AssignTableModal`, `PlayerActionModal` (+ status → PpBadge); StatusCard/ClockCard confirm dialogs → PpModal.
- [x] **`pages/players.vue`**, **`pages/templates.vue`** + template cards, **`pages/reports.vue`** — ✅ (2b). Buttons → PpButton, players status pill → PpBadge, reports stat cards → PpCard.
- [x] **`PpModal.vue`** built (Phase 1 backlog) — slot-based, glass backdrop, Escape/scroll-lock, fade+scale. **All modals migrated (2c):** Player/Register/QRCheckin/TournamentQR/TournamentForm/AddEntry/EnterResults/PayoutTemplateForm/BlindStructureTemplateForm/Assign/PlayerAction/delete-confirms.
- [ ] **`pages/login.vue`** — still bespoke (custom submit button + inputs). Pending.
- [ ] _Optional polish:_ remaining bespoke info-cards (`TournamentStructureCard`, `TournamentEntryStatsCard`, `TournamentPlayersCard`, `TournamentPrizePool`, `TournamentResultsDisplay`, `TournamentActivityFeed`) still use local `.card` divs — could move to `PpCard` for full radius/shadow consistency. No legacy buttons/badges remain in them.

> **Legacy class status:** `.pp-action-button` / `.pp-status-badge` / hand-rolled `.pp-modal-*` are gone from the app **except** the deliberately-bespoke clock control cluster (`TournamentClockCard` 3 secondary buttons) and the status **stepper** (uses `getTournamentStatusClass` → `.pp-status--*` for coloured nodes, not a badge). Phase 4 can prune the now-dead `main.css` rules.

## Phase 3 — Motion & navigation polish — DEFERRED (needs the app running to verify)

- [ ] Apply `PpMagneticButton` to primary CTAs (create tournament, start clock, etc.).
- [ ] Spotlight-hover on interactive `PpCard`s; confirm unified easing `[0.16,1,0.3,1]` and `prefers-reduced-motion` fallbacks.
- [ ] **Persistent desktop rail** (≥1024px) instead of hamburger-drawer-everywhere.
  - ⚠️ **Gotcha:** the current drawer works as an overlay because Ionic renders `<ion-page>` as `position: absolute; inset: 0`. A `margin-left` push won't offset the content (it sits under the fixed rail). Needs the content region made a positioned containing context (or the ion-router-outlet offset) AND visual testing. Do with `npm run dev` + backend up.

> Held back deliberately: motion tuning and a layout change to the Ionic shell should be done with eyes on the running app, not blind. Everything above (structure/components/CSS) was safe to do statically and is verified by lint + format + grep.

## Phase 4 — Cleanup — DONE ✅ (`252b11f`)

- [x] Deleted legacy `.pp-action-button--primary/danger/success/warning` (+ hover), the whole `.pp-modal-*` system + `.pp-close-button`, `.pp-status-badge` base, `.pp-card-interactive`. Kept `.pp-action-button` base + `--secondary` (clock cluster), `.pp-status--*` (stepper), `.pp-input/.pp-label/.pp-select` (form modals). `main.css` 668 → 524 lines.
- [x] Legacy `--pp-{color}-*` palette KEPT — still consumed by `.pp-status--*` and component styles (clock, etc.).
- [x] Quality sweep: shape lock ✓ (pills + 2xl cards), color lock ✓ (one gold accent), button contrast ✓, **zero em-dashes** ✓ (incl. comments), no fabricated numbers.

## Review (2026-06-08)

Shipped on `main` in 9 commits (`e3784e8` → `31aaa1b`):

- **Primitives:** `PpButton`, `PpCard`, `PpBadge`, `PpModal` (flat in `components/`, auto-imported).
- **Every page + every modal + seating** migrated off the legacy `.pp-action-button` / `.pp-status-badge` / hand-rolled `.pp-modal-*`. Only intentional keeps remain: the bespoke clock control cluster and the status stepper's colour classes.
- `getTournamentStatusVariant` / `getRegistrationStatusVariant` added next to the legacy `*Class` helpers (stepper still uses the latter).
- `main.css` pruned of all now-dead rules.
- Verified throughout with `oxlint` + `oxfmt` (lefthook pre-commit) + grep for stale refs / tag balance / em-dashes. **Not** verified in a running browser (no backend here) — recommend a visual pass before Phase 3.

---

## Sequencing & effort

1. **Phase 1** is the unlock — ~5 primitive components, ~1 focused session. Do `PpButton` + `PpCard` + `PpBadge` first (covers ~80% of surface area).
2. **Phase 2** is mechanical once primitives exist; parallelizable per page.
3. **Phase 3/4** are polish + debt paydown.

**Recommendation:** start with `PpButton`, `PpCard`, `PpBadge`, then migrate `pages/index.vue` end-to-end as the reference implementation before sweeping the rest.

## Review

_(to be filled in after implementation)_
