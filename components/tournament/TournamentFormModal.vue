<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-pp-bg-secondary rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-pp-border shadow-2xl" style="background-color: #24242a !important;">
      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-pp-border/50 bg-pp-bg-secondary" style="background-color: #24242a !important;">
        <h2 class="text-xl font-bold text-pp-text-primary">
          {{ mode === 'create' ? t('tournament.createTournament') : t('tournament.editTournament') }}
        </h2>
        <button
          @click="closeModal"
          class="p-2 text-white/60 hover:text-white rounded-lg hover:bg-pp-bg-primary/50 transition-colors"
        >
          <IonIcon :icon="closeOutline" class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Basic Info Section -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-pp-text-primary">{{ t('tournament.basicInfo') }}</h3>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              {{ t('tournament.name') }} <span class="text-red-400">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              :placeholder="t('tournament.namePlaceholder')"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              {{ t('tournament.description') }}
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              :placeholder="t('tournament.descriptionPlaceholder')"
            />
          </div>

          <!-- Start Time / End Time row -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.startTime') }} <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.startTime"
                type="datetime-local"
                required
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.endTime') }}
              </label>
              <input
                v-model="form.endTime"
                type="datetime-local"
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
          </div>

          <!-- Buy-in / Seat Cap row -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.buyIn') }} (EUR) <span class="text-red-400">*</span>
              </label>
              <input
                v-model.number="buyInEuros"
                type="number"
                min="0"
                step="0.01"
                required
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/70 mb-2">
                {{ t('tournament.seatCap') }}
              </label>
              <input
                v-model.number="form.seatCap"
                type="number"
                min="2"
                class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
                :placeholder="t('tournament.unlimited')"
              />
            </div>
          </div>

          <!-- Early Bird Bonus -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              {{ t('tournament.earlyBirdBonus') }}
            </label>
            <input
              v-model.number="form.earlyBirdBonusChips"
              type="number"
              min="0"
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
              :placeholder="t('tournament.earlyBirdBonusPlaceholder')"
            />
          </div>
        </div>

        <!-- Blind Structure Template Section -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-pp-text-primary">{{ t('tournament.blindStructure') }}</h3>

          <!-- Template Dropdown -->
          <div>
            <label class="block text-sm font-medium text-white/70 mb-2">
              {{ t('tournament.selectTemplate') }} <span class="text-red-400">*</span>
            </label>
            <select
              v-model="form.templateId"
              required
              class="w-full px-3 py-2 bg-pp-bg-primary border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-pp-accent-gold focus:border-pp-accent-gold"
            >
              <option value="" disabled>{{ t('tournament.selectTemplatePlaceholder') }}</option>
              <option v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </div>

          <!-- Template Description -->
          <p v-if="selectedTemplate?.description" class="text-sm text-white/60">
            {{ selectedTemplate.description }}
          </p>

          <!-- Template Preview -->
          <div v-if="selectedTemplate" class="p-3 bg-pp-bg-primary rounded-lg border border-pp-border">
            <p class="text-xs text-white/60 mb-2">{{ t('tournament.templatePreview') }}</p>
            <div class="text-sm text-white/80 space-y-1 max-h-32 overflow-y-auto">
              <div v-for="level in selectedTemplate.levels" :key="level.levelNumber" class="flex justify-between">
                <span>{{ level.isBreak ? t('tournament.break') : t('tournament.level') + ' ' + level.levelNumber }}</span>
                <span v-if="!level.isBreak">{{ level.smallBlind }}/{{ level.bigBlind }} ({{ level.ante > 0 ? 'Ante ' + level.ante : 'No Ante' }}) - {{ level.durationMinutes }}min</span>
                <span v-else>{{ level.durationMinutes }}min</span>
              </div>
            </div>
          </div>
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
      templateId: templates.value.length > 0 ? templates.value[0].id : ''
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
      templateId: templates.value.length > 0 ? templates.value[0].id : ''
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
          templateId: form.value.templateId
        }
      })
    }
    emit('saved')
  } catch (error) {
    console.error('Failed to save tournament:', error)
    alert(t('tournament.saveFailed'))
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>
