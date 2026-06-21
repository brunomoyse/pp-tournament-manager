<template>
  <PpModal
    :open="isOpen"
    size="md"
    :title="mode === 'create' ? t('players.createPlayer') : t('players.editPlayer')"
    @close="closeModal"
  >
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="player-form">
      <!-- First name -->
      <div class="player-form-field">
        <label class="pp-label">
          {{ t('players.firstName') }}
          <span class="player-form-required">*</span>
        </label>
        <input
          v-model="form.firstName"
          type="text"
          required
          class="pp-input"
          :placeholder="t('players.firstNamePlaceholder')"
        />
      </div>

      <!-- Last name -->
      <div class="player-form-field">
        <label class="pp-label">{{ t('players.lastName') }}</label>
        <input
          v-model="form.lastName"
          type="text"
          class="pp-input"
          :placeholder="t('players.lastNamePlaceholder')"
        />
        <p class="player-form-hint">{{ t('players.nameHint') }}</p>
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

// Form state - roster entries carry a structured first/last name; email and
// account details belong to app users, who self-onboard and claim their entry.
const form = ref<{ firstName: string; lastName: string }>({ firstName: '', lastName: '' })
const saving = ref(false)

const isFormValid = computed(() => !!form.value.firstName.trim())

// Populate form when editing / reset on open. Legacy entries may have no
// structured parts - fall back to the display name as the first-name seed.
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.player && props.mode === 'edit') {
      form.value = {
        firstName: props.player.firstName ?? props.player.displayName,
        lastName: props.player.lastName ?? '',
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = { firstName: '', lastName: '' }
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
          firstName: form.value.firstName.trim(),
          lastName: form.value.lastName.trim(),
        },
      })
    } else if (props.player) {
      await GqlUpdateClubPlayer({
        input: {
          id: props.player.id,
          firstName: form.value.firstName.trim(),
          lastName: form.value.lastName.trim(),
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
