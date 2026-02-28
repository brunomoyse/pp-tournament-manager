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
        <h3>{{ t('modals.linkClubTables.title') }}</h3>
        <button
          @click="closeModal"
          class="pp-close-button"
        >
          <IonIcon :icon="closeOutline" class="icon-md" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-text">{{ t('messages.loadingClubTables') }}</div>
      </div>

      <!-- Table Selection -->
      <div v-else-if="clubTables && clubTables.length > 0" class="pp-modal-body table-selection-body">
        <p class="selection-description">
          {{ t('messages.selectTablesToAssign', { clubName }) }}
        </p>

        <!-- Table Format Selector -->
        <div class="format-selector">
          <label class="pp-label">
            {{ t('seating.tableFormat') }}
          </label>
          <div class="format-options">
            <button
              v-for="format in tableFormats"
              :key="format"
              @click="selectedFormat = format"
              :class="[
                'format-button',
                selectedFormat === format ? 'format-button--active' : ''
              ]"
            >
              {{ format }}-max
            </button>
          </div>
        </div>

        <div class="table-list">
          <div
            v-for="table in clubTables"
            :key="table.id"
            :class="[
              'table-row',
              table.isAssigned ? 'table-row--disabled' : 'table-row--selectable'
            ]"
          >
            <div class="table-row-left">
              <input
                :id="`table-${table.id}`"
                v-model="selectedTableIds"
                :value="table.id"
                :disabled="table.isAssigned"
                type="checkbox"
                :class="[
                  'table-checkbox',
                  table.isAssigned ? 'table-checkbox--disabled' : ''
                ]"
              />
              <label
                :for="`table-${table.id}`"
                :class="[
                  'table-label',
                  table.isAssigned ? 'table-label--disabled' : ''
                ]"
              >
                <div :class="[
                  'table-name',
                  table.isAssigned ? 'table-name--disabled' : ''
                ]">
                  {{ `${t('labels.table')} ${table.tableNumber}` }}
                  {{ table.isAssigned ? ` (${t('seating.alreadyAssigned')})` : '' }}
                </div>
                <div :class="[
                  'table-seats',
                  table.isAssigned ? 'table-seats--disabled' : ''
                ]">
                  {{ table.maxSeats }} {{ t('labels.seats') }}
                </div>
              </label>
            </div>
            <div :class="[
              'table-status-badge',
              table.isAssigned
                ? 'table-status-badge--assigned'
                : table.isActive
                  ? 'table-status-badge--active'
                  : 'table-status-badge--inactive'
            ]">
              {{ table.isAssigned ? t('status.assigned') : table.isActive ? t('status.active') : t('status.inactive') }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="pp-modal-footer table-actions">
          <button
            @click="closeModal"
            class="pp-action-button pp-action-button--secondary"
          >
            {{ t('buttons.cancel') }}
          </button>
          <button
            @click="assignSelectedTables"
            :disabled="selectedTableIds.length === 0 || assigning"
            class="pp-action-button pp-action-button--primary"
          >
            <IonIcon v-if="assigning" :icon="refreshOutline" class="icon-sm pp-animate-spin" />
            {{ assigning ? t('status.linking') : `${t('buttons.link')} ${selectedTableIds.length} ${t('labels.tables')}` }}
          </button>
        </div>
      </div>

      <!-- No Tables State -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-state-title">{{ t('messages.noTablesFound') }}</div>
        <div class="empty-state-subtitle">{{ t('messages.contactClubAdmin') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { closeOutline, refreshOutline } from 'ionicons/icons'
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
const selectedTableIds = ref<string[]>([])
const tableFormats = [6, 8, 9, 10]
const selectedFormat = ref(9)

// Watch for modal opening to fetch tables
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.clubId) {
    await fetchClubTables()
  }
})

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
  if (selectedTableIds.value.length === 0) return

  try {
    assigning.value = true

    // Assign each selected table
    for (const clubTableId of selectedTableIds.value) {
      await GqlAssignTableToTournament({
        input: {
          tournamentId: props.tournamentId,
          clubTableId,
          maxSeats: selectedFormat.value,
        }
      })
    }

    emit('tablesAssigned')
    closeModal()
  } catch (error) {
    console.error('Failed to assign tables:', error)
    toast.error(t('toast.assignTablesFailed'))
  } finally {
    assigning.value = false
  }
}

const closeModal = () => {
  selectedTableIds.value = []
  selectedFormat.value = 9
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

.format-selector {
  margin-bottom: 1rem;
}

.format-options {
  display: flex;
  gap: 0.5rem;
}

.format-button {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: 1px solid var(--pp-border);
  background-color: var(--pp-bg-primary);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.format-button:hover {
  border-color: rgba(254, 231, 138, 0.3);
}

.format-button--active {
  background-color: rgba(254, 231, 138, 0.2);
  color: var(--pp-accent-gold);
  border-color: rgba(254, 231, 138, 0.4);
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
  border-color: rgba(254, 231, 138, 0.5);
}

.table-row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.table-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--pp-accent-gold);
  background-color: var(--pp-bg-primary);
  border: 1px solid var(--pp-border);
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

.table-actions {
  padding: 1rem 0 0 0;
  border-top: 1px solid rgba(84, 84, 95, 0.5);
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

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}
</style>
