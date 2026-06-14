<template>
  <PpModal :open="isOpen" size="md" :title="t('modals.linkClubTables.title')" @close="closeModal">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-text">{{ t('messages.loadingClubTables') }}</div>
    </div>

    <!-- Table Selection -->
    <div v-else-if="clubTables && clubTables.length > 0" class="table-selection-body">
      <p class="selection-description">
        {{ t('messages.selectTablesToAssign', { clubName }) }}
      </p>

      <div class="table-list">
        <div
          v-for="table in clubTables"
          :key="table.id"
          :class="['table-row', table.isAssigned ? 'table-row--disabled' : 'table-row--selectable']"
        >
          <div class="table-row-left">
            <input
              :id="`table-${table.id}`"
              :checked="isSelected(table.id)"
              :disabled="table.isAssigned"
              type="checkbox"
              :class="['table-checkbox', table.isAssigned ? 'table-checkbox--disabled' : '']"
              @change="toggleTable(table)"
            />
            <label
              :for="`table-${table.id}`"
              :class="['table-label', table.isAssigned ? 'table-label--disabled' : '']"
            >
              <div :class="['table-name', table.isAssigned ? 'table-name--disabled' : '']">
                {{ `${t('labels.table')} ${table.tableNumber}` }}
                {{ table.isAssigned ? ` (${t('seating.alreadyAssigned')})` : '' }}
              </div>
              <div :class="['table-seats', table.isAssigned ? 'table-seats--disabled' : '']">
                {{ table.maxSeats }} {{ t('labels.seats') }} {{ t('seating.naturalCapacity') }}
              </div>
            </label>
          </div>

          <!-- Per-table seat count override -->
          <div class="table-row-right">
            <select
              v-if="!table.isAssigned && isSelected(table.id)"
              :value="selectedTables[table.id]"
              class="seat-count-select"
              :aria-label="t('seating.tableFormat')"
              @change="setSeatCount(table.id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="format in tableFormats" :key="format" :value="format">
                {{ format }}-max
              </option>
            </select>
            <div
              v-else
              :class="[
                'table-status-badge',
                table.isAssigned
                  ? 'table-status-badge--assigned'
                  : table.isActive
                    ? 'table-status-badge--active'
                    : 'table-status-badge--inactive',
              ]"
            >
              {{
                table.isAssigned
                  ? t('status.assigned')
                  : table.isActive
                    ? t('status.active')
                    : t('status.inactive')
              }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Tables State -->
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-state-title">{{ t('messages.noTablesFound') }}</div>
      <div class="empty-state-subtitle">{{ t('messages.contactClubAdmin') }}</div>
    </div>

    <template #footer>
      <PpButton variant="secondary" @click="closeModal">
        {{ t('buttons.cancel') }}
      </PpButton>
      <PpButton
        variant="primary"
        :disabled="selectedCount === 0 || assigning"
        :loading="assigning"
        @click="assignSelectedTables"
      >
        {{
          assigning
            ? t('status.linking')
            : `${t('buttons.link')} ${selectedCount} ${t('labels.tables')}`
        }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
const toast = useToast()

interface ClubTable {
  id: string
  clubId: string
  tableNumber: number
  maxSeats: number
  isActive: boolean
  isAssigned?: boolean
}

interface Props {
  isOpen: boolean
  clubId: string
  clubName: string
  tournamentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  tablesAssigned: []
}>()

// State
const loading = ref(false)
const assigning = ref(false)
const clubTables = ref<ClubTable[]>([])
// tableId -> chosen maxSeats. Presence in the map = selected.
const selectedTables = reactive<Record<string, number>>({})
const tableFormats = [6, 8, 9, 10] as const

const selectedCount = computed(() => Object.keys(selectedTables).length)

const isSelected = (tableId: string) => tableId in selectedTables

const toggleTable = (table: ClubTable) => {
  if (table.isAssigned) return
  if (isSelected(table.id)) {
    delete selectedTables[table.id]
  } else {
    // Default to the table's natural maxSeats, snapped into the allowed formats
    const natural = table.maxSeats
    const fallback = tableFormats.includes(natural as any)
      ? natural
      : tableFormats.reduce(
          (best, f) => (Math.abs(f - natural) < Math.abs(best - natural) ? f : best),
          tableFormats[0],
        )
    selectedTables[table.id] = fallback
  }
}

const setSeatCount = (tableId: string, value: string) => {
  const n = Number(value)
  if (!Number.isNaN(n)) selectedTables[tableId] = n
}

const resetSelection = () => {
  for (const key of Object.keys(selectedTables)) delete selectedTables[key]
}

// Watch for modal opening to fetch tables
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && props.clubId) {
      await fetchClubTables()
    }
  },
)

