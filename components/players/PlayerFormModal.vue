<template>
  <PpModal
    :open="isOpen"
    size="md"
    :title="mode === 'create' ? t('players.createPlayer') : t('players.editPlayer')"
    @close="closeModal"
  >
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="player-form">
      <!-- Display Name -->
      <div class="player-form-field">
        <label class="pp-label">
          {{ t('players.displayName') }}
          <span class="player-form-required">*</span>
        </label>
        <input
          v-model="form.displayName"
          type="text"
          required
          class="pp-input"
          :placeholder="t('players.displayNamePlaceholder')"
        />
        <p class="player-form-hint">{{ t('players.displayNameHint') }}</p>
      </div>

      <!-- Actions -->
      <div class="player-form-actions">
        <PpButton variant="secondary" @click="closeModal">
          {{ t('common.cancel') }}
        </PpButton>
        <PpButton type="submit" variant="primary" :disabled="!isFormValid" :loading="saving">
          {{
            saving
              ? t('status.saving')
              : mode === 'create'
                ? t('players.create')
                : t('players.save')
          }}
        </PpButton>
      </div>
    </form>
  </PpModal>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n'
import type { ClubPlayer } from '~/types/user'

interface Props {
  isOpen: boolean
  player: ClubPlayer | null
  mode: 'create' | 'edit'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  saved: []
}>()

const { t } = useI18n()
const toast = useToast()
const clubStore = useClubStore()

// Form state — roster entries carry only a display name; email and account
// details belong to app users, who self-onboard and claim their entry.
const form = ref<{ displayName: string }>({ displayName: '' })
const saving = ref(false)

const isFormValid = computed(() => !!form.value.displayName.trim())

// Populate form when editing / reset on open
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.player && props.mode === 'edit') {
      form.value = { displayName: props.player.displayName }
    } else if (isOpen && props.mode === 'create') {
      form.value = { displayName: '' }
    }
  },
)

// Submit handler
const handleSubmit = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    if (props.mode === 'create') {
      await GqlCreateClubPlayer({
        input: {
          clubId: clubStore.club?.id || '',
          displayName: form.value.displayName.trim(),
        },
      })
    } else if (props.player) {
      await GqlUpdateClubPlayer({
        input: {
          id: props.player.id,
          displayName: form.value.displayName.trim(),
        },
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save player:', error)
    toast.error(t('players.saveFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.player-form > * + * {
  margin-top: 1rem;
}

.player-form-field {
  display: flex;
  flex-direction: column;
}

.player-form-required {
  color: var(--pp-red-400);
}

.player-form-hint {
  color: var(--color-pp-text-dim);
  font-size: 0.8rem;
  margin-top: 0.35rem;
}

.player-form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
</style>
