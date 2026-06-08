<template>
  <PpModal :open="isOpen" size="2xl" @close="closeModal">
    <!-- Form -->
    <template #header>
      <div class="tournament-form-header-sticky">
        <h2 class="tournament-form-title">
          {{
            mode === 'create' ? t('tournament.createTournament') : t('tournament.editTournament')
          }}
        </h2>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="tournament-form">
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
          <input v-model="form.startTime" type="datetime-local" required class="pp-input" />
        </div>

        <!-- Buy-in / Rake / Seat Cap row -->
        <div class="tournament-form-row tournament-form-row--3col">
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
            <label class="pp-label"> {{ t('tournament.rake') }} (EUR) </label>
            <input v-model.number="rakeEuros" type="number" min="0" step="0.01" class="pp-input" />
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

        <!-- Level-2 Bonus -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.levelTwoBonus') }}
          </label>
          <input
            v-model.number="form.levelTwoBonusChips"
            type="number"
            min="0"
            class="pp-input"
            :placeholder="t('tournament.levelTwoBonusPlaceholder')"
          />
        </div>

        <!-- Mandatory Drink Voucher (euros) -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.voucherValue') }}
          </label>
          <input
            v-model.number="voucherValueEuros"
            type="number"
            min="0"
            step="0.5"
            class="pp-input"
            :placeholder="t('tournament.voucherValuePlaceholder')"
          />
          <p class="tournament-form-help">{{ t('tournament.voucherValueHelp') }}</p>
        </div>

        <!-- Rebuy max -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.rebuyMax') }}
          </label>
          <input
            v-model.number="form.rebuyMax"
            type="number"
            min="0"
            class="pp-input"
            :placeholder="t('tournament.unlimited')"
          />
        </div>

        <!-- Add-on chips -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.addonChips') }}
          </label>
          <input
            v-model.number="form.addonChips"
            type="number"
            min="0"
            class="pp-input"
            :placeholder="t('tournament.earlyBirdBonusPlaceholder')"
          />
        </div>

        <!-- Add-on price (euros) -->
        <div class="tournament-form-field">
          <label class="pp-label">
            {{ t('tournament.addonPrice') }}
          </label>
          <input
            v-model.number="addonPriceEuros"
            type="number"
            min="0"
            step="0.5"
            class="pp-input"
            :placeholder="t('tournament.voucherValuePlaceholder')"
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
          <select v-model="form.templateId" required class="pp-select">
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
          <p class="tournament-form-template-preview-label">
            {{ t('tournament.templatePreview') }}
          </p>
          <div class="tournament-form-template-levels">
            <div
              v-for="level in selectedTemplate.levels"
              :key="level.levelNumber"
              class="tournament-form-template-level-row"
            >
              <span>{{
                level.isBreak
                  ? t('tournament.break')
                  : t('tournament.level') + ' ' + level.levelNumber
              }}</span>
              <span v-if="!level.isBreak"
                >{{ level.smallBlind }}/{{ level.bigBlind }} ({{
                  level.ante > 0 ? 'Ante ' + level.ante : 'No Ante'
                }}) - {{ level.durationMinutes }}min</span
              >
              <span v-else>{{ level.durationMinutes }}min</span>
            </div>
          </div>
        </div>
      </div>
    </form>

    <!-- Actions Footer -->
    <template #footer>
      <PpButton variant="secondary" @click="closeModal">
        {{ t('common.cancel') }}
      </PpButton>
      <PpButton
        variant="primary"
        type="submit"
        :disabled="!isFormValid || saving"
        :loading="saving"
        @click="handleSubmit"
      >
        {{
          saving
            ? t('status.saving')
            : mode === 'create'
              ? t('tournament.create')
              : t('tournament.save')
        }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
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
  return templates.value.find((t) => t.id === form.value.templateId)
})

// Form state
const form = ref<TournamentFormData>({
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  buyInCents: 0,
  rakeCents: 0,
  seatCap: null,
  earlyBirdBonusChips: null,
  levelTwoBonusChips: null,
  voucherValueCents: null,
  rebuyMax: null,
  addonChips: null,
  addonPriceCents: null,
  lateRegistrationLevel: null,
  templateId: '',
})

