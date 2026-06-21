<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IonIcon } from '@ionic/vue'
import {
  checkmarkOutline,
  closeOutline,
  compassOutline,
  trophyOutline,
  peopleOutline,
  constructOutline,
  statsChartOutline,
} from 'ionicons/icons'
import { useTourStore } from '~/stores/useTourStore'
import { useI18n } from '~/composables/useI18n'
import { useToast } from '~/composables/useToast'

/**
 * TourChecklistCard: the dashboard "Setup guide". Items tick themselves off
 * from real data; when everything is done the card celebrates once and
 * retires itself. Counts arrive as props from the dashboard's existing
 * queries (`null` = still loading, treated as not-yet-complete).
 */
const props = defineProps<{
  tournamentsCount: number | null
  playersCount: number | null
}>()

const tourStore = useTourStore()
const { t } = useI18n()
const toast = useToast()

interface ChecklistItem {
  id: string
  icon: string
  labelKey: string
  route?: string
  done: boolean
  pending: boolean
}

const items = computed<ChecklistItem[]>(() => [
  {
    id: 'takeTour',
    icon: compassOutline,
    labelKey: 'tour.checklist.items.takeTour',
    done: tourStore.tourCompleted,
    pending: false,
  },
  {
    id: 'createTournament',
    icon: trophyOutline,
    labelKey: 'tour.checklist.items.createTournament',
    route: '/tournaments',
    done: (props.tournamentsCount ?? 0) > 0,
    pending: props.tournamentsCount === null,
  },
  {
    id: 'addPlayers',
    icon: peopleOutline,
    labelKey: 'tour.checklist.items.addPlayers',
    route: '/players',
    // The dashboard count comes from the leaderboard (players who have *played*),
    // so it stays 0 after merely adding roster players. The persisted
    // hasAddedPlayer flag (set on the players page) ticks it as soon as the club
    // has at least one player.
    done: tourStore.hasAddedPlayer || (props.playersCount ?? 0) > 0,
    pending: !tourStore.hasAddedPlayer && props.playersCount === null,
  },
  {
    id: 'exploreTemplates',
    icon: constructOutline,
    labelKey: 'tour.checklist.items.exploreTemplates',
    route: '/templates',
    done: tourStore.visitedTemplates,
    pending: false,
  },
  {
    id: 'viewReports',
    icon: statsChartOutline,
    labelKey: 'tour.checklist.items.viewReports',
    route: '/reports',
    done: tourStore.visitedReports,
    pending: false,
  },
])

const doneCount = computed(() => items.value.filter((i) => i.done).length)
const total = computed(() => items.value.length)
const dataReady = computed(() => !items.value.some((i) => i.pending))
const allDone = computed(() => dataReady.value && doneCount.value === total.value)

// Progress ring geometry
const RADIUS = 24
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const dashOffset = computed(
  () => CIRCUMFERENCE * (1 - (total.value ? doneCount.value / total.value : 0)),
)

const visible = computed(() => !tourStore.checklistDismissed)
const celebrating = ref(false)

// One-time celebration, then the card retires itself.
watch(allDone, (done) => {
  if (done && visible.value && !celebrating.value) {
    celebrating.value = true
    toast.success(t('tour.checklist.completed'))
    setTimeout(() => tourStore.dismissChecklist(), 2200)
  }
})

const onItemClick = (item: ChecklistItem) => {
  if (item.done) return
  if (item.id === 'takeTour') {
    tourStore.startTour()
    return
  }
  if (item.route) navigateTo(item.route)
}
</script>

