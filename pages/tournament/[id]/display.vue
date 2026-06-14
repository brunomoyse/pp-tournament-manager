<template>
  <div class="tv-root" :class="{ 'tv-root--idle': cursorIdle }">
    <!-- Header: event context -->
    <header class="tv-header">
      <div class="tv-header__event">
        <h1 class="tv-title">{{ tournament?.title || '' }}</h1>
        <p v-if="tournament?.buyInCents" class="tv-subtitle">
          {{ t('display.buyIn') }} {{ formatPrice(tournament.buyInCents) }}
        </p>
      </div>
      <div class="tv-header__right">
        <span v-if="clockStatus === 'PAUSED'" class="tv-status tv-status--paused">
          {{ t('display.paused') }}
        </span>
        <span v-else-if="isLateReg" class="tv-status tv-status--latereg">
          {{ t('display.lateRegOpen') }}
        </span>
        <span class="tv-wallclock">{{ timeOfDay }}</span>
      </div>
    </header>

    <!-- Main: payouts rail / clock stage / live stats rail -->
    <main class="tv-main">
      <!-- Left rail: payouts -->
      <aside class="tv-rail tv-rail--left">
        <template v-if="payoutPositions.length">
          <p class="tv-rail__label">{{ t('display.payouts') }}</p>
          <ol class="tv-payouts">
            <li
              v-for="p in payoutPositions"
              :key="p.position"
              class="tv-payout"
              :class="{ 'tv-payout--first': p.position === 1 }"
            >
              <span class="tv-payout__pos">{{ p.position }}</span>
              <span class="tv-payout__amount">{{ formatPrice(p.amountCents) }}</span>
            </li>
          </ol>
        </template>
        <div v-if="prizePoolCents" class="tv-rail__block tv-rail__block--push">
          <p class="tv-rail__label">{{ t('display.prizePool') }}</p>
          <p class="tv-rail__value tv-rail__value--gold">{{ formatPrice(prizePoolCents) }}</p>
        </div>
      </aside>

      <!-- Center stage: level, timer, blinds -->
      <section class="tv-stage">
        <p class="tv-level">
          <template v-if="onBreak">{{ t('display.break') }}</template>
          <template v-else>{{ t('display.level') }} {{ currentLevelNumber }}</template>
        </p>

        <p
          class="tv-timer"
          :class="{
            'tv-timer--soon': isRunning && !onBreak && timeRemaining <= 180 && timeRemaining > 60,
            'tv-timer--warning': isRunning && timeRemaining <= 60,
          }"
        >
          {{ formattedTime }}
        </p>

        <div v-if="!onBreak" class="tv-blinds-row">
          <p class="tv-blinds">{{ formatBlinds(currentStructure) }}</p>
          <p v-if="currentStructure?.ante" class="tv-ante">
            {{ t('display.ante') }} {{ currentStructure.ante.toLocaleString(numberLocale) }}
          </p>
        </div>

        <p v-if="nextStructure" class="tv-next">
          <span class="tv-next__label">{{ t('display.next') }}</span>
          <template v-if="nextStructure.isBreak">
            {{ t('display.break') }}
            <template v-if="nextStructure.breakDurationMinutes">
              · {{ nextStructure.breakDurationMinutes }} min
            </template>
          </template>
          <template v-else>
            {{ formatBlinds(nextStructure) }}
            <template v-if="nextStructure.ante">
              · {{ t('display.ante') }} {{ nextStructure.ante.toLocaleString(numberLocale) }}
            </template>
            <template v-if="nextStructure.durationMinutes">
              · {{ nextStructure.durationMinutes }} min
            </template>
          </template>
        </p>
      </section>

      <!-- Right rail: live stats -->
      <aside class="tv-rail tv-rail--right">
        <div v-if="nextBreakSeconds !== null" class="tv-rail__block">
          <p class="tv-rail__label">{{ t('display.nextBreak') }}</p>
          <p class="tv-rail__value">{{ formatDuration(nextBreakSeconds) }}</p>
        </div>
        <div v-if="avgStack !== null" class="tv-rail__block">
          <p class="tv-rail__label">{{ t('display.avgStack') }}</p>
          <p class="tv-rail__value">
            {{ avgStack.toLocaleString(numberLocale) }}
            <span v-if="avgStackBB !== null" class="tv-rail__sub">{{ avgStackBB }} BB</span>
          </p>
        </div>
        <div v-if="playersRemaining !== null" class="tv-rail__block">
          <p class="tv-rail__label">{{ t('display.players') }}</p>
          <p class="tv-rail__value">
            {{ playersRemaining
            }}<span v-if="totalEntries" class="tv-rail__sub">/{{ totalEntries }}</span>
          </p>
        </div>
        <div v-if="totalEntries" class="tv-rail__block">
          <p class="tv-rail__label">{{ t('display.entries') }}</p>
          <p class="tv-rail__value">{{ totalEntries }}</p>
          <p v-if="rebuyAddonLine" class="tv-rail__detail">{{ rebuyAddonLine }}</p>
        </div>
        <div v-if="lateRegLine" class="tv-rail__block tv-rail__block--push">
          <p class="tv-rail__label tv-rail__label--latereg">{{ lateRegLine }}</p>
          <p v-if="lateRegSeconds !== null" class="tv-rail__value tv-rail__value--latereg">
            {{ formatDuration(lateRegSeconds) }}
          </p>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useGqlSubscription } from '~/composables/useGqlSubscription'
