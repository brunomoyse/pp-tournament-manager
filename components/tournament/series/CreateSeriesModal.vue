<template>
  <PpModal :open="open" :title="t('series.createTitle')" size="lg" @close="emit('close')">
    <!-- Step indicator -->
    <div class="step-row">
      <span v-for="s in 3" :key="s" :class="['step-dot', step >= s ? 'step-dot--active' : '']">
        {{ s }}
      </span>
    </div>

    <!-- Step 1: shared config -->
    <div v-if="step === 1" class="form-col">
      <p class="step-title">{{ t('series.step.config') }}</p>
      <label class="field">
        <span class="pp-label">{{ t('series.fields.title') }}</span>
        <input
          v-model="form.title"
          type="text"
          class="pp-input"
          :placeholder="t('series.fields.titlePlaceholder')"
        />
      </label>
      <div class="grid-2">
        <label class="field">
          <span class="pp-label">{{ t('series.fields.buyIn') }} (EUR)</span>
          <input v-model.number="buyInEuros" type="number" min="0" step="0.5" class="pp-input" />
        </label>
        <label class="field">
          <span class="pp-label">{{ t('series.fields.rake') }} (EUR)</span>
          <input v-model.number="rakeEuros" type="number" min="0" step="0.5" class="pp-input" />
        </label>
        <label class="field">
          <span class="pp-label">{{ t('series.fields.seatCap') }}</span>
          <input v-model.number="form.seatCap" type="number" min="0" class="pp-input" />
        </label>
        <label class="field">
          <span class="pp-label">{{ t('series.fields.lateRegLevel') }}</span>
          <input
            v-model.number="form.lateRegistrationLevel"
            type="number"
            min="0"
            class="pp-input"
          />
        </label>
      </div>
      <label class="field">
        <span class="pp-label">{{ t('series.fields.blindTemplate') }}</span>
        <select v-model="form.templateId" class="pp-select">
          <option value="">{{ t('series.fields.noTemplate') }}</option>
          <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
        </select>
        <span class="field-hint">{{ t('series.fields.sharedHint') }}</span>
      </label>
    </div>

    <!-- Step 2: Day 1 flights -->
    <div v-else-if="step === 2" class="form-col">
      <p class="step-title">{{ t('series.step.flights') }}</p>
      <div v-for="(fl, i) in form.flights" :key="i" class="flight-row">
        <input
          v-model="fl.label"
          type="text"
          class="pp-input flight-label"
          :placeholder="t('series.flightLabelPlaceholder')"
        />
        <input v-model="fl.startTime" type="datetime-local" class="pp-input flight-time" />
        <button
          v-if="form.flights.length > 1"
          class="row-remove"
          :aria-label="t('common.delete')"
          @click="form.flights.splice(i, 1)"
        >
          <IonIcon :icon="trashOutline" />
        </button>
      </div>
      <PpButton
        variant="secondary"
        size="sm"
        @click="form.flights.push({ label: nextFlightLabel(), startTime: '' })"
      >
        <IonIcon :icon="addOutline" />
        {{ t('series.addFlight') }}
      </PpButton>
    </div>

    <!-- Step 3: final day + review -->
    <div v-else class="form-col">
      <p class="step-title">{{ t('series.step.finalDay') }}</p>
      <div class="flight-row">
        <input v-model="form.finalDay.label" type="text" class="pp-input flight-label" />
        <input
          v-model="form.finalDay.startTime"
          type="datetime-local"
          class="pp-input flight-time"
        />
      </div>
      <div class="review pp-card">
        <p class="review-line">
          <span>{{ t('series.fields.title') }}</span
          ><b>{{ form.title || '—' }}</b>
        </p>
        <p class="review-line">
          <span>{{ t('series.fields.buyIn') }}</span
          ><b>{{ formatPrice(buyInCents) }}</b>
        </p>
        <p class="review-line">
          <span>{{ t('series.flightsLabel') }}</span>
          <b>{{ form.flights.map((f) => f.label).join(', ') }} + {{ form.finalDay.label }}</b>
        </p>
      </div>
    </div>

    <template #footer>
      <PpButton v-if="step > 1" variant="ghost" @click="step--">{{ t('common.back') }}</PpButton>
      <PpButton v-if="step < 3" variant="primary" :disabled="!canAdvance" @click="step++">
        {{ t('series.next') }}
      </PpButton>
      <PpButton v-else variant="primary" :loading="saving" :disabled="!canSubmit" @click="submit">
        {{ t('series.create') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { addOutline, trashOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import type { BlindStructureTemplate } from '~/types/tournament'
import type { FlightDraft } from '~/types/series'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; created: [id: string] }>()

const { t } = useI18n()
const toast = useToast()
const clubStore = useClubStore()

const step = ref(1)
const saving = ref(false)
const templates = ref<BlindStructureTemplate[]>([])

const blankForm = () => ({
  title: '',
  seatCap: null as number | null,
  lateRegistrationLevel: null as number | null,
  templateId: '',
  flights: [
    { label: 'Day 1A', startTime: '' },
    { label: 'Day 1B', startTime: '' },
  ] as FlightDraft[],
  finalDay: { label: 'Day 2', startTime: '' } as FlightDraft,
})
const form = ref(blankForm())
const buyInEuros = ref<number>(0)
const rakeEuros = ref<number>(0)
const buyInCents = computed(() => Math.round((buyInEuros.value || 0) * 100))

const fetchTemplates = async () => {
  try {
    const { blindStructureTemplates } = await GqlGetBlindStructureTemplates()
    templates.value = blindStructureTemplates ?? []
  } catch (e) {
    console.error('Failed to fetch templates:', e)
  }
}

// Reset whenever the modal opens.
watch(
  () => props.open,
  (open) => {
    if (open) {
      step.value = 1
      form.value = blankForm()
      buyInEuros.value = 0
      rakeEuros.value = 0
      fetchTemplates()
    }
  },
)

const nextFlightLabel = () => `Day 1${String.fromCharCode(65 + form.value.flights.length)}`

const canAdvance = computed(() => {
  if (step.value === 1) return form.value.title.trim() !== '' && buyInCents.value > 0
  if (step.value === 2)
    return (
      form.value.flights.length > 0 &&
      form.value.flights.every((f) => f.label.trim() && f.startTime)
    )
  return true
})
const canSubmit = computed(
  () => canAdvance.value && !!form.value.finalDay.label.trim() && !!form.value.finalDay.startTime,
)

const toIso = (local: string) => new Date(local).toISOString()

const submit = async () => {
  const clubId = clubStore.club?.id
  if (!clubId) return
  saving.value = true
  try {
    const { createTournamentSeries } = await GqlCreateTournamentSeries({
      input: {
        clubId,
        title: form.value.title.trim(),
        buyInCents: buyInCents.value,
        rakeCents: Math.round((rakeEuros.value || 0) * 100) || undefined,
        seatCap: form.value.seatCap || undefined,
        lateRegistrationLevel: form.value.lateRegistrationLevel || undefined,
        templateId: form.value.templateId || undefined,
        flights: form.value.flights.map((f) => ({
          label: f.label.trim(),
          startTime: toIso(f.startTime),
        })),
        finalDay: {
          label: form.value.finalDay.label.trim(),
          startTime: toIso(form.value.finalDay.startTime),
        },
      },
    })
    toast.success(t('series.created'))
    emit('created', createTournamentSeries.id)
  } catch (e) {
    console.error('Failed to create series:', e)
    toast.error(t('series.createError'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.step-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.step-dot {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  background-color: var(--color-pp-surface-2);
  color: var(--color-pp-text-dim);
  border: 1px solid var(--color-pp-border-strong);
}
.step-dot--active {
  background-color: var(--color-pp-gold);
  color: var(--color-pp-bg);
  border-color: var(--color-pp-gold);
}
.form-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.step-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-pp-gold-deep);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field-hint {
  font-size: 0.7rem;
  color: var(--color-pp-text-dim);
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
.flight-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.flight-label {
  flex: 0 0 8rem;
}
.flight-time {
  flex: 1;
}
.row-remove {
  color: var(--color-pp-text-dim);
  cursor: pointer;
}
.row-remove:hover {
  color: #f87171;
}
.review {
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.review-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
}
.review-line b {
  color: var(--color-pp-text);
}
</style>
