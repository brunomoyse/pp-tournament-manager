<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div
      class="pp-modal-backdrop"
      @click="$emit('close')"
    ></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--sm">
      <!-- Header -->
      <div class="delete-modal-header">
        <div class="delete-modal-icon-wrapper">
          <IonIcon :icon="warningOutline" class="delete-modal-icon" />
        </div>
        <h2 class="delete-modal-title">
          {{ t('players.deactivateConfirmTitle') }}
        </h2>
        <p class="delete-modal-message">
          {{ t('players.deactivateConfirmMessage', { name: playerName }) }}
        </p>
      </div>

      <!-- Actions -->
      <div class="pp-modal-footer">
        <button
          @click="$emit('close')"
          class="delete-modal-action-btn pp-action-button pp-action-button--secondary"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          @click="$emit('confirmed')"
          class="delete-modal-action-btn pp-action-button pp-action-button--danger"
        >
          {{ t('players.deactivate') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { warningOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { User } from '~/types/user'

interface Props {
  isOpen: boolean
  player: User | null
}

const props = defineProps<Props>()
defineEmits<{
  close: []
  confirmed: []
}>()

const { t } = useI18n()

const playerName = computed(() => {
  if (!props.player) return ''
  if (props.player.firstName && props.player.lastName) {
    return `${props.player.firstName} ${props.player.lastName}`
  }
  return props.player.firstName || props.player.username || props.player.email
})
</script>

<style scoped>
.delete-modal-header {
  padding: 1.5rem;
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
  color: var(--pp-text-primary);
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
