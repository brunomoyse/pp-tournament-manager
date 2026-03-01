<template>
  <div class="template-card">
    <!-- Card Header -->
    <div class="card-header" @click="expanded = !expanded">
      <div class="card-header-left">
        <h3 class="card-title">{{ template.name }}</h3>
        <div class="card-meta">
          <span class="meta-text">{{ t('templates.levelCount', { count: playingLevels }) }}</span>
          <span class="meta-separator">·</span>
          <span class="meta-text">~{{ totalDurationFormatted }}</span>
          <template v-if="breakCount > 0">
            <span class="meta-separator">·</span>
            <span class="meta-text">{{ t('templates.breakCount', { count: breakCount }) }}</span>
          </template>
        </div>
        <p v-if="template.description" class="card-description">{{ template.description }}</p>
      </div>
      <div class="card-header-right">
        <svg
          :class="['expand-icon', expanded ? 'expand-icon--open' : '']"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        >
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Expandable Content -->
    <div v-if="expanded" class="card-body">
      <table class="structure-table">
        <thead>
          <tr>
            <th>{{ t('templates.levelNumber') }}</th>
            <th>{{ t('templates.smallBlind') }}</th>
            <th>{{ t('templates.bigBlind') }}</th>
            <th>{{ t('templates.ante') }}</th>
            <th class="text-right">{{ t('templates.duration') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="level in template.levels" :key="level.levelNumber" :class="{ 'break-row': level.isBreak }">
            <td>
              <span v-if="level.isBreak" class="break-badge">{{ t('tournament.break') }}</span>
              <span v-else>{{ level.levelNumber }}</span>
            </td>
            <td>{{ level.isBreak ? '-' : formatChips(level.smallBlind) }}</td>
            <td>{{ level.isBreak ? '-' : formatChips(level.bigBlind) }}</td>
            <td>{{ level.isBreak ? '-' : formatChips(level.ante) }}</td>
            <td class="text-right">{{ level.isBreak ? level.breakDurationMinutes : level.durationMinutes }}m</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Card Actions -->
    <div v-if="isAdmin" class="card-actions">
      <button @click="$emit('edit', template)" class="pp-action-button pp-action-button--secondary action-btn">
        <IonIcon :icon="createOutline" class="icon-sm" />
        {{ t('common.edit') }}
      </button>
      <button @click="$emit('delete', template)" class="pp-action-button pp-action-button--danger action-btn">
        <IonIcon :icon="trashOutline" class="icon-sm" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { createOutline, trashOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { BlindStructureTemplate } from '~/types/tournament'

const props = defineProps<{
  template: BlindStructureTemplate
  isAdmin: boolean
}>()

defineEmits<{
  edit: [template: BlindStructureTemplate]
  delete: [template: BlindStructureTemplate]
}>()

const { t } = useI18n()
const expanded = ref(false)

const playingLevels = computed(() => props.template.levels.filter(l => !l.isBreak).length)
const breakCount = computed(() => props.template.levels.filter(l => l.isBreak).length)

const totalDurationFormatted = computed(() => {
  const totalMinutes = props.template.levels.reduce((sum, l) => {
    return sum + (l.isBreak ? (l.breakDurationMinutes || 0) : l.durationMinutes)
  }, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}${t('templates.hours')}`
  return `${hours}${t('templates.hours')}${mins}m`
})

const formatChips = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
  return value.toString()
}
</script>

<style scoped>
.template-card {
  background-color: var(--pp-bg-secondary);
  border: 1px solid var(--pp-border);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.template-card:hover {
  border-color: rgba(254, 231, 138, 0.3);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  gap: 0.75rem;
}

.card-header-left {
  min-width: 0;
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  flex-wrap: wrap;
}

.meta-separator {
  color: rgba(255, 255, 255, 0.2);
}

.meta-text {
  color: rgba(255, 255, 255, 0.5);
}

.card-description {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expand-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.2s ease;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.expand-icon--open {
  transform: rotate(180deg);
}

.card-body {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--pp-border);
  padding-top: 0.75rem;
  overflow-x: auto;
}

.structure-table {
  width: 100%;
  font-size: 0.8125rem;
  min-width: 20rem;
}

.structure-table th {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.6875rem;
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid rgba(84, 84, 95, 0.5);
  white-space: nowrap;
}

.structure-table th:first-child {
  padding-left: 0;
}

.structure-table td {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.375rem 0.5rem;
  border-bottom: 1px solid rgba(84, 84, 95, 0.3);
}

.structure-table td:first-child {
  padding-left: 0;
}

.break-row {
  background-color: rgba(254, 231, 138, 0.05);
}

.break-row td {
  color: rgba(255, 255, 255, 0.4);
}

.break-badge {
  padding: 0.0625rem 0.375rem;
  background-color: rgba(254, 231, 138, 0.15);
  color: var(--pp-accent-gold);
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.text-right {
  text-align: right;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--pp-border);
}

.action-btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
}

.icon-sm {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
