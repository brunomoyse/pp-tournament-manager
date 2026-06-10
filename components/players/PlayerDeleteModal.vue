<template>
  <PpModal :open="isOpen" size="sm" @close="$emit('close')">
    <div class="delete-modal-header">
      <div class="delete-modal-icon-wrapper">
        <IonIcon :icon="warningOutline" class="delete-modal-icon" />
      </div>
      <h2 class="delete-modal-title">
        {{ t('players.archiveConfirmTitle') }}
      </h2>
      <p class="delete-modal-message">
        {{ t('players.archiveConfirmMessage', { name: playerName }) }}
      </p>
    </div>

    <template #footer>
      <PpButton variant="secondary" class="delete-modal-action-btn" @click="$emit('close')">
        {{ t('common.cancel') }}
      </PpButton>
      <PpButton variant="danger" class="delete-modal-action-btn" @click="$emit('confirmed')">
        {{ t('players.archive') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { warningOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { ClubPlayer } from '~/types/user'

interface Props {
  isOpen: boolean
  player: ClubPlayer | null
}

const props = defineProps<Props>()
defineEmits<{
  close: []
  confirmed: []
}>()

const { t } = useI18n()

const playerName = computed(() => props.player?.displayName ?? '')
</script>

<style scoped>
.delete-modal-header {
  text-align: center;
}

.delete-modal-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background-color: rgba(239, 68, 68, 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.delete-modal-icon {
  width: 2rem;
  height: 2rem;
  color: var(--pp-red-400);
}

.delete-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-pp-text);
  margin-bottom: 0.5rem;
}

.delete-modal-message {
  color: rgba(255, 255, 255, 0.7);
}

.delete-modal-action-btn {
  flex: 1;
  justify-content: center;
}
</style>
