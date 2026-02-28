<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div
      class="pp-modal-backdrop"
      @click="closeModal"
    ></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--md">
      <!-- Header -->
      <div class="pp-modal-header">
        <h2 class="player-form-title">
          {{ mode === 'create' ? t('players.createPlayer') : t('players.editPlayer') }}
        </h2>
        <button
          @click="closeModal"
          class="pp-close-button"
        >
          <IonIcon :icon="closeOutline" class="player-form-close-icon" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="pp-modal-body player-form">
        <!-- First Name -->
        <div class="player-form-field">
          <label class="pp-label">
            {{ t('players.firstName') }} <span class="player-form-required">*</span>
          </label>
          <input
            v-model="form.firstName"
            type="text"
            required
            class="pp-input"
            :placeholder="t('players.firstNamePlaceholder')"
          />
        </div>

        <!-- Last Name -->
        <div class="player-form-field">
          <label class="pp-label">
            {{ t('players.lastName') }}
          </label>
          <input
            v-model="form.lastName"
            type="text"
            class="pp-input"
            :placeholder="t('players.lastNamePlaceholder')"
          />
        </div>

        <!-- Email -->
        <div class="player-form-field">
          <label class="pp-label">
            {{ t('auth.email') }} <span class="player-form-required">*</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="pp-input"
            :placeholder="t('players.emailPlaceholder')"
          />
          <p v-if="emailError" class="player-form-error">{{ emailError }}</p>
        </div>

        <!-- Username -->
        <div class="player-form-field">
          <label class="pp-label">
            {{ t('auth.username') }}
          </label>
          <input
            v-model="form.username"
            type="text"
            class="pp-input"
            :placeholder="t('players.usernamePlaceholder')"
          />
        </div>

        <!-- Phone -->
        <div class="player-form-field">
          <label class="pp-label">
            {{ t('players.phone') }}
          </label>
          <input
            v-model="form.phone"
            type="tel"
            class="pp-input"
            :placeholder="t('players.phonePlaceholder')"
          />
        </div>

        <!-- Actions -->
        <div class="player-form-actions">
          <button
            type="button"
            @click="closeModal"
            class="pp-action-button pp-action-button--secondary"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || saving"
            class="pp-action-button pp-action-button--primary"
          >
            <IonIcon v-if="saving" :icon="refreshOutline" class="player-form-spinner" />
            {{ saving ? t('status.saving') : (mode === 'create' ? t('players.create') : t('players.save')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, refreshOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { User, PlayerFormData } from '~/types/user'

interface Props {
  isOpen: boolean
  player: User | null
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

// Form state
const form = ref<PlayerFormData>({
  email: '',
  firstName: '',
  lastName: '',
  username: '',
  phone: ''
})

const saving = ref(false)
const emailError = ref('')

// Validation
const isFormValid = computed(() => {
  return form.value.firstName.trim() && form.value.email.trim() && !emailError.value
})

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Watch for email changes to validate
watch(() => form.value.email, (email) => {
  if (email && !validateEmail(email)) {
    emailError.value = t('auth.emailInvalid')
  } else {
    emailError.value = ''
  }
})

// Populate form when editing
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.player && props.mode === 'edit') {
    form.value = {
      email: props.player.email,
      firstName: props.player.firstName,
      lastName: props.player.lastName || '',
      username: props.player.username || '',
      phone: props.player.phone || ''
    }
  } else if (isOpen && props.mode === 'create') {
    form.value = {
      email: '',
      firstName: '',
      lastName: '',
      username: '',
      phone: ''
    }
  }
})

// Submit handler
const handleSubmit = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    if (props.mode === 'create') {
      await GqlCreatePlayer({
        input: {
          email: form.value.email,
          firstName: form.value.firstName,
          lastName: form.value.lastName || undefined,
          username: form.value.username || undefined,
          phone: form.value.phone || undefined,
          clubId: clubStore.club?.id || ''
        }
      })
    } else if (props.player) {
      await GqlUpdatePlayer({
        input: {
          id: props.player.id,
          email: form.value.email,
          firstName: form.value.firstName,
          lastName: form.value.lastName || undefined,
          username: form.value.username || undefined,
          phone: form.value.phone || undefined
        }
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
  emailError.value = ''
  emit('close')
}
</script>

<style scoped>
.player-form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.player-form-close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

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

.player-form-error {
  color: var(--pp-red-400);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.player-form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--pp-border);
}

.player-form-spinner {
  width: 1rem;
  height: 1rem;
  animation: pp-spin 1s linear infinite;
}
</style>
