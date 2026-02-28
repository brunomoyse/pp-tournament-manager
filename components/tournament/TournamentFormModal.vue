<template>
  <div v-if="isOpen" class="pp-modal-overlay">
    <!-- Backdrop -->
    <div
      class="pp-modal-backdrop"
      @click="closeModal"
    ></div>

    <!-- Modal Content -->
    <div class="pp-modal-content pp-modal-content--2xl">
      <!-- Header -->
      <div class="pp-modal-header tournament-form-header-sticky">
        <h2 class="tournament-form-title">
          {{ mode === 'create' ? t('tournament.createTournament') : t('tournament.editTournament') }}
        </h2>
        <button
          @click="closeModal"
          class="pp-close-button"
        >
          <IonIcon :icon="closeOutline" class="tournament-form-close-icon" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="pp-modal-body tournament-form">
        <!-- Basic Info Section -->
        <div class="tournament-form-section">
          <h3 class="tournament-form-section-title">{{ t('tournament.basicInfo') }}</h3>

          <!-- Name -->
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.name') }} <span class="tournament-form-required">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="pp-input"
              :placeholder="t('tournament.namePlaceholder')"
            />
          </div>

          <!-- Description -->
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.description') }}
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="pp-input"
              :placeholder="t('tournament.descriptionPlaceholder')"
            />
          </div>

          <!-- Start Time -->
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.startTime') }} <span class="tournament-form-required">*</span>
            </label>
            <input
              v-model="form.startTime"
              type="datetime-local"
              required
              class="pp-input"
            />
          </div>

          <!-- Buy-in / Seat Cap row -->
          <div class="tournament-form-row">
            <div class="tournament-form-field">
              <label class="pp-label">
                {{ t('tournament.buyIn') }} (EUR) <span class="tournament-form-required">*</span>
              </label>
              <input
                v-model.number="buyInEuros"
                type="number"
                min="0"
                step="0.01"
                required
                class="pp-input"
              />
            </div>
            <div class="tournament-form-field">
              <label class="pp-label">
                {{ t('tournament.seatCap') }}
              </label>
              <input
                v-model.number="form.seatCap"
                type="number"
                min="2"
                class="pp-input"
                :placeholder="t('tournament.unlimited')"
              />
            </div>
          </div>

          <!-- Early Bird Bonus -->
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.earlyBirdBonus') }}
            </label>
            <input
              v-model.number="form.earlyBirdBonusChips"
              type="number"
              min="0"
              class="pp-input"
              :placeholder="t('tournament.earlyBirdBonusPlaceholder')"
            />
          </div>

          <!-- Late Registration Level -->
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.lateRegistrationLevel') }}
            </label>
            <input
              v-model.number="form.lateRegistrationLevel"
              type="number"
              min="1"
              class="pp-input"
              :placeholder="t('tournament.lateRegistrationLevelPlaceholder')"
            />
            <p class="tournament-form-help">{{ t('tournament.lateRegistrationLevelHelp') }}</p>
          </div>
        </div>

        <!-- Blind Structure Template Section -->
        <div class="tournament-form-section">
          <h3 class="tournament-form-section-title">{{ t('tournament.blindStructure') }}</h3>

          <!-- Template Dropdown -->
          <div class="tournament-form-field">
            <label class="pp-label">
              {{ t('tournament.selectTemplate') }} <span class="tournament-form-required">*</span>
            </label>
            <select
              v-model="form.templateId"
              required
              class="pp-select"
            >
              <option value="" disabled>{{ t('tournament.selectTemplatePlaceholder') }}</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>

          <!-- Template Description -->
          <p v-if="selectedTemplate?.description" class="tournament-form-template-description">
            {{ selectedTemplate.description }}
          </p>

          <!-- Template Preview -->
          <div v-if="selectedTemplate" class="tournament-form-template-preview">
            <p class="tournament-form-template-preview-label">{{ t('tournament.templatePreview') }}</p>
            <div class="tournament-form-template-levels">
              <div v-for="level in selectedTemplate.levels" :key="level.levelNumber" class="tournament-form-template-level-row">
                <span>{{ level.isBreak ? t('tournament.break') : t('tournament.level') + ' ' + level.levelNumber }}</span>
                <span v-if="!level.isBreak">{{ level.smallBlind }}/{{ level.bigBlind }} ({{ level.ante > 0 ? 'Ante ' + level.ante : 'No Ante' }}) - {{ level.durationMinutes }}min</span>
                <span v-else>{{ level.durationMinutes }}min</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="tournament-form-actions">
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
            <IonIcon v-if="saving" :icon="refreshOutline" class="tournament-form-spinner" />
            {{ saving ? t('status.saving') : (mode === 'create' ? t('tournament.create') : t('tournament.save')) }}
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
import type { Tournament, TournamentFormData, BlindStructureTemplate } from '~/types/tournament'

