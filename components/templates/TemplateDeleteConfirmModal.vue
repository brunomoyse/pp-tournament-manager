<template>
  <PpModal
    :open="isOpen"
    size="sm"
    :title="t('templates.deleteConfirmTitle')"
    @close="$emit('close')"
  >
    <p class="confirm-message">
      {{ t('templates.deleteConfirmMessage', { name: templateName }) }}
    </p>
    <p v-if="isPayout" class="warning-message">{{ t('templates.deleteInUseWarning') }}</p>

    <template #footer>
      <PpButton variant="secondary" @click="$emit('close')">
        {{ t('common.cancel') }}
      </PpButton>
      <PpButton
        variant="danger"
        :disabled="deleting"
        :loading="deleting"
        @click="$emit('confirmed')"
      >
        {{ deleting ? t('status.loading') : t('templates.deleteConfirmTitle') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
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
</style>
