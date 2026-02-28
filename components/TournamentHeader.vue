<template>
    <ion-header>
        <ion-toolbar>
            <ion-title slot="start">
                <div>
                    <h1 class="header-title">Tournament Manager</h1>
                    <div class="header-subtitle-row">
                        <p class="header-club-name">Liège Poker Club</p>
                        <div class="header-status">
                            <div :class="['status-dot', 'status-dot--' + connectionStatus]" />
                            <span class="header-status-label">{{ connectionStatus }}</span>
                        </div>
                    </div>
                </div>
            </ion-title>

            <ion-buttons slot="end">
                <ion-note class="header-last-update">{{ t('labels.lastUpdate') }} {{ new Date(lastUpdate).toLocaleTimeString() }}</ion-note>
                <ion-select
                    v-model="selectedId"
                    :placeholder="t('placeholders.selectTournament')"
                    interface="popover"
                    class="header-tournament-select"
                >
                    <ion-select-option v-for="t in tournaments" :key="t.id" :value="t.id">
                        {{ t.title }}
                    </ion-select-option>
                </ion-select>
            </ion-buttons>
        </ion-toolbar>
    </ion-header>
</template>

<script setup lang="ts">
import type { Tournament } from '~/types/tournament'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()

const props = defineProps<{ tournaments: Tournament[]; lastUpdate: number; connectionStatus: 'connected' | 'disconnected' | 'reconnecting'; modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const selectedId = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

</script>

<style scoped>
.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.header-subtitle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-club-name {
  font-size: 0.875rem;
  opacity: 0.7;
  color: var(--pp-text-secondary);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.status-dot--connected {
  background-color: var(--pp-accent-gold);
}

.status-dot--reconnecting {
  background-color: var(--pp-text-secondary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.status-dot--disconnected {
  background-color: var(--pp-red-500);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.header-status-label {
  font-size: 0.75rem;
  opacity: 0.7;
  text-transform: capitalize;
  color: var(--pp-text-secondary);
}

.header-last-update {
  margin-right: 0.75rem;
}

.header-tournament-select {
  min-width: 200px;
}
</style>
