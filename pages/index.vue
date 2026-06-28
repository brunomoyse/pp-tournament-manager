<template>
  <IonPage class="page-root">
    <IonContent class="page-content">
      <div class="page-container">
        <!-- Greeting header -->
        <PpFadeUp>
          <div class="page-header">
            <div>
              <p class="eyebrow">{{ todayLabel }}</p>
              <h1 class="page-title">
                <i18n-t keypath="messages.welcomeBack" tag="span" scope="global">
                  <template #name>
                    <span class="pp-gold-text">{{
                      currentUser?.firstName || currentUser?.username || t('common.user')
                    }}</span>
                  </template>
                </i18n-t>
              </h1>
            </div>
            <PpButton magnetic @click="createTournament">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('buttons.createTournament') }}
            </PpButton>
          </div>
        </PpFadeUp>

        <!-- Live tournament control strip -->
        <PpFadeUp v-if="liveTournament" :delay="0.08">
          <div class="live-strip" @click="goToTournament(liveTournament.id)">
            <div class="live-strip__lead">
              <div class="live-strip__dot-wrap">
                <span class="pp-live-dot live-strip__dot" />
              </div>
              <div class="live-strip__id">
                <div class="live-strip__badge-row">
                  <span class="live-strip__badge">{{ t('status.live') }}</span>
                  <span v-if="liveLevel" class="live-strip__level">
                    {{ t('labels.level') }} {{ liveLevel }}
                  </span>
                  <span v-if="liveBlinds" class="live-strip__blinds">{{ liveBlinds }}</span>
                </div>
                <h2 class="live-strip__title">{{ liveTournament.title }}</h2>
              </div>
            </div>

            <div class="live-strip__figures">
              <div class="live-figure">
                <span class="live-figure__label">{{ t('labels.timeLeft') }}</span>
                <span class="live-figure__value">{{
                  liveTimeLeft != null ? formatDuration(liveTimeLeft) : '--:--'
                }}</span>
              </div>
              <div class="live-figure">
                <span class="live-figure__label">{{ t('labels.players') }}</span>
                <span class="live-figure__value">{{ livePlayersText }}</span>
              </div>
              <div class="live-figure">
                <span class="live-figure__label">{{ t('headings.prizePool') }}</span>
                <span class="live-figure__value">{{ formatPrice(livePrizePool) }}</span>
              </div>
            </div>

            <div class="live-strip__cta">
              <PpButton tag="span" tabindex="-1" class="pointer-events-none">
                {{ t('buttons.raceControl') }}
                <IonIcon :icon="chevronForwardOutline" class="icon-sm" />
              </PpButton>
            </div>
          </div>
        </PpFadeUp>

        <PpFadeUp :delay="0.12">
          <TourChecklistCard
            :tournaments-count="isLoading ? null : tournaments.length"
            :players-count="allTimeLeaderboard ? (allTimeLeaderboard.totalCount ?? 0) : null"
          />
        </PpFadeUp>

        <!-- Stat row -->
        <PpStagger class="stats-grid" :stagger-children="0.05" data-tour="dashboard-stats">
          <PpStaggerItem>
            <PpStatTile
              :kicker="t('headings.activeTournaments')"
              tone="gold"
              :sparkline="cadenceSpark"
            >
              <PpAnimatedNumber :value="activeTournaments.length" />
            </PpStatTile>
          </PpStaggerItem>

          <PpStaggerItem>
            <PpStatTile
              :kicker="t('reports.activePlayers')"
              tone="success"
              :trend="
                playerStats.thisWeek > 0
                  ? t('messages.activeThisWeek', { count: playerStats.thisWeek })
                  : undefined
              "
            >
              <PpAnimatedNumber :value="playerStats.activePlayers" />
            </PpStatTile>
          </PpStaggerItem>

          <PpStaggerItem>
            <PpStatTile :kicker="t('reports.volumeThisMonth')" tone="gold" :sparkline="volumeSpark">
              {{ formatPrice(playerStats.volumeThisMonth) }}
            </PpStatTile>
          </PpStaggerItem>

          <PpStaggerItem>
            <PpStatTile
              :kicker="t('headings.upcomingTournaments')"
              tone="info"
              :sparkline="upcomingSpark"
            >
              <PpAnimatedNumber :value="upcomingTournaments.length" />
            </PpStatTile>
          </PpStaggerItem>
        </PpStagger>

        <!-- Schedule + floor activity split -->
        <div class="split-grid">
          <PpFadeUp :delay="0.16">
            <PpCard padding="lg">
              <div class="card-head">
                <div>
                  <PpEyebrow size="sm">{{ t('labels.tournaments') }}</PpEyebrow>
                  <h3 class="card-title">{{ t('headings.recentTournaments') }}</h3>
                </div>
                <PpButton variant="secondary" size="sm" @click="viewAllTournaments">
                  {{ t('buttons.viewAll') }}
                </PpButton>
              </div>

              <div v-if="isLoading" class="skeleton-list">
                <div v-for="i in 4" :key="i" class="skeleton-row">
                  <div class="skeleton-left">
                    <IonSkeletonText
                      :animated="true"
                      style="width: 42px; height: 42px; border-radius: 10px"
                    />
                    <div class="skeleton-text">
                      <IonSkeletonText
                        :animated="true"
                        style="width: 60%; height: 18px; margin-bottom: 8px"
                      />
                      <IonSkeletonText :animated="true" style="width: 40%; height: 14px" />
                    </div>
                  </div>
                  <IonSkeletonText
                    :animated="true"
                    style="width: 70px; height: 24px; border-radius: 6px"
                  />
                </div>
              </div>

              <PpStagger
                v-else-if="recentTournaments.length > 0"
                class="schedule-list"
                :stagger-children="0.04"
              >
                <PpStaggerItem v-for="tournament in recentTournaments" :key="tournament.id">
                  <div class="schedule-row" @click="goToTournament(tournament.id)">
                    <div class="schedule-row__left">
                      <div class="schedule-icon">
                        <IonIcon :icon="trophyOutline" />
                      </div>
                      <div class="schedule-row__text">
                        <h4 class="schedule-row__name">{{ tournament.title }}</h4>
                        <div class="schedule-row__meta">
                          <span>{{ formatPrice(tournament.buyInCents) }}</span>
                          <span class="dot-sep">&middot;</span>
                          <span>{{ formatDate(tournament.startTime) }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="schedule-row__right">
                      <PpBadge :variant="getTournamentSmartStatus(tournament).variant">
                        {{ getTournamentSmartStatus(tournament).label }}
                      </PpBadge>
                      <IonIcon :icon="chevronForwardOutline" class="chevron-icon" />
                    </div>
                  </div>
                </PpStaggerItem>
              </PpStagger>

              <div v-else class="empty-state">
                <div class="empty-icon-wrapper">
                  <IonIcon :icon="trophyOutline" class="empty-icon" />
                </div>
                <h4 class="empty-title">{{ t('messages.noTournamentsYet') }}</h4>
                <p class="empty-description">{{ t('messages.createFirstTournament') }}</p>
                <PpButton class="empty-cta" @click="createTournament">
                  <IonIcon :icon="addOutline" class="icon-md" />
                  {{ t('buttons.createTournament') }}
                </PpButton>
              </div>
            </PpCard>
          </PpFadeUp>

          <PpFadeUp :delay="0.2">
            <PpCard padding="lg" class="activity-card">
              <div class="card-head">
                <div>
                  <PpEyebrow size="sm">{{ t('labels.active') }}</PpEyebrow>
                  <h3 class="card-title">{{ t('headings.recentActivity') }}</h3>
                </div>
              </div>

              <div v-if="floorActivity.length > 0" class="timeline">
                <div v-for="event in floorActivity" :key="event.id" class="timeline-item">
                  <div class="timeline-marker">
                    <span class="timeline-dot" :class="`timeline-dot--${event.tone}`" />
                  </div>
                  <div class="timeline-body">
                    <p class="timeline-text">{{ event.text }}</p>
                    <div class="timeline-sub">
                      <span class="timeline-status" :class="`timeline-status--${event.tone}`">{{
                        event.label
                      }}</span>
                      <span class="timeline-time">{{ relTime(event.time) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="activity-empty">
                <IonIcon :icon="pulseOutline" class="activity-empty__icon" />
                <p>{{ t('messages.noActivity') }}</p>
              </div>
            </PpCard>
          </PpFadeUp>
        </div>
      </div>
    </IonContent>

    <TournamentFormModal
      :isOpen="showTournamentModal"
      :tournament="null"
      mode="create"
      @close="closeTournamentModal"
      @saved="onTournamentSaved"
    />
  </IonPage>
</template>

<script setup lang="ts">
import { LeaderboardPeriod } from '~/types/enums'
import type { GetTournamentsQuery, GetLeaderboardQuery } from '#gql'

definePageMeta({
  middleware: 'auth',
  title: 'nav.dashboard',
})

import { IonPage, IonContent, IonIcon, IonSkeletonText, alertController } from '@ionic/vue'
import { trophyOutline, addOutline, chevronForwardOutline, pulseOutline } from 'ionicons/icons'
import { useAuthStore } from '~/stores/useAuthStore'
import { formatPrice, formatBlinds, formatDuration } from '~/utils'
import { useI18n } from '~/composables/useI18n'
import { getTournamentStatusLabel, getTournamentStatusVariant } from '~/utils/tournamentStatus'
import TournamentFormModal from '~/components/tournament/TournamentFormModal.vue'
import TourChecklistCard from '~/components/tour/TourChecklistCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const clubStore = useClubStore()
const { t, locale } = useI18n()

const { currentUser } = authStore
const { club } = clubStore

const tournaments = ref<GetTournamentsQuery['tournaments']['items']>([])
const allTimeLeaderboard = ref<GetLeaderboardQuery['leaderboard'] | null>(null)
const weekLeaderboard = ref<GetLeaderboardQuery['leaderboard'] | null>(null)
const monthLeaderboard = ref<GetLeaderboardQuery['leaderboard'] | null>(null)

const isLoading = ref(true)
const showTournamentModal = ref(false)

// Full detail of the live tournament (clock + structure + registrations) so the
// control strip can show real level, blinds, time, players, and prize pool.
const liveDetail = ref<any | null>(null)

// Ticking "now" so the live strip's time-left counts down without a full refetch.
const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | null = null

const playerStats = computed(() => {
  // Players active in the last 30 days (audience health) + buy-in volume over
  // the same window (business). Both come from the rolling-30d leaderboard.
  const monthEntries = monthLeaderboard.value?.items || []
  const activePlayers = monthLeaderboard.value?.totalCount || 0
  const thisWeek = weekLeaderboard.value?.totalCount || 0
  const volumeThisMonth = monthEntries.reduce((sum, e) => sum + e.totalBuyIns, 0)
  return { activePlayers, thisWeek, volumeThisMonth }
})

const activeTournaments = computed(() =>
  tournaments.value.filter((tournament) => tournament.status === 'IN_PROGRESS'),
)

// Tournaments scheduled within the next 7 days (and not yet completed).
const upcomingTournaments = computed(() => {
  const start = now.value
  const horizon = start + 7 * 24 * 60 * 60 * 1000
  return tournaments.value.filter((tournament) => {
    if (tournament.status === 'COMPLETED' || !tournament.startTime) return false
    const at = new Date(tournament.startTime).getTime()
    return at >= start && at <= horizon
  })
})

const recentTournaments = computed(() =>
  [...tournaments.value]
    .toSorted(
      (a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime(),
    )
    .slice(0, 5),
)

const liveTournament = computed(() => activeTournaments.value[0] || null)

// Live strip derived values (all from the fetched detail, no fabricated data).
const liveClock = computed(() => liveDetail.value?.clock || null)
const liveLevel = computed(
  () => liveClock.value?.currentLevel ?? liveClock.value?.currentStructure?.levelNumber ?? null,
)
const liveBlinds = computed(() =>
  liveClock.value?.currentStructure && !liveClock.value.currentStructure.isBreak
    ? formatBlinds(liveClock.value.currentStructure)
    : '',
)
const liveTimeLeft = computed(() => {
  const c = liveClock.value
  if (!c) return null
  if (c.status === 'RUNNING' && c.levelEndTime) {
    return Math.max(0, Math.floor((new Date(c.levelEndTime).getTime() - now.value) / 1000))
  }
  return c.timeRemainingSeconds ?? null
})
const liveRegistrations = computed(() =>
  (liveDetail.value?.registrations || []).filter(
    (r: any) => r.status !== 'CANCELLED' && r.status !== 'NO_SHOW',
  ),
)
const livePlayersText = computed(() => {
  const cap = liveTournament.value?.seatCap
  const count = liveRegistrations.value.length
  return cap ? `${count}/${cap}` : `${count}`
})
const livePrizePool = computed(
  () => liveRegistrations.value.length * (liveTournament.value?.buyInCents || 0),
)

// Real sparkline series, derived from the tournament list (no synthetic data).
const dailyCounts = (future: boolean) => {
  const days = 7
  const out = Array.from({ length: days }, () => 0)
  const today = new Date(now.value)
  today.setHours(0, 0, 0, 0)
  const base = today.getTime()
  for (const tournament of tournaments.value) {
    if (!tournament.startTime) continue
    const d = new Date(tournament.startTime)
    d.setHours(0, 0, 0, 0)
    const diff = Math.round((d.getTime() - base) / 86_400_000)
    if (future) {
      if (diff >= 0 && diff < days) out[diff] += 1
    } else if (diff <= 0 && diff > -days) {
      out[days - 1 + diff] += 1
    }
  }
  return out
}
const cadenceSpark = computed(() => dailyCounts(false))
const upcomingSpark = computed(() => dailyCounts(true))
// Buy-in trend across the most recent tournaments (oldest to newest, in euros).
const volumeSpark = computed(() =>
  recentTournaments.value.toReversed().map((tournament) => (tournament.buyInCents || 0) / 100),
)

// Floor activity feed, synthesised from real tournament state (most recent or
// imminent first). Reuses the localized status labels, so no new copy.
const statusTone = (status: string) => {
  if (status === 'IN_PROGRESS') return 'live'
  if (status === 'COMPLETED') return 'success'
  return 'info'
}
const floorActivity = computed(() => {
  const items = tournaments.value
    .map((tournament) => {
      const time =
        tournament.status === 'COMPLETED'
          ? tournament.endTime || tournament.updatedAt
          : tournament.startTime
      return {
        id: tournament.id,
        tone: statusTone(tournament.status),
        text: tournament.title,
        label: getTournamentStatusLabel(tournament.status, t),
        time,
      }
    })
    .filter((item) => item.time)
  return items
    .toSorted(
      (a, b) =>
        Math.abs(new Date(a.time as string).getTime() - now.value) -
        Math.abs(new Date(b.time as string).getTime() - now.value),
    )
    .slice(0, 6)
})

const todayLabel = computed(() =>
  new Date(now.value).toLocaleDateString(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }),
)

const relativeFormatter = computed(
  () => new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }),
)
const relTime = (iso?: string | null) => {
  if (!iso) return ''
  const mins = Math.round((new Date(iso).getTime() - now.value) / 60_000)
  if (Math.abs(mins) < 60) return relativeFormatter.value.format(mins, 'minute')
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return relativeFormatter.value.format(hours, 'hour')
  return relativeFormatter.value.format(Math.round(hours / 24), 'day')
}

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(locale.value) : ''

const getTournamentSmartStatus = (tournament: any) => {
  const current = new Date(now.value)
  const startTime = tournament.startTime ? new Date(tournament.startTime) : null
  const endTime = tournament.endTime ? new Date(tournament.endTime) : null

  if (tournament.status === 'UPCOMING' && startTime && startTime < current) {
    return {
      needsAttention: true,
      variant: 'warning' as const,
      label: t('status.lateStart') || 'Demarrage en retard',
    }
  }

  if (endTime && endTime < current && tournament.status !== 'COMPLETED') {
    return {
      needsAttention: true,
      variant: 'danger' as const,
      label: t('status.shouldBeCompleted') || 'Devrait etre termine',
    }
  }

  return {
    needsAttention: false,
    variant: getTournamentStatusVariant(tournament.status),
    label: getTournamentStatusLabel(tournament.status, t),
  }
}

const goToTournament = (id: string) => {
  router.push(`/tournament/${id}`)
}

const createTournament = () => {
  showTournamentModal.value = true
}

const closeTournamentModal = () => {
  showTournamentModal.value = false
}

const loadLiveDetail = async () => {
  const id = liveTournament.value?.id
  if (!id) {
    liveDetail.value = null
    return
  }
  try {
    const res = await GqlGetTournament({ id })
    liveDetail.value = res.tournament || null
  } catch {
    liveDetail.value = null
  }
}

const onTournamentSaved = async (newTournament?: any) => {
  closeTournamentModal()
  if (!club) return

  if (newTournament) {
    const optimisticTournament = {
      ...newTournament,
      id: newTournament.id || `temp-${now.value}`,
      createdAt: new Date(now.value).toISOString(),
      updatedAt: new Date(now.value).toISOString(),
      _optimistic: true,
    }
    tournaments.value = [optimisticTournament, ...(tournaments.value || [])]
  }

  try {
    const res = await GqlGetTournaments({ clubId: club.id })
    tournaments.value = res.tournaments?.items || []
  } catch (error) {
    console.error('Failed to refresh tournaments:', error)
  }
}

const viewAllTournaments = () => {
  router.push('/tournaments')
}

onMounted(async () => {
  nowTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)

  if (!club) {
    const alert = await alertController.create({
      header: t('alerts.noClub.header'),
      message: t('alerts.noClub.message'),
      buttons: [t('common.ok')],
    })
    await alert.present()
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    const tournamentsRes = await GqlGetTournaments({ clubId: club.id })
    tournaments.value = tournamentsRes.tournaments?.items || []
    isLoading.value = false

    loadLiveDetail()

    Promise.all([
      GqlGetLeaderboard({
        clubId: club.id,
        period: LeaderboardPeriod.ALL_TIME,
        pagination: { limit: 200 },
      }),
      GqlGetLeaderboard({ clubId: club.id, period: LeaderboardPeriod.LAST_7_DAYS }),
      GqlGetLeaderboard({
        clubId: club.id,
        period: LeaderboardPeriod.LAST_30_DAYS,
        pagination: { limit: 200 },
      }),
    ])
      .then(([allTimeRes, weekRes, monthRes]) => {
        allTimeLeaderboard.value = allTimeRes.leaderboard
        weekLeaderboard.value = weekRes.leaderboard
        monthLeaderboard.value = monthRes.leaderboard
      })
      .catch((err) => {
        console.error('Failed to load leaderboard data:', err)
      })
  } catch (error) {
    console.error('Failed to load tournaments:', error)
    isLoading.value = false
  }
})