import { formatBlinds, formatPrice } from '~/utils'
import type { TournamentClock, TournamentStructure } from '~/types/clock'

// Full-screen TV display. Deliberately public: every query used here
// (tournament + structure, clock, payouts, entry stats) is unauthenticated,
// so the page can run all evening on a TV without a session.
definePageMeta({ layout: false, title: 'nav.tournaments' })

const { t, locale } = useI18n()
const route = useRoute()
const tournamentId = route.params.id as string

const numberLocale = computed(() => (locale.value === 'en' ? 'en-BE' : `${locale.value}-BE`))

// ── Data ───────────────────────────────────────────────────────────
const tournament = ref<any>(null)
const clock = ref<TournamentClock | null>(null)
const payout = ref<any>(null)
const entryStats = ref<any>(null)

const clockStatus = computed(() => clock.value?.status)
const isRunning = computed(() => clockStatus.value === 'RUNNING')
const currentStructure = computed<TournamentStructure | null>(
  () => (clock.value?.currentStructure as TournamentStructure) || null,
)
const nextStructure = computed<TournamentStructure | null>(
  () => (clock.value?.nextStructure as TournamentStructure) || null,
)
const onBreak = computed(() => !!currentStructure.value?.isBreak)
const currentLevelNumber = computed(
  () => currentStructure.value?.levelNumber ?? clock.value?.currentLevel ?? 1,
)
const isLateReg = computed(() => tournament.value?.liveStatus === 'LATE_REGISTRATION')
const prizePoolCents = computed(() => payout.value?.totalPrizePool ?? 0)
const payoutPositions = computed(
  () =>
    (payout.value?.positions || []).slice(0, 6) as Array<{
      position: number
      amountCents: number
    }>,
)

// ── Live stats (public entry stats) ────────────────────────────────
const playersRemaining = computed<number | null>(() => entryStats.value?.playersRemaining ?? null)
const totalEntries = computed<number>(() => entryStats.value?.totalEntries ?? 0)
const avgStack = computed<number | null>(() => {
  const chips = entryStats.value?.totalChips
  const remaining = playersRemaining.value
  if (!chips || !remaining) return null
  return Math.round(chips / remaining)
})
const avgStackBB = computed<number | null>(() => {
  const bb = currentStructure.value?.bigBlind
  if (!avgStack.value || !bb) return null
  return Math.round(avgStack.value / bb)
})
const rebuyAddonLine = computed(() => {
  const parts: string[] = []
  const rebuys = (entryStats.value?.rebuyCount ?? 0) + (entryStats.value?.reEntryCount ?? 0)
  if (rebuys) parts.push(`${rebuys} ${t('display.rebuys', rebuys)}`)
  const addons = entryStats.value?.addonCount ?? 0
  if (addons) parts.push(`${addons} ${t('display.addons', addons)}`)
  return parts.join(' · ')
})

