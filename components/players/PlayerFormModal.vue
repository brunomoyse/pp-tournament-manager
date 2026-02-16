<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-md border border-pp-border shadow-2xl" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-pp-border/50">
        <h2 class="text-xl font-bold text-pp-text-primary">
          {{ mode === 'create' ? t('players.createPlayer') : t('players.editPlayer') }}
        </h2>
        <button
          @click="closeModal"
          class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-primary/50 transition-colors"
        >
          <IonIcon :icon="closeOutline" class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- First Name -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">
            {{ t('players.firstName') }} <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.firstName"
            type="text"
            required
            class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            :placeholder="t('players.firstNamePlaceholder')"
          />
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">
            {{ t('players.lastName') }}
          </label>
          <input
            v-model="form.lastName"
            type="text"
            class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            :placeholder="t('players.lastNamePlaceholder')"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">
            {{ t('auth.email') }} <span class="text-red-400">*</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            :placeholder="t('players.emailPlaceholder')"
          />
          <p v-if="emailError" class="text-red-400 text-sm mt-1">{{ emailError }}</p>
        </div>

        <!-- Username -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">
            {{ t('auth.username') }}
          </label>
          <input
            v-model="form.username"
            type="text"
            class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            :placeholder="t('players.usernamePlaceholder')"
          />
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-white/70 mb-2">
            {{ t('players.phone') }}
          </label>
          <input
            v-model="form.phone"
            type="tel"
            class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            :placeholder="t('players.phonePlaceholder')"
          />
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-pp-border/50">
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
            <IonIcon v-if="saving" :icon="refreshOutline" class="w-4 h-4 animate-spin" />
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