// Refetch the live detail whenever the active tournament changes.
watch(() => liveTournament.value?.id, loadLiveDetail)

onBeforeUnmount(() => {
  if (nowTimer) clearInterval(nowTimer)
})
</script>

<style scoped>
.icon-sm {
  width: 1rem;
  height: 1rem;
}
.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}
.page-root,
.page-content {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.75rem 1rem 3rem;
}

@media (min-width: 640px) {
  .page-container {
    padding: 2rem 1.5rem 3rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding: 2.5rem 2rem 4rem;
  }
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
  font-variant-numeric: tabular-nums;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
  line-height: 1.1;
}

/* Live tournament control strip */
.live-strip {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
  padding: 1.1rem 1.35rem;
  border-radius: var(--radius-2xl);
  cursor: pointer;
  position: relative;
  border: 1px solid transparent;
  /* Red-to-surface fill (padding-box) over a 1px gradient border (border-box).
     Every layer is a gradient image so the solid surface can sit mid-stack. */
  background:
    linear-gradient(110deg, rgba(var(--pp-danger-rgb), 0.14), rgba(255, 255, 255, 0) 45%)
      padding-box,
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0)) padding-box,
    linear-gradient(var(--color-pp-surface), var(--color-pp-surface)) padding-box,
    linear-gradient(110deg, rgba(var(--pp-danger-rgb), 0.5), var(--color-pp-border) 45%) border-box;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.live-strip:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 40px -18px rgba(var(--pp-danger-rgb), 0.5);
}

