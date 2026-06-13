<template>
  <PpModal :open="isOpen" size="sm" @close="$emit('close')">
    <div class="cancel-modal-header">
      <div class="cancel-modal-icon-wrapper">
        <IonIcon :icon="warningOutline" class="cancel-modal-icon" />
      </div>
      <h2 class="cancel-modal-title">
        {{ t('players.cancelRegisterTitle') }}
      </h2>
      <p class="cancel-modal-message">
        {{ t('players.cancelRegisterMessage', { name: playerName }) }}
      </p>
    </div>

    <template #footer>
      <PpButton variant="secondary" class="cancel-modal-action-btn" @click="$emit('close')">
        {{ t('common.cancel') }}
      </PpButton>
      <PpButton
        variant="danger"
        class="cancel-modal-action-btn"
        :loading="processing"
        :disabled="processing"
        @click="$emit('confirmed')"
      >
        {{ t('buttons.remove') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { warningOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'

interface Props {
  isOpen: boolean
  playerName: string
  processing?: boolean
}

withDefaults(defineProps<Props>(), { processing: false })
defineEmits<{
  close: []
  confirmed: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.cancel-modal-header {
  text-align: center;
}

.cancel-modal-icon-wrapper {
  width: 4rem;
  height: 4rem;
  background-color: rgba(239, 68, 68, 0.2);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.cancel-modal-icon {
  width: 2rem;
  height: 2rem;
  color: var(--pp-red-400);
}

.cancel-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-pp-text);
  margin-bottom: 0.5rem;
}

.cancel-modal-message {
  color: rgba(255, 255, 255, 0.7);
}

.cancel-modal-action-btn {
  flex: 1;
  justify-content: center;
}
</style>
