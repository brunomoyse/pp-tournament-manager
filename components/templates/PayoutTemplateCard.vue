<template>
  <div class="template-card">
    <!-- Card Header -->
    <div
      class="card-header"
      role="button"
      tabindex="0"
      :aria-expanded="expanded"
      :aria-label="template.name"
      @click="expanded = !expanded"
      @keydown.enter.space.prevent="expanded = !expanded"
    >
      <div class="card-icon">
        <IonIcon :icon="trophyOutline" />
      </div>
      <div class="card-header-left">
        <h3 class="card-title">{{ template.name }}</h3>
        <div class="card-meta">
          <span class="meta-badge">{{ playerRange }}</span>
          <span class="meta-separator">·</span>
          <span class="meta-text">{{
            t('templates.paysTop', { count: template.payoutStructure.length })
          }}</span>
        </div>
        <p v-if="template.description" class="card-description">{{ template.description }}</p>
      </div>
      <div class="card-header-right">
        <svg
          :class="['expand-icon', expanded ? 'expand-icon--open' : '']"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <!-- Expandable Content -->
    <div v-if="expanded" class="card-body">
      <table class="structure-table">
        <thead>
          <tr>
            <th>{{ t('templates.position') }}</th>
            <th class="text-right">{{ t('templates.percentage') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in template.payoutStructure" :key="entry.position">
            <td>{{ entry.position }}</td>
            <td class="text-right">{{ entry.percentage.toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Card Actions -->
    <div v-if="isAdmin" class="card-actions">
      <PpButton variant="secondary" size="sm" @click="$emit('edit', template)" class="action-btn">
        <IonIcon :icon="createOutline" class="icon-sm" />
        {{ t('common.edit') }}
      </PpButton>
      <PpButton variant="danger" size="sm" @click="$emit('delete', template)" class="action-btn">
        <IonIcon :icon="trashOutline" class="icon-sm" />
      </PpButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { createOutline, trashOutline, trophyOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { PayoutTemplate } from '~/types/tournament'

const props = defineProps<{
  template: PayoutTemplate
  isAdmin: boolean
}>()

defineEmits<{
  edit: [template: PayoutTemplate]
  delete: [template: PayoutTemplate]
}>()

const { t } = useI18n()
const expanded = ref(false)

const playerRange = computed(() => {
  if (props.template.maxPlayers) {
    return t('templates.playerRange', {
      min: props.template.minPlayers,
      max: props.template.maxPlayers,
    })
  }
  return t('templates.playerRangeNoMax', { min: props.template.minPlayers })
})
</script>

<style scoped>
.template-card {
  background-color: var(--color-pp-surface-2);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.template-card:hover {
  border-color: rgba(var(--pp-accent-rgb), 0.3);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  gap: 0.75rem;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 0.625rem;
  background-color: rgba(var(--pp-accent-rgb), 0.12);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.25);
  color: var(--color-pp-gold);
  font-size: 1.25rem;
}

.card-header-left {
  min-width: 0;
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-display);
  color: var(--color-pp-text);
  margin-bottom: 0.25rem;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-pp-text-muted);
}

.meta-badge {
  padding: 0.125rem 0.5rem;
  background-color: rgba(var(--pp-accent-rgb), 0.1);
  color: var(--color-pp-gold);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.meta-separator {
  color: var(--color-pp-border-strong);
}

.meta-text {
  color: var(--color-pp-text-muted);
  font-family: var(--font-mono);
}

.card-description {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-pp-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expand-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-pp-text-dim);
  transition: transform 0.2s ease;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.expand-icon--open {
  transform: rotate(180deg);
}

.card-body {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--color-pp-border-strong);
  padding-top: 0.75rem;
}

.structure-table {
  width: 100%;
  font-size: 0.8125rem;
}

.structure-table th {
  color: var(--color-pp-text-muted);
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.6875rem;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--color-pp-border-strong);
}

.structure-table td {
  color: var(--color-pp-text);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--color-pp-border);
}

.text-right {
  text-align: right;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-pp-border-strong);
}

.action-btn {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.icon-sm {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