.live-strip__lead {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  flex: 1 1 16rem;
}

.live-strip__dot-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background-color: rgba(var(--pp-danger-rgb), 0.15);
  border: 1px solid rgba(var(--pp-danger-rgb), 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.live-strip__dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 9999px;
  background-color: var(--color-pp-danger);
}

.live-strip__id {
  min-width: 0;
}

.live-strip__badge-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.live-strip__badge {
  color: #f87171;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.live-strip__level,
.live-strip__blinds {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text-muted);
}

.live-strip__title {
  margin-top: 0.2rem;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--color-pp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-strip__figures {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}

.live-figure {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.live-figure__label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-pp-text-dim);
}

.live-figure__value {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-gold);
}

.live-strip__cta {
  margin-left: auto;
}

/* Stat row */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin: 1.5rem 0 2rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Schedule + activity split */
.split-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 1024px) {
  .split-grid {
    grid-template-columns: 1.4fr 1fr;
    align-items: start;
  }
}

.card-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.card-title {
  margin-top: 0.35rem;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.skeleton-list > * + * {
  margin-top: 0.5rem;
}

.skeleton-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background-color: rgba(255, 255, 255, 0.015);
  border-radius: 0.85rem;
  border: 1px solid var(--color-pp-border);
}

.skeleton-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.skeleton-text {
  flex: 1;
}

