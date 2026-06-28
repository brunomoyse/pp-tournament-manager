<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <div class="page-header">
          <PpFadeUp>
            <p class="eyebrow">{{ t('nav.announcements') }}</p>
            <h1 class="page-title">
              <span>{{ t('announcements.title') }}</span>
            </h1>
            <p class="page-subtitle">{{ t('announcements.subtitle') }}</p>
          </PpFadeUp>
        </div>

        <!-- Compose card -->
        <PpFadeUp :delay="0.06">
          <div class="compose-card">
            <div class="compose-head">
              <div class="compose-icon">
                <IonIcon :icon="megaphoneOutline" />
              </div>
              <div class="compose-heading">
                <p class="compose-eyebrow">{{ t('announcements.composeEyebrow') }}</p>
                <p class="compose-title">{{ t('announcements.composePrompt') }}</p>
              </div>
            </div>
            <button type="button" class="compose-field" @click="showModal = true">
              {{ t('announcements.titlePlaceholder') }}
            </button>
            <div class="compose-foot">
              <p class="compose-hint">{{ t('announcements.composeHint') }}</p>
              <PpButton magnetic @click="showModal = true">
                <IonIcon :icon="createOutline" class="icon-md" />
                {{ t('announcements.create') }}
              </PpButton>
            </div>
          </div>
        </PpFadeUp>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <!-- List -->
        <template v-else-if="announcements.length > 0">
          <div class="list-header">
            <p class="list-eyebrow">{{ t('announcements.past') }}</p>
            <span class="list-count">{{ announcements.length }}</span>
          </div>
          <PpStagger class="announcements-list" :stagger-children="0.04">
            <PpStaggerItem v-for="item in announcements" :key="item.id">
              <PpCard
                padding="md"
                class="announcement-card"
                :class="`announcement-card--${item.scope.toLowerCase()}`"
              >
                <div class="announcement-card-icon">
                  <IonIcon :icon="megaphoneOutline" />
                </div>
                <div class="announcement-card-main">
                  <div class="announcement-card-header">
                    <PpBadge :variant="scopeVariant(item.scope)">
                      {{ scopeLabel(item.scope) }}
                    </PpBadge>
                    <span class="announcement-card-date">{{ formatDate(item.createdAt) }}</span>
                  </div>
                  <h3 class="announcement-card-title">{{ item.title }}</h3>
                  <p class="announcement-card-body">{{ item.body }}</p>
                </div>
              </PpCard>
            </PpStaggerItem>
          </PpStagger>
        </template>

        <!-- Empty -->
        <PpEmptyState
          v-else
          :icon="megaphoneOutline"
          :title="t('announcements.emptyTitle')"
          :description="t('announcements.emptyDescription')"
        >
          <template #action>
            <PpButton magnetic @click="showModal = true">
              <IonIcon :icon="megaphoneOutline" class="icon-md" />
              {{ t('announcements.create') }}
            </PpButton>
          </template>
        </PpEmptyState>
      </div>
    </IonContent>

    <AnnouncementFormModal :is-open="showModal" @close="showModal = false" @saved="onSaved" />
  </IonPage>
</template>

<script setup lang="ts">
import type { GetClubAnnouncementsQuery } from '#gql'

definePageMeta({
  middleware: ['auth', 'paid'],
  title: 'nav.announcements',
})

import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue'
import { createOutline, megaphoneOutline } from 'ionicons/icons'
import AnnouncementFormModal from '~/components/announcements/AnnouncementFormModal.vue'
import { useI18n } from '~/composables/useI18n'

type Announcement = GetClubAnnouncementsQuery['clubAnnouncements']['items'][number]

const { t, locale } = useI18n()
const clubStore = useClubStore()

const loading = ref(true)
const announcements = ref<Announcement[]>([])
const showModal = ref(false)

const scopeLabel = (scope: string) => {
  switch (scope) {
    case 'TOURNAMENT':
      return t('announcements.scopeTournament')
    case 'PLATFORM':
      return t('announcements.scopePlatform')
    default:
      return t('announcements.scopeClub')
  }
}

const scopeVariant = (scope: string): 'gold' | 'info' | 'warning' => {
  switch (scope) {
    case 'TOURNAMENT':
      return 'info'
    case 'PLATFORM':
      return 'warning'
    default:
      return 'gold'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(locale.value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchAnnouncements = async () => {
  const clubId = clubStore.club?.id
  if (!clubId) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const { clubAnnouncements } = await GqlGetClubAnnouncements({ clubId })
    announcements.value = clubAnnouncements?.items || []
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
    announcements.value = []
  } finally {
    loading.value = false
  }
}

const onSaved = async () => {
  showModal.value = false
  await fetchAnnouncements()
}

onMounted(() => {
  fetchAnnouncements()
})
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.page-subtitle {
  margin-top: 0.4rem;
  color: var(--color-pp-text-muted);
  font-size: 0.9rem;
  max-width: 40ch;
}

/* Compose card */
.compose-card {
  margin-bottom: 2rem;
  padding: 1.25rem;
  border-radius: var(--radius-2xl, 1.25rem);
  background-color: var(--color-pp-surface);
  border: 1px solid var(--color-pp-border-strong);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.compose-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.compose-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  background-color: rgba(var(--pp-accent-rgb), 0.12);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.25);
  color: var(--color-pp-gold);
  font-size: 1.4rem;
}

.compose-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.compose-title {
  margin-top: 0.15rem;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.compose-field {
  width: 100%;
  text-align: left;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  background-color: var(--color-pp-bg);
  border: 1px solid var(--color-pp-border);
  color: var(--color-pp-text-dim);
  font-size: 0.9rem;
  cursor: text;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;
}

.compose-field:hover {
  border-color: rgba(var(--pp-accent-rgb), 0.4);
  color: var(--color-pp-text-muted);
}

.compose-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.compose-hint {
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
  max-width: 40ch;
}

/* List */
.list-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.85rem;
}

.list-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-pp-gold-deep);
}

.list-count {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.7rem;
  padding: 0.05rem 0.5rem;
  border-radius: 9999px;
  background-color: rgba(var(--pp-accent-rgb), 0.12);
  color: var(--color-pp-gold);
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.announcement-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.announcement-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 0.625rem;
  background-color: rgba(var(--pp-accent-rgb), 0.1);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.2);
  color: var(--color-pp-gold);
  font-size: 1.15rem;
}

.announcement-card--tournament .announcement-card-icon {
  background-color: rgba(var(--pp-info-rgb), 0.12);
  border-color: rgba(var(--pp-info-rgb), 0.25);
  color: var(--color-pp-info);
}

.announcement-card--platform .announcement-card-icon {
  background-color: rgba(var(--pp-warning-rgb), 0.12);
  border-color: rgba(var(--pp-warning-rgb), 0.25);
  color: var(--color-pp-warning);
}

.announcement-card-main {
  min-width: 0;
  flex: 1;
}

.announcement-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.announcement-card-date {
  font-size: 0.75rem;
  color: var(--color-pp-text-dim);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.announcement-card-title {
  font-size: 1.05rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--color-pp-text);
  margin-bottom: 0.25rem;
}

.announcement-card-body {
  font-size: 0.9rem;
  color: var(--color-pp-text-muted);
  white-space: pre-wrap;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}
</style>
