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
          <PpFadeUp :delay="0.08">
            <div class="header-actions">
              <PpButton magnetic @click="showModal = true">
                <IonIcon :icon="megaphoneOutline" class="icon-md" />
                {{ t('announcements.create') }}
              </PpButton>
            </div>
          </PpFadeUp>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <!-- List -->
        <PpStagger
          v-else-if="announcements.length > 0"
          class="announcements-list"
          :stagger-children="0.04"
        >
          <PpStaggerItem v-for="item in announcements" :key="item.id">
            <PpCard padding="md" class="announcement-card">
              <div class="announcement-card-header">
                <PpBadge :variant="scopeVariant(item.scope)">
                  {{ scopeLabel(item.scope) }}
                </PpBadge>
                <span class="announcement-card-date">{{ formatDate(item.createdAt) }}</span>
              </div>
              <h3 class="announcement-card-title">{{ item.title }}</h3>
              <p class="announcement-card-body">{{ item.body }}</p>
            </PpCard>
          </PpStaggerItem>
        </PpStagger>

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
  middleware: 'auth',
  title: 'nav.announcements',
})

import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue'
import { megaphoneOutline } from 'ionicons/icons'
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

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  font-family: 'JetBrains Mono', monospace;
}

.announcement-card-title {
  font-size: 1.05rem;
  font-weight: 700;
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