<template>
  <Transition name="checklist">
    <div
      v-if="visible"
      class="checklist-card pp-card"
      :class="{ 'checklist-card--celebrating': celebrating }"
      data-tour="setup-guide"
    >
      <div class="checklist-header">
        <div class="checklist-ring-wrap" aria-hidden="true">
          <svg class="checklist-ring" viewBox="0 0 56 56">
            <circle class="ring-track" cx="28" cy="28" :r="RADIUS" />
            <circle
              class="ring-progress"
              cx="28"
              cy="28"
              :r="RADIUS"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="dashOffset"
            />
          </svg>
          <span class="ring-count">{{ doneCount }}/{{ total }}</span>
        </div>
        <div class="checklist-titles">
          <h3 class="checklist-title">{{ t('tour.checklist.title') }}</h3>
          <p class="checklist-subtitle">{{ t('tour.checklist.subtitle') }}</p>
        </div>
        <button
          type="button"
          class="checklist-dismiss"
          :aria-label="t('tour.checklist.dismiss')"
          @click="tourStore.dismissChecklist"
        >
          <IonIcon :icon="closeOutline" />
        </button>
      </div>

      <ul class="checklist-items">
        <li v-for="item in items" :key="item.id">
          <button
            type="button"
            class="checklist-item"
            :class="{
              'checklist-item--done': item.done,
              'checklist-item--link': !item.done && (!!item.route || item.id === 'takeTour'),
            }"
            @click="onItemClick(item)"
          >
            <span class="item-check" :class="{ 'item-check--done': item.done }">
              <IonIcon v-if="item.done" :icon="checkmarkOutline" class="item-check-icon" />
            </span>
            <IonIcon :icon="item.icon" class="item-icon" />
            <span class="item-label">{{ t(item.labelKey) }}</span>
          </button>
        </li>
      </ul>
    </div>
  </Transition>
</template>

<style scoped>
.checklist-card {
  padding: 1.25rem 1.4rem;
  border-radius: 1.25rem;
  margin-bottom: 1.5rem;
  transition: box-shadow 0.6s ease;
}

.checklist-card--celebrating {
  box-shadow:
    0 0 0 1px rgba(var(--pp-accent-rgb), 0.35),
    0 0 42px rgba(var(--pp-accent-rgb), 0.18);
}

.checklist-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.checklist-ring-wrap {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
}

.checklist-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 4;
}

.ring-progress {
  fill: none;
  stroke: var(--color-pp-gold);
  stroke-width: 4;
  stroke-linecap: round;
  filter: drop-shadow(0 0 6px rgba(var(--pp-accent-rgb), 0.45));
  transition: stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.ring-count {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-pp-gold);
}

.checklist-titles {
  flex: 1;
  min-width: 0;
}

.checklist-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-pp-text);
}

.checklist-subtitle {
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
  margin-top: 0.1rem;
}

.checklist-dismiss {
  align-self: flex-start;
  display: inline-flex;
  padding: 0.35rem;
  border-radius: 9999px;
  color: var(--color-pp-text-dim);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.checklist-dismiss:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.05);
}

.checklist-dismiss ion-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.checklist-items {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.35rem;
}

@media (min-width: 768px) {
  .checklist-items {
    grid-template-columns: 1fr 1fr;
  }
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border-radius: 0.75rem;
  text-align: left;
  cursor: default;
  transition: background-color 0.15s ease;
}

.checklist-item--link {
  cursor: pointer;
}

.checklist-item--link:hover {
  background-color: rgba(255, 255, 255, 0.04);
}

.item-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border-radius: 9999px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.item-check--done {
  background-color: var(--color-pp-gold);
  border-color: var(--color-pp-gold);
  transform: scale(1.08);
  box-shadow: 0 0 10px rgba(var(--pp-accent-rgb), 0.4);
}

.item-check-icon {
  width: 0.8rem;
  height: 0.8rem;
  color: var(--color-pp-bg);
}

.item-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-pp-text-dim);
}

.item-label {
  font-size: 0.83rem;
  color: var(--color-pp-text-muted);
  transition: color 0.3s ease;
}

.checklist-item--done .item-label {
  color: var(--color-pp-text-dim);
  text-decoration: line-through;
  text-decoration-color: rgba(var(--pp-accent-rgb), 0.4);
}

/* Card exit (dismiss / completion) */
.checklist-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.checklist-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.985);
}
</style>