const saving = ref(false)

// Computed for voucher value in euros (display; stored as cents)
const voucherValueEuros = computed({
  get: () => (form.value.voucherValueCents ?? 0) / 100,
  set: (val: number) => {
    form.value.voucherValueCents = val ? Math.round(val * 100) : null
  },
})

// Computed for add-on price in euros (display; stored as cents)
const addonPriceEuros = computed({
  get: () => (form.value.addonPriceCents ?? 0) / 100,
  set: (val: number) => {
    form.value.addonPriceCents = val ? Math.round(val * 100) : null
  },
})

// Computed for buy-in in euros (display)
const buyInEuros = computed({
  get: () => form.value.buyInCents / 100,
  set: (val: number) => {
    form.value.buyInCents = Math.round(val * 100)
  },
})

// Computed for rake in euros (display)
const rakeEuros = computed({
  get: () => form.value.rakeCents / 100,
  set: (val: number) => {
    form.value.rakeCents = Math.round(val * 100)
  },
})

// Validation
const isFormValid = computed(() => {
  return (
    form.value.name.trim() &&
    form.value.startTime &&
    form.value.buyInCents >= 0 &&
    form.value.templateId
  )
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
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.tournament && props.mode === 'edit') {
      form.value = {
        name: props.tournament.title,
        description: props.tournament.description || '',
        startTime: formatDateTimeLocal(props.tournament.startTime),
        endTime: props.tournament.endTime ? formatDateTimeLocal(props.tournament.endTime) : '',
        buyInCents: props.tournament.buyInCents,
        rakeCents: props.tournament.rakeCents || 0,
        seatCap: props.tournament.seatCap || null,
        earlyBirdBonusChips: props.tournament.earlyBirdBonusChips ?? null,
        levelTwoBonusChips: props.tournament.levelTwoBonusChips ?? null,
        voucherValueCents: props.tournament.voucherValueCents ?? null,
        rebuyMax: props.tournament.rebuyMax ?? null,
        addonChips: props.tournament.addonChips ?? null,
        addonPriceCents: props.tournament.addonPriceCents ?? null,
        lateRegistrationLevel: props.tournament.lateRegistrationLevel ?? null,
        templateId: templates.value[0]?.id ?? '',
      }
    } else if (isOpen && props.mode === 'create') {
      form.value = {
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        buyInCents: 0,
        rakeCents: 0,
        seatCap: null,
        earlyBirdBonusChips: null,
        levelTwoBonusChips: null,
        voucherValueCents: null,
        rebuyMax: null,
        addonChips: null,
        addonPriceCents: null,
        lateRegistrationLevel: null,
        templateId: templates.value[0]?.id ?? '',
      }
    }
  },
)

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
          rakeCents: form.value.rakeCents || undefined,
          seatCap: form.value.seatCap || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          levelTwoBonusChips: form.value.levelTwoBonusChips || undefined,
          voucherValueCents: form.value.voucherValueCents ?? undefined,
          rebuyMax: form.value.rebuyMax ?? undefined,
          addonChips: form.value.addonChips || undefined,
          addonPriceCents: form.value.addonPriceCents ?? undefined,
          lateRegistrationLevel: form.value.lateRegistrationLevel || undefined,
          templateId: form.value.templateId,
        },
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
          rakeCents: form.value.rakeCents || undefined,
          seatCap: form.value.seatCap || undefined,
          earlyBirdBonusChips: form.value.earlyBirdBonusChips || undefined,
          levelTwoBonusChips: form.value.levelTwoBonusChips || undefined,
          voucherValueCents: form.value.voucherValueCents ?? undefined,
          rebuyMax: form.value.rebuyMax ?? undefined,
          addonChips: form.value.addonChips || undefined,
          addonPriceCents: form.value.addonPriceCents ?? undefined,
          lateRegistrationLevel: form.value.lateRegistrationLevel || undefined,
          templateId: form.value.templateId,
        },
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
}

.tournament-form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-pp-text);
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
  color: var(--color-pp-text);
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

.tournament-form-row--3col {
  grid-template-columns: 1fr 1fr 1fr;
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
  background-color: var(--color-pp-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--color-pp-border-strong);
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
</style>
