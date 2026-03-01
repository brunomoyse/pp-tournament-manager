<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <div class="pp-modal-backdrop" @click="$emit('close')"></div>

    <div class="pp-modal-content pp-modal-content--sm">
      <!-- Header -->
      <div class="pp-modal-header">
        <h2 class="modal-title">{{ t('templates.deleteConfirmTitle') }}</h2>
        <button @click="$emit('close')" class="pp-close-button">
          <IonIcon :icon="closeOutline" class="close-icon" />
        </button>
      </div>

      <!-- Body -->
      <div class="pp-modal-body">
        <p class="confirm-message">{{ t('templates.deleteConfirmMessage', { name: templateName }) }}</p>
        <p v-if="isPayout" class="warning-message">{{ t('templates.deleteInUseWarning') }}</p>
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        <button @click="$emit('close')" class="pp-action-button pp-action-button--secondary">
          {{ t('common.cancel') }}
        </button>
        <button
          @click="$emit('confirmed')"
          :disabled="deleting"
          class="pp-action-button pp-action-button--danger"
        >
          <IonIcon v-if="deleting" :icon="refreshOutline" class="spinner" />
          {{ deleting ? t('status.loading') : t('templates.deleteConfirmTitle') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, refreshOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'

defineProps<{
  isOpen: boolean
  templateName: string
  isPayout: boolean
  deleting: boolean
}>()

defineEmits<{
  close: []
  confirmed: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--pp-red-400);
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.confirm-message {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  line-height: 1.5;
}

.warning-message {
  margin-top: 0.75rem;
  padding: 0.625rem 0.75rem;
  background-color: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.2);
  border-radius: 0.5rem;
  color: var(--pp-yellow-400);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--pp-border);
}

.spinner {
  width: 1rem;
  height: 1rem;
  animation: pp-spin 1s linear infinite;
}
</style>