// ── Structure-derived countdowns (next break, late reg close) ──────
const structures = computed<TournamentStructure[]>(() => tournament.value?.structure || [])

const upcomingStructures = computed<TournamentStructure[]>(() => {
  const list = structures.value
  const current = currentStructure.value
  if (!list.length || !current) return []
  const idx = list.findIndex((s) => s.id === current.id || s.levelNumber === current.levelNumber)
  return idx >= 0 ? list.slice(idx + 1) : []
})

const structureSeconds = (s: TournamentStructure): number =>
  ((s.isBreak ? s.breakDurationMinutes : s.durationMinutes) || 0) * 60

// Seconds until the next scheduled break starts (null when on break / none left).
const nextBreakSeconds = computed<number | null>(() => {
  if (onBreak.value || !isRunning.value) return null
  let total = timeRemaining.value
  for (const s of upcomingStructures.value) {
    if (s.isBreak) return total
    total += structureSeconds(s)
  }
  return null
})

// Late registration: open until the end of `lateRegistrationLevel`.
const lateRegOpen = computed(
  () =>
    !!tournament.value?.lateRegistrationLevel &&
    ['REGISTRATION_OPEN', 'LATE_REGISTRATION', 'IN_PROGRESS'].includes(
      tournament.value?.liveStatus,
    ) &&
    currentLevelNumber.value <= tournament.value.lateRegistrationLevel,
)
const lateRegLine = computed(() => {
  if (!lateRegOpen.value) return null
  return t('display.lateRegUntilLevel', { level: tournament.value.lateRegistrationLevel })
})
const lateRegSeconds = computed<number | null>(() => {
  if (!lateRegOpen.value || !isRunning.value) return null
  const closeLevel = tournament.value.lateRegistrationLevel
  let total = timeRemaining.value
  if (currentLevelNumber.value === closeLevel && !onBreak.value) return total
  for (const s of upcomingStructures.value) {
    total += structureSeconds(s)
    if (!s.isBreak && s.levelNumber === closeLevel) return total
  }
  return null
})

// ── Countdown (same model as TournamentClockCard: local tick, server resync) ─
const localTimeRemaining = ref<number | null>(null)
const timeOfDay = ref('')
let timerInterval: ReturnType<typeof setInterval> | null = null

const calculateRemainingTime = (): number => {
  if (!clock.value?.levelEndTime) return 0
  const endTime = new Date(clock.value.levelEndTime).getTime()
  return Math.max(0, Math.floor((endTime - Date.now()) / 1000))
}