// Methods
const fetchClubTables = async () => {
  if (!props.clubId) return

  try {
    loading.value = true
    const result = await GqlGetClubTables({ clubId: props.clubId })
    clubTables.value = result?.clubTables || []
  } catch (error) {
    console.error('Failed to fetch club tables:', error)
    clubTables.value = []
  } finally {
    loading.value = false
  }
}

const assignSelectedTables = async () => {
  if (selectedCount.value === 0) return

  const entries = Object.entries(selectedTables).map(([clubTableId, maxSeats]) => ({
    clubTableId,
    maxSeats,
  }))

  try {
    assigning.value = true
    await GqlAssignTablesToTournament({
      input: {
        tournamentId: props.tournamentId,
        tables: entries,
      },
    })
    emit('tablesAssigned')
    closeModal()
  } catch (error) {
    // Server rolls back on any failure, so no partial state to reconcile.
    console.error('Failed to assign tables:', error)
    toast.error(t('toast.assignTablesFailed'))
  } finally {
    assigning.value = false
  }
}

const closeModal = () => {
  resetSelection()
  emit('close')
}
</script>

<style scoped>
.loading-state {
  text-align: center;
  padding: 2rem 0;
}

.loading-text {
  color: rgba(255, 255, 255, 0.6);
}

.table-selection-body > * + * {
  margin-top: 1rem;
}

.selection-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.table-row-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.seat-count-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 0.375rem 1.75rem 0.375rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  background-color: rgba(var(--pp-accent-rgb), 0.12);
  color: var(--color-pp-gold);
  border: 1px solid rgba(var(--pp-accent-rgb), 0.4);
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23fee78a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.375rem center;
  background-size: 1rem 1rem;
}

.seat-count-select:focus {
  outline: none;
  border-color: var(--color-pp-gold);
}

.table-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 16rem;
  overflow-y: auto;
}

.table-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid;
  transition: all 0.2s ease;
}

.table-row--disabled {
  background-color: rgba(24, 24, 26, 0.1);
  border-color: rgba(84, 84, 95, 0.3);
  opacity: 0.5;
  cursor: not-allowed;
}

.table-row--selectable {
  background-color: rgba(24, 24, 26, 0.3);
  border-color: rgba(84, 84, 95, 0.5);
}

.table-row--selectable:hover {
  border-color: rgba(var(--pp-accent-rgb), 0.5);
}

.table-row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.table-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-pp-gold);
  background-color: var(--color-pp-bg);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.25rem;
}

.table-checkbox--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.table-label {
  flex: 1;
  cursor: pointer;
}

.table-label--disabled {
  cursor: not-allowed;
}

.table-name {
  font-weight: 600;
  color: #ffffff;
}

.table-name--disabled {
  color: rgba(255, 255, 255, 0.4);
}

.table-seats {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.table-seats--disabled {
  color: rgba(255, 255, 255, 0.3);
}

.table-status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.table-status-badge--assigned {
  background-color: rgba(107, 114, 128, 0.2);
  color: var(--pp-gray-400);
}

.table-status-badge--active {
  background-color: rgba(34, 197, 94, 0.2);
  color: var(--pp-green-400);
}

.table-status-badge--inactive {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--pp-red-400);
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

.empty-state-title {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
}

.empty-state-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}
</style>
