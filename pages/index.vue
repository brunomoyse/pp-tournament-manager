<template>
  <IonPage class="page-root">
    <IonContent class="page-content">
      <div class="page-container">
        <PpFadeUp>
          <div class="page-header">
            <div>
              <p class="eyebrow">{{ t('nav.dashboard') }}</p>
              <h1 class="page-title">
                <span>{{ t('messages.welcomeBack', { name: '' }).replace(/\s+$/, '') }}</span>
                <span class="pp-gold-text"
                  >&nbsp;{{
                    currentUser?.firstName || currentUser?.username || t('common.user')
                  }}</span
                >
              </h1>
            </div>
            <PpButton magnetic @click="createTournament">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('buttons.createTournament') }}
            </PpButton>
          </div>
        </PpFadeUp>

        <PpFadeUp v-if="activeTournaments.length > 0" :delay="0.08">
          <div
            class="live-hero pp-card pp-shimmer-hover"
            @click="activeTournaments[0] && goToTournament(activeTournaments[0].id)"
          >
            <div class="live-hero-inner">
              <div class="live-hero-left">
                <div class="live-icon-wrapper">
                  <div class="pp-live-dot live-hero-dot" />
                </div>
                <div>
                  <div class="live-hero-badge-row">
                    <span class="live-hero-badge">{{ t('status.live') }}</span>
                  </div>
                  <h3 class="live-hero-title">{{ activeTournaments[0]?.title }}</h3>
                  <div class="live-hero-meta">
                    <span>{{ formatPrice(activeTournaments[0]?.buyInCents, locale) }}</span>
                    <span v-if="activeTournaments.length > 1">&middot;</span>
                    <span v-if="activeTournaments.length > 1" class="live-hero-more">
                      +{{ activeTournaments.length - 1 }} {{ t('labels.more') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="live-hero-right">
                <PpButton tag="span" tabindex="-1" class="pointer-events-none">
                  {{ t('buttons.viewTournament') }}
                  <IonIcon :icon="chevronForwardOutline" class="icon-sm" />
                </PpButton>
              </div>
            </div>
          </div>
        </PpFadeUp>

        <PpStagger class="stats-grid" :stagger-children="0.05" data-tour="dashboard-stats">
          <PpStaggerItem>
            <PpCard padding="sm" class="pp-poker-watermark" data-suit="&#9824;">
              <div class="stat-header">
                <span class="stat-label">{{ t('headings.activeTournaments') }}</span>
                <IonIcon :icon="trophyOutline" class="stat-icon" />
              </div>
              <div class="stat-value">
                <PpAnimatedNumber :value="activeTournaments.length" />
              </div>
            </PpCard>
          </PpStaggerItem>

          <PpStaggerItem>
            <PpCard padding="sm" class="pp-poker-watermark" data-suit="&#9829;">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.players') }}</span>
                <IonIcon :icon="peopleOutline" class="stat-icon" />
              </div>
              <div class="stat-value">
                <PpAnimatedNumber :value="playerStats.uniquePlayers" />
              </div>
              <div v-if="playerStats.thisWeek > 0" class="stat-trend">
                {{ playerStats.thisWeek }} {{ t('reports.period.last7Days').toLowerCase() }}
              </div>
            </PpCard>
          </PpStaggerItem>

          <PpStaggerItem>
            <PpCard padding="sm" class="pp-poker-watermark" data-suit="&#9830;">
              <div class="stat-header">
                <span class="stat-label">{{ t('reports.avgBuyIn') }}</span>
                <IonIcon :icon="cashOutline" class="stat-icon" />
              </div>
              <div class="stat-value">{{ formatPrice(playerStats.avgBuyIn, locale) }}</div>
            </PpCard>
          </PpStaggerItem>

          <PpStaggerItem>
            <PpCard padding="sm" class="pp-poker-watermark" data-suit="&#9827;">
              <div class="stat-header">
                <span class="stat-label">{{ t('headings.regularPlayers') }}</span>
                <IonIcon :icon="peopleOutline" class="stat-icon" />
              </div>
              <div class="stat-value">
                <PpAnimatedNumber :value="playerStats.regularPlayers" />
              </div>
            </PpCard>
          </PpStaggerItem>
        </PpStagger>

        <PpFadeUp :delay="0.16">
          <PpCard padding="lg">
            <div class="recent-header">
              <div>
                <p class="section-eyebrow">{{ t('labels.tournaments') }}</p>
                <h3 class="recent-title">{{ t('headings.recentTournaments') }}</h3>
              </div>
              <div class="recent-header-actions">
                <PpBadge variant="neutral">
                  {{ recentTournaments.length }} {{ t('labels.tournaments') }}
                </PpBadge>
                <PpButton variant="secondary" @click="viewAllTournaments">
                  {{ t('buttons.viewAll') }}
                </PpButton>
              </div>
            </div>

            <div v-if="isLoading" class="skeleton-list">
              <div v-for="i in 3" :key="i" class="skeleton-row">
                <div class="skeleton-left">
                  <IonSkeletonText
                    :animated="true"
                    style="width: 48px; height: 48px; border-radius: 8px"
                  />
                  <div class="skeleton-text">
                    <IonSkeletonText
                      :animated="true"
                      style="width: 60%; height: 20px; margin-bottom: 8px"
                    />
                    <IonSkeletonText :animated="true" style="width: 40%; height: 16px" />
                  </div>
                </div>
                <IonSkeletonText
                  :animated="true"
                  style="width: 80px; height: 28px; border-radius: 6px"
                />
              </div>
            </div>

            <PpStagger
              v-else-if="recentTournaments.length > 0"
              class="tournament-list"
              :stagger-children="0.04"
            >
              <PpStaggerItem v-for="tournament in recentTournaments" :key="tournament.id">
                <div class="pp-shimmer-hover tournament-row" @click="goToTournament(tournament.id)">
                  <div class="tournament-row-left">
                    <div class="tournament-icon-wrapper">
                      <IonIcon :icon="trophyOutline" class="tournament-icon" />
                    </div>
                    <div>
                      <h4 class="tournament-name">{{ tournament.title }}</h4>
                      <div class="tournament-meta">
                        <span>{{ formatPrice(tournament.buyInCents, locale) }}</span>
                        <span>&middot;</span>
                        <span>{{ new Date(tournament.startTime).toLocaleDateString(locale) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="tournament-row-right">
                    <PpBadge :variant="getTournamentSmartStatus(tournament).variant">
                      {{ getTournamentSmartStatus(tournament).label }}
                    </PpBadge>
                    <IonIcon
                      v-if="getTournamentSmartStatus(tournament).needsAttention"
                      :icon="warningOutline"
                      class="attention-icon pp-animate-pulse"
                    />
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
})

import { IonPage, IonContent, IonIcon, IonSkeletonText, alertController } from '@ionic/vue'
import {
  trophyOutline,
  peopleOutline,
  addOutline,
  chevronForwardOutline,
  cashOutline,
  warningOutline,
} from 'ionicons/icons'
import { useAuthStore } from '~/stores/useAuthStore'
import { formatPrice } from '~/utils'
import { useI18n } from '~/composables/useI18n'
import { getTournamentStatusLabel, getTournamentStatusVariant } from '~/utils/tournamentStatus'
import TournamentFormModal from '~/components/tournament/TournamentFormModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const clubStore = useClubStore()
const { t, locale } = useI18n()

const { currentUser } = authStore
const { club } = clubStore

const tournaments = ref<GetTournamentsQuery['tournaments']['items']>([])
const allTimeLeaderboard = ref<GetLeaderboardQuery['leaderboard'] | null>(null)
const weekLeaderboard = ref<GetLeaderboardQuery['leaderboard'] | null>(null)

const isLoading = ref(true)
const showTournamentModal = ref(false)

const playerStats = computed(() => {
  const entries = allTimeLeaderboard.value?.items || []
  const uniquePlayers = allTimeLeaderboard.value?.totalCount || 0
  const thisWeek = weekLeaderboard.value?.totalCount || 0
  const totalBuyIns = entries.reduce((sum, e) => sum + e.totalBuyIns, 0)
  const totalTournaments = entries.reduce((sum, e) => sum + e.totalTournaments, 0)
  const avgBuyIn = totalTournaments > 0 ? Math.round(totalBuyIns / totalTournaments) : 0
  const regularPlayers = entries.filter((e) => e.totalTournaments >= 3).length
  return { uniquePlayers, thisWeek, avgBuyIn, regularPlayers }
})

const activeTournaments = computed(() =>
  tournaments.value.filter((t) => t.status === 'IN_PROGRESS'),
)

const recentTournaments = computed(() =>
  [...tournaments.value]
    .toSorted(
      (a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime(),
    )
    .slice(0, 5),
)

const getTournamentSmartStatus = (tournament: any) => {
  const now = new Date()
  const startTime = tournament.startTime ? new Date(tournament.startTime) : null
  const endTime = tournament.endTime ? new Date(tournament.endTime) : null

  if (tournament.status === 'UPCOMING' && startTime && startTime < now) {
    return {
      needsAttention: true,
      suggestedStatus: 'LATE_START',
      variant: 'warning' as const,
      label: t('status.lateStart') || 'Demarrage en retard',
    }
  }

  if (endTime && endTime < now && tournament.status !== 'COMPLETED') {
    return {
      needsAttention: true,
      suggestedStatus: 'SHOULD_BE_COMPLETED',
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

const onTournamentSaved = async (newTournament?: any) => {
  closeTournamentModal()
  if (!club) return

  if (newTournament) {
    const optimisticTournament = {
      ...newTournament,
      id: newTournament.id || `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    Promise.all([
      GqlGetLeaderboard({
        clubId: club.id,
        period: LeaderboardPeriod.ALL_TIME,
        pagination: { limit: 200 },
      }),
      GqlGetLeaderboard({ clubId: club.id, period: LeaderboardPeriod.LAST_7_DAYS }),
    ])
      .then(([allTimeRes, weekRes]) => {
        allTimeLeaderboard.value = allTimeRes.leaderboard
        weekLeaderboard.value = weekRes.leaderboard
      })
      .catch((err) => {
        console.error('Failed to load leaderboard data:', err)
      })
  } catch (error) {
    console.error('Failed to load tournaments:', error)
    isLoading.value = false
  }
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
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.section-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
  margin-bottom: 0.4rem;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
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

.live-hero {
  margin-bottom: 1.5rem;
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  border-color: rgba(239, 68, 68, 0.4);
  background-image:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
    linear-gradient(110deg, rgba(239, 68, 68, 0.16), transparent 40%);
  cursor: pointer;
}

.live-hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.live-hero-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.live-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background-color: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-hero-dot {
  width: 0.625rem;
  height: 0.625rem;
  background-color: #ef4444;
  border-radius: 9999px;
}

.live-hero-badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
}

.live-hero-badge {
  color: #f87171;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

.live-hero-title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-pp-text);
  letter-spacing: -0.015em;
}

.live-hero-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-pp-text-muted);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.live-hero-more {
  color: var(--color-pp-text-dim);
}

.live-hero-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--color-pp-text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.stat-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-pp-gold);
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-gold);
  font-variant-numeric: tabular-nums;
}

.stat-trend {
  font-size: 0.7rem;
  color: #4ade80;
  margin-top: 0.4rem;
  font-family: var(--font-mono);
}

.recent-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.recent-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.recent-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.skeleton-list > * + * {
  margin-top: 0.5rem;
}

.skeleton-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: rgba(24, 24, 26, 0.5);
  border-radius: 0.5rem;
  border: 1px solid var(--color-pp-border-strong);
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

.tournament-list > * + * {
  margin-top: 0.5rem;
}

.tournament-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background-color: rgba(255, 255, 255, 0.015);
  border-radius: 0.85rem;
  border: 1px solid var(--color-pp-border-strong);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.tournament-row:hover {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(254, 231, 138, 0.25);
  transform: translateY(-1px);
}

.tournament-row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tournament-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-pp-border-strong);
  transition: border-color 0.15s ease;
}

.tournament-row:hover .tournament-icon-wrapper {
  border-color: rgba(254, 231, 138, 0.4);
}

.tournament-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-pp-gold);
}

.tournament-name {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-pp-text);
  margin-bottom: 0.15rem;
  letter-spacing: -0.01em;
}

.tournament-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-pp-text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
}

.tournament-row-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.attention-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #fb923c;
}

.chevron-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--color-pp-text-dim);
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.tournament-row:hover .chevron-icon {
  color: var(--color-pp-gold);
  transform: translateX(2px);
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
}

.empty-icon-wrapper {
  width: 5rem;
  height: 5rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  border: 1px solid var(--color-pp-border-strong);
}

.empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-pp-text-dim);
}

.empty-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
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
