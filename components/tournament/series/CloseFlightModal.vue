<template>
  <PpModal :open="open" :title="t('series.closeFlightTitle')" size="md" @close="emit('close')">
    <p class="hint">{{ t('series.closeFlightHint') }}</p>

    <div v-if="loading" class="empty">{{ t('common.loading') }}</div>
    <div v-else-if="survivors.length === 0" class="empty">{{ t('series.noSurvivors') }}</div>
    <div v-else class="survivors">
      <div class="survivor-head">
        <span>{{ t('series.player') }}</span>
        <span>{{ t('series.chipStack') }}</span>
      </div>
      <div v-for="s in survivors" :key="s.clubPlayerId" class="survivor-row">
        <span class="survivor-name">{{ s.displayName }}</span>
        <input v-model.number="s.chipCount" type="number" min="0" class="pp-input stack-input" />
      </div>
    </div>

    <template #footer>
      <PpButton variant="ghost" @click="emit('close')">{{ t('common.cancel') }}</PpButton>
      <PpButton
        variant="primary"
        :loading="saving"
        :disabled="
          survivors.length === 0 || survivors.some((s) => !s.chipCount || s.chipCount <= 0)
        "
        @click="submit"
      >
        {{ t('series.confirmClose') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n'

const props = defineProps<{ open: boolean; tournamentId: string }>()
const emit = defineEmits<{ close: []; closed: [] }>()

const { t } = useI18n()
const toast = useToast()

interface Survivor {
  clubPlayerId: string
  displayName: string
  chipCount: number
}
const survivors = ref<Survivor[]>([])
const loading = ref(false)
const saving = ref(false)

const loadSurvivors = async () => {
  loading.value = true
  try {
    const { tournamentSeatingChart } = await GqlGetTournamentSeatingChart({
      tournamentId: props.tournamentId,
    })
    const list: Survivor[] = []
    for (const table of tournamentSeatingChart?.tables ?? []) {
      for (const seat of table.seats ?? []) {
        if (seat.assignment?.clubPlayerId) {
          list.push({
            clubPlayerId: seat.assignment.clubPlayerId,
            displayName: seat.displayName || t('series.player'),
            chipCount: seat.assignment.stackSize ?? 0,
          })
        }
      }
    }
    survivors.value = list.toSorted((a, b) => b.chipCount - a.chipCount)
  } catch (e) {
    console.error('Failed to load seating chart:', e)
    survivors.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) loadSurvivors()
  },
)

const submit = async () => {
  saving.value = true
  try {
    await GqlCloseFlight({
      input: {
        tournamentId: props.tournamentId,
        survivors: survivors.value.map((s) => ({
          clubPlayerId: s.clubPlayerId,
          chipCount: s.chipCount,
        })),
      },
    })
    toast.success(t('series.flightClosed'))
    emit('closed')
  } catch (e) {
    console.error('Failed to close flight:', e)
    toast.error(t('series.closeError'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.hint {
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
  margin-bottom: 1rem;
}
.empty {
  text-align: center;
  color: var(--color-pp-text-dim);
  padding: 1.5rem 0;
}
.survivors {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.survivor-head {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pp-text-dim);
  padding-bottom: 0.25rem;
}
.survivor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.survivor-name {
  font-size: 0.9rem;
  color: var(--color-pp-text);
}
.stack-input {
  flex: 0 0 9rem;
  text-align: right;
}
</style>