/* Schedule list */
.schedule-list > * + * {
  margin-top: 0.5rem;
}

.schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  background-color: rgba(255, 255, 255, 0.015);
  border-radius: 0.85rem;
  border: 1px solid var(--color-pp-border);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.schedule-row:hover {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(var(--pp-accent-rgb), 0.25);
  transform: translateY(-2px);
}

.schedule-row__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.schedule-icon {
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-pp-border);
  flex-shrink: 0;
  transition: border-color 0.15s ease;
}

.schedule-row:hover .schedule-icon {
  border-color: rgba(var(--pp-accent-rgb), 0.4);
}

.schedule-icon ion-icon {
  width: 1.2rem;
  height: 1.2rem;
  color: var(--color-pp-gold);
}

.schedule-row__text {
  min-width: 0;
}

.schedule-row__name {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-pp-text);
  margin-bottom: 0.15rem;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-row__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-pp-text-muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

.dot-sep {
  color: var(--color-pp-text-dim);
}

.schedule-row__right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.chevron-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--color-pp-text-dim);
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.schedule-row:hover .chevron-icon {
  color: var(--color-pp-gold);
  transform: translateX(2px);
}

/* Floor activity timeline */
.timeline {
  position: relative;
  padding-left: 0.4rem;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 0.85rem;
  padding-bottom: 1.1rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  position: relative;
  display: flex;
  justify-content: center;
  width: 0.6rem;
  flex-shrink: 0;
}