const updateTimeOfDay = () => {
  timeOfDay.value = new Date().toLocaleTimeString(numberLocale.value, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const startLocalTimer = () => {
  stopLocalTimer()
  localTimeRemaining.value = calculateRemainingTime()
  timerInterval = setInterval(() => {
    localTimeRemaining.value = calculateRemainingTime()
  }, 1000)
}
const stopLocalTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

watch(
  () => clock.value?.status,
  (status) => {
    if (status === 'RUNNING') startLocalTimer()
    else stopLocalTimer()
  },
  { immediate: true },
)
watch(
  () => clock.value?.levelEndTime,
  () => {
    if (isRunning.value) localTimeRemaining.value = calculateRemainingTime()
  },
)

const timeRemaining = computed(() => {
  if (isRunning.value && localTimeRemaining.value !== null) return localTimeRemaining.value
  if (clock.value?.timeRemainingSeconds != null) return clock.value.timeRemainingSeconds
  if (currentStructure.value?.durationMinutes) return currentStructure.value.durationMinutes * 60
  return 0
})

const formattedTime = computed(() => {
  const total = timeRemaining.value
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// H:MM or MM:SS style for rail countdowns (next break, late reg).
const formatDuration = (total: number): string => {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Real-time clock subscription ───────────────────────────────────
const clockSubscriptionQuery = `
  subscription TournamentClockUpdates($tournamentId: ID!) {
    tournamentClockUpdates(tournamentId: $tournamentId) {
      id
      tournamentId
      status
      currentLevel
      timeRemainingSeconds
      levelStartedAt
      levelEndTime
      autoAdvance
      currentStructure {
        id
        levelNumber
        smallBlind
        bigBlind
        ante
        durationMinutes
        isBreak
        breakDurationMinutes
      }
      nextStructure {
        id
        levelNumber
        smallBlind
        bigBlind
        ante
        durationMinutes
        isBreak
        breakDurationMinutes
      }
    }
  }
`
const { data: clockUpdates } = useGqlSubscription({
  query: clockSubscriptionQuery,
  variables: { tournamentId },
  immediate: true,
})
watch(clockUpdates, (raw) => {
  const data = raw as { tournamentClockUpdates?: TournamentClock } | undefined
  if (data?.tournamentClockUpdates) clock.value = data.tournamentClockUpdates
})

// ── Initial load + slow polling for the non-realtime extras ────────
const loadStatic = async () => {
  try {
    const res = await GqlGetTournament({ id: tournamentId })
    tournament.value = res?.tournament || null
    if (res?.tournament?.clock && !clock.value) {
      clock.value = res.tournament.clock as TournamentClock
    }
  } catch (e) {
    console.error('[Display] tournament load failed:', e)
  }
  try {
    const res = await GqlGetTournamentPayout({ tournamentId })
    payout.value = res?.tournamentPayout || null
  } catch {
    payout.value = null
  }
  try {
    const res = await GqlGetTournamentEntryStats({ tournamentId })
    entryStats.value = res?.tournamentEntryStats || null
  } catch {
    entryStats.value = null
  }
}

let pollInterval: ReturnType<typeof setInterval> | null = null
let wallclockInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await loadStatic()
  try {
    const res = await GqlGetTournamentClock({ tournamentId })
    if (res?.tournamentClock) clock.value = res.tournamentClock as TournamentClock
  } catch (e) {
    console.error('[Display] clock load failed:', e)
  }
  // Prize pool / payouts / entry stats refresh slowly; the clock is live.
  pollInterval = setInterval(loadStatic, 30_000)
  updateTimeOfDay()
  wallclockInterval = setInterval(updateTimeOfDay, 10_000)
  document.addEventListener('mousemove', onActivity)
  resetIdle()
})

onUnmounted(() => {
  stopLocalTimer()
  if (pollInterval) clearInterval(pollInterval)
  if (wallclockInterval) clearInterval(wallclockInterval)
  if (idleTimeout) clearTimeout(idleTimeout)
  document.removeEventListener('mousemove', onActivity)
})

// ── Hide cursor when idle (it's a TV) ──────────────────────────────
const cursorIdle = ref(false)
let idleTimeout: ReturnType<typeof setTimeout> | null = null
const resetIdle = () => {
  cursorIdle.value = false
  if (idleTimeout) clearTimeout(idleTimeout)
  idleTimeout = setTimeout(() => {
    cursorIdle.value = true
  }, 3000)
}
const onActivity = () => resetIdle()
</script>

<style scoped>
.tv-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse 120% 90% at 50% 40%, #16161a 0%, #0a0a0c 70%, #060607 100%);
  color: var(--color-pp-text);
  padding: clamp(1rem, 2.5vh, 2.5rem) clamp(1.5rem, 3.5vw, 4.5rem);
}

.tv-root--idle {
  cursor: none;
}

/* ── Header ───────────────────────────────────────────── */
.tv-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding-bottom: clamp(0.6rem, 1.5vh, 1.4rem);
  border-bottom: 1px solid var(--color-pp-border-strong);
}

.tv-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.4rem, 2.8vw, 2.8rem);
  font-weight: 700;
  color: var(--color-pp-gold);
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tv-subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.8rem, 1.3vw, 1.3rem);
  color: var(--color-pp-text-muted);
  margin-top: 0.2em;
}

.tv-header__right {
  display: flex;
  align-items: center;
  gap: clamp(0.8rem, 1.5vw, 1.5rem);
  flex-shrink: 0;
}