interface Props {
  isOpen: boolean
  tournament: Tournament | null
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

// Fetch blind structure templates
const templates = ref<BlindStructureTemplate[]>([])

const fetchTemplates = async () => {
  try {
    const { blindStructureTemplates } = await GqlGetBlindStructureTemplates()
    templates.value = blindStructureTemplates ?? []
  } catch (error) {
    console.error('Failed to fetch blind structure templates:', error)
  }
}

// Fetch templates on component mount
onMounted(() => {
  fetchTemplates()
})

// Computed to get selected template details
const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === form.value.templateId)
})

// Form state
const form = ref<TournamentFormData>({
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  buyInCents: 0,
  seatCap: null,
  earlyBirdBonusChips: null,
  lateRegistrationLevel: null,
  templateId: ''
})

const saving = ref(false)

// Computed for buy-in in euros (display)
const buyInEuros = computed({
  get: () => form.value.buyInCents / 100,
  set: (val: number) => { form.value.buyInCents = Math.round(val * 100) }
})

// Validation
const isFormValid = computed(() => {
  return form.value.name.trim() &&
         form.value.startTime &&
         form.value.buyInCents >= 0 &&
         form.value.templateId
})

// Helper to format date for datetime-local input
const formatDateTimeLocal = (isoString: string): string => {
  const date = new Date(isoString)
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Watch for mode/tournament changes to populate form
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.tournament && props.mode === 'edit') {
    form.value = {
      name: props.tournament.title,
      description: props.tournament.description || '',
      startTime: formatDateTimeLocal(props.tournament.startTime),
      endTime: props.tournament.endTime ? formatDateTimeLocal(props.tournament.endTime) : '',
      buyInCents: props.tournament.buyInCents,
      seatCap: props.tournament.seatCap || null,
      earlyBirdBonusChips: null,
      lateRegistrationLevel: props.tournament.lateRegistrationLevel ?? null,
      templateId: templates.value[0]?.id ?? ''
    }
  } else if (isOpen && props.mode === 'create') {
    form.value = {
      name: '',
      description: '',
      startTime: '',
      endTime: '',
      buyInCents: 0,
      seatCap: null,
      earlyBirdBonusChips: null,
      lateRegistrationLevel: null,
      templateId: templates.value[0]?.id ?? ''
    }
  }
})

// Submit handler
const handleSubmit = async () => {
  if (!isFormValid.value) return

  saving.value = true
  try {
    if (props.mode === 'create') {
      await GqlCreateTournament({
        input: {
          clubId: clubStore.club?.id || '',
          name: form.value.name,
          description: form.value.description || undefined,
          startTime: new Date(form.value.startTime).toISOString(),
          endTime: form.value.endTime ? new Date(form.value.endTime).toISOString() : undefined,
          buyInCents: form.value.buyInCents,
          seatCap: form.value.seatCap || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          lateRegistrationLevel: form.value.lateRegistrationLevel || undefined,
          templateId: form.value.templateId
        }
      })
    } else if (props.tournament) {
      await GqlUpdateTournament({
        input: {
          id: props.tournament.id,
          name: form.value.name,
          description: form.value.description || undefined,
          startTime: new Date(form.value.startTime).toISOString(),
          endTime: form.value.endTime ? new Date(form.value.endTime).toISOString() : undefined,
          buyInCents: form.value.buyInCents,
          seatCap: form.value.seatCap || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          lateRegistrationLevel: form.value.lateRegistrationLevel || undefined,
          templateId: form.value.templateId
        }
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save tournament:', error)
    toast.error(t('tournament.saveFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<style scoped>
.tournament-form-header-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--pp-bg-secondary);
}

.tournament-form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--pp-text-primary);
}

.tournament-form-close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.tournament-form > * + * {
  margin-top: 1.5rem;
}

.tournament-form-section > * + * {
  margin-top: 1rem;
}

.tournament-form-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--pp-text-primary);
}

.tournament-form-field {
  display: flex;
  flex-direction: column;
}

.tournament-form-required {
  color: var(--pp-red-400);
}

.tournament-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tournament-form-help {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.tournament-form-template-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

.tournament-form-template-preview {
  padding: 0.75rem;
  background-color: var(--pp-bg-primary);
  border-radius: 0.5rem;
  border: 1px solid var(--pp-border);
}

.tournament-form-template-preview-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
}

.tournament-form-template-levels {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  max-height: 8rem;
  overflow-y: auto;
}

.tournament-form-template-levels > * + * {
  margin-top: 0.25rem;
}

.tournament-form-template-level-row {
  display: flex;
  justify-content: space-between;
}

.tournament-form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--pp-border);
}

.tournament-form-spinner {
  width: 1rem;
  height: 1rem;
  animation: pp-spin 1s linear infinite;
}
</style>
