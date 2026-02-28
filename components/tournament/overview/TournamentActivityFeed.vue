<template>
    <div class="activity-card">
        <h3 class="activity-title">{{ t('headings.recentActivity') }}</h3>
        <div class="activity-list" v-if="entries.length > 0">
            <div
                v-for="entry in entries"
                :key="entry.id"
                class="activity-item"
            >
                <div :class="['activity-dot', `activity-dot--${entry.eventCategory}`]"></div>
                <div class="activity-body">
                    <span class="activity-message">{{ formatActivityMessage(entry) }}</span>
                    <span class="activity-time">{{ formatRelativeTime(entry.eventTime) }}</span>
                </div>
            </div>
        </div>
        <div v-else class="activity-empty">
            {{ t('messages.noRecentActivity') }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n'
import { useGqlSubscription } from '~/composables/useGqlSubscription'

const { t } = useI18n()

const props = defineProps<{
    tournamentId: string
}>()

interface ActivityEntry {
    id: string
    tournamentId: string
    eventCategory: string
    eventAction: string
    actorId: string | null
    subjectId: string | null
    eventTime: string
    metadata: Record<string, any>
}

const entries = ref<ActivityEntry[]>([])

// Fetch initial entries
onMounted(async () => {
    try {
        const response = await GqlGetTournamentActivityLog({
            tournamentId: props.tournamentId,
            limit: 15,
            offset: 0,
        })
        if (response.tournamentActivityLog?.items) {
            entries.value = response.tournamentActivityLog.items as ActivityEntry[]
        }
    } catch (e) {
        console.error('[ActivityFeed] Failed to load activity log:', e)
    }
})

// Subscribe for real-time updates
const activitySubQuery = `
    subscription TournamentActivity($tournamentId: ID!) {
      tournamentActivity(tournamentId: $tournamentId) {
        id
        tournamentId
        eventCategory
        eventAction
        actorId
        subjectId
        eventTime
        metadata
      }
    }
`

const { data: activityUpdates } = useGqlSubscription({
    query: activitySubQuery,
    variables: { tournamentId: props.tournamentId },
    immediate: true,
})

watch(activityUpdates, (raw: any) => {
    if (raw?.tournamentActivity) {
        const newEntry = raw.tournamentActivity as ActivityEntry
        // Prepend new entry, keep max 30
        entries.value = [newEntry, ...entries.value].slice(0, 30)
    }
})

function formatActivityMessage(entry: ActivityEntry): string {
    const key = `activity.${entry.eventCategory}.${entry.eventAction}`
    const translated = t(key, entry.metadata)
    // If the key wasn't found, fall back to a generic display
    if (translated === key) {
        return `${entry.eventCategory}: ${entry.eventAction}`
    }
    return translated
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)

    if (diffSec < 60) return t('activity.time.justNow')
    if (diffMin < 60) return t('activity.time.minutesAgo', { count: diffMin })
    if (diffHour < 24) return t('activity.time.hoursAgo', { count: diffHour })
    return date.toLocaleDateString()
}
</script>

<style scoped>
.activity-card {
    background-color: var(--pp-bg-secondary);
    border-radius: 1rem;
    padding: 1.25rem;
    box-shadow: var(--pp-shadow-sm);
    border: 1px solid var(--pp-border);
}

.activity-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pp-text-primary);
    margin-bottom: 1rem;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(84, 84, 95, 0.3);
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    margin-top: 0.375rem;
    flex-shrink: 0;
}

.activity-dot--clock {
    background-color: var(--pp-blue-500);
}

.activity-dot--registration {
    background-color: var(--pp-green-500);
}

.activity-dot--seating {
    background-color: var(--pp-purple-500);
}

.activity-dot--entry {
    background-color: var(--pp-accent-gold);
}

.activity-dot--result {
    background-color: var(--pp-orange-500);
}

.activity-dot--tournament {
    background-color: var(--pp-red-500);
}

.activity-body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
}

.activity-message {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.4;
}

.activity-time {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
}

.activity-empty {
    text-align: center;
    padding: 2rem 0;
    color: rgba(255, 255, 255, 0.6);
}
</style>