.tv-wallclock {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1rem, 1.8vw, 1.8rem);
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text-dim);
}

.tv-status {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.85rem, 1.5vw, 1.5rem);
  padding: 0.3em 0.9em;
  border-radius: 0.5em;
  white-space: nowrap;
}

.tv-status--paused {
  color: #fbbf24;
  border: 2px solid #fbbf24;
  animation: tv-blink 1.6s ease-in-out infinite;
}

.tv-status--latereg {
  color: #4ade80;
  border: 2px solid #4ade80;
}

@keyframes tv-blink {
  50% {
    opacity: 0.35;
  }
}

/* ── Main: rails + stage ─────────────────────────────── */
.tv-main {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(13rem, 0.55fr) 2.2fr minmax(13rem, 0.55fr);
  gap: clamp(1rem, 3vw, 4rem);
  align-items: stretch;
  padding-top: clamp(0.8rem, 2vh, 2rem);
  min-height: 0;
}

/* Rails */
.tv-rail {
  display: flex;
  flex-direction: column;
  gap: clamp(0.9rem, 2.4vh, 2.2rem);
  min-width: 0;
}

.tv-rail--right {
  text-align: right;
  align-items: flex-end;
}

.tv-rail__label {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.65rem, 1vw, 1rem);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-pp-text-dim);
  margin-bottom: 0.3em;
}

.tv-rail__value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.3rem, 2.6vw, 2.6rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.tv-rail__value--gold {
  color: var(--color-pp-gold);
}

.tv-rail__sub {
  font-size: 0.55em;
  color: var(--color-pp-text-muted);
  font-weight: 500;
  margin-left: 0.25em;
}

.tv-rail__detail {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.7rem, 1.1vw, 1.1rem);
  color: var(--color-pp-text-muted);
  margin-top: 0.25em;
}

.tv-rail__block--push {
  margin-top: auto;
}

.tv-rail__label--latereg {
  color: #4ade80;
}

.tv-rail__value--latereg {
  color: #4ade80;
}

/* Payout list */
.tv-payouts {
  display: flex;
  flex-direction: column;
  gap: clamp(0.3rem, 0.9vh, 0.8rem);
}

.tv-payout {
  display: flex;
  align-items: baseline;
  gap: clamp(0.6rem, 1vw, 1rem);
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.05rem, 1.9vw, 1.9rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text-muted);
}

.tv-payout--first {
  color: var(--color-pp-text);
  font-size: clamp(1.25rem, 2.3vw, 2.3rem);
}

.tv-payout__pos {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65em;
  color: var(--color-pp-gold-deep);
  min-width: 1.4em;
}

.tv-payout--first .tv-payout__pos {
  color: var(--color-pp-gold);
}

/* Center stage */
.tv-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 0;
}

.tv-level {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.3rem, 2.6vw, 2.6rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-pp-text-muted);
}

.tv-timer {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(5.5rem, 16vw, 16rem);
  font-weight: 700;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  text-shadow: 0 0 80px rgba(var(--pp-accent-rgb), 0.08);
}

.tv-timer--soon {
  color: #fbbf24;
}

.tv-timer--warning {
  color: #f87171;
  animation: tv-pulse 1s ease-in-out infinite;
}

@keyframes tv-pulse {
  50% {
    opacity: 0.55;
  }
}

.tv-blinds-row {
  display: flex;
  align-items: baseline;
  gap: clamp(0.8rem, 1.6vw, 1.6rem);
}

.tv-blinds {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.2rem, 6vw, 6rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-gold);
  line-height: 1.1;
}

.tv-ante {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.1rem, 2.6vw, 2.6rem);
  font-weight: 600;
  color: var(--color-pp-text-muted);
}

.tv-next {
  margin-top: clamp(0.5rem, 1.6vh, 1.4rem);
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(0.95rem, 1.8vw, 1.8rem);
  color: var(--color-pp-text-dim);
}

.tv-next__label {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.8em;
  margin-right: 0.6em;
  color: var(--color-pp-text-muted);
}
</style>