/* Connector line linking the dots. */
.timeline-item:not(:last-child) .timeline-marker::after {
  content: '';
  position: absolute;
  top: 0.85rem;
  bottom: -0.25rem;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background-color: var(--color-pp-border-strong);
}

.timeline-dot {
  margin-top: 0.3rem;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 9999px;
  background-color: var(--color-pp-text-dim);
  z-index: 1;
}

.timeline-dot--live {
  background-color: var(--color-pp-danger);
  box-shadow: 0 0 0 3px rgba(var(--pp-danger-rgb), 0.18);
}
.timeline-dot--success {
  background-color: #34d399;
  box-shadow: 0 0 0 3px rgba(var(--pp-success-rgb), 0.18);
}
.timeline-dot--info {
  background-color: var(--color-pp-info);
  box-shadow: 0 0 0 3px rgba(var(--pp-info-rgb), 0.18);
}

.timeline-body {
  min-width: 0;
  flex: 1;
}

.timeline-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-pp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-sub {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.2rem;
}

.timeline-status {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pp-text-muted);
}
.timeline-status--live {
  color: #f87171;
}
.timeline-status--success {
  color: #34d399;
}
.timeline-status--info {
  color: var(--color-pp-info);
}

.timeline-time {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--color-pp-text-dim);
  font-variant-numeric: tabular-nums;
}

.activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 0;
  color: var(--color-pp-text-dim);
  text-align: center;
}

.activity-empty__icon {
  width: 2rem;
  height: 2rem;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 2.5rem 0;
}

.empty-icon-wrapper {
  width: 4.5rem;
  height: 4.5rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  border: 1px solid var(--color-pp-border);
}

.empty-icon {
  width: 2.25rem;
  height: 2.25rem;
  color: var(--color-pp-text-dim);
}

.empty-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-pp-text);
  margin-bottom: 0.5rem;
}

.empty-description {
  color: var(--color-pp-text-muted);
  margin-bottom: 1.5rem;
}

.empty-cta {
  margin: 0 auto;
}
</style>
