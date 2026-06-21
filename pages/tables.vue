<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <div class="page-header">
          <PpFadeUp>
            <p class="eyebrow">{{ t('nav.tables') }}</p>
            <h1 class="page-title">{{ t('tables.title') }}</h1>
            <p class="page-subtitle">{{ t('tables.subtitle') }}</p>
          </PpFadeUp>
        </div>

        <!-- Add table -->
        <PpFadeUp :delay="0.05">
          <form class="add-panel" @submit.prevent="addTable">
            <div class="add-field">
              <label class="pp-label">{{ t('tables.number') }}</label>
              <input
                v-model.number="form.tableNumber"
                type="number"
                min="1"
                class="pp-input"
                required
              />
            </div>
            <div class="add-field">
              <label class="pp-label">{{ t('tables.seats') }}</label>
              <input
                v-model.number="form.maxSeats"
                type="number"
                min="2"
                max="12"
                class="pp-input"
              />
            </div>
            <label class="default-check">
              <input v-model="form.isDefault" type="checkbox" />
              <span>{{ t('tables.defaultSet') }}</span>
            </label>
            <PpButton type="submit" :loading="saving">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('tables.add') }}
            </PpButton>
          </form>
        </PpFadeUp>

        <p class="hint">{{ t('tables.defaultHint') }}</p>

        <!-- Tables list -->
        <div class="tables-card">
          <div v-if="loading" class="centered-state">{{ t('status.loading') }}</div>
          <div v-else-if="tables.length === 0" class="centered-state">
            <IonIcon :icon="gridOutline" class="empty-icon" />
            <p class="empty-text">{{ t('tables.empty') }}</p>
          </div>
          <div v-else class="tables-list">
            <div v-for="table in sortedTables" :key="table.id" class="table-row">
              <div class="table-id">
                <span class="table-num">#{{ table.tableNumber }}</span>
                <span class="table-seats">{{ table.maxSeats }} {{ t('tables.seatsShort') }}</span>
              </div>
              <div class="table-flags">
                <PpBadge v-if="table.isAssigned" variant="warning">{{ t('tables.inUse') }}</PpBadge>
                <button
                  type="button"
                  class="default-toggle"
                  :class="{ 'default-toggle--on': table.isDefault }"
                  @click="toggleDefault(table)"
                >
                  <IonIcon
                    :icon="table.isDefault ? checkmarkCircle : ellipseOutline"
                    class="icon-sm"
                  />
                  {{ t('tables.defaultSet') }}
                </button>
              </div>
              <div class="table-actions">
                <button
                  type="button"
                  class="row-action row-action--danger"
                  :disabled="table.isAssigned"
                  :title="t('common.delete')"
                  :aria-label="t('common.delete')"
                  @click="removeTable(table)"
                >
                  <IonIcon :icon="trashOutline" class="row-action-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', title: 'nav.tables' })

import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  addOutline,
  gridOutline,
  trashOutline,
  checkmarkCircle,
  ellipseOutline,
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import type { ClubTable } from '~/types/seating'

const clubStore = useClubStore()
const { t } = useI18n()
const toast = useToast()

const club = computed(() => clubStore.club)
const loading = ref(true)
const saving = ref(false)
const tables = ref<ClubTable[]>([])
const form = ref<{ tableNumber: number | null; maxSeats: number; isDefault: boolean }>({
  tableNumber: null,
  maxSeats: 9,
  isDefault: true,
})

const sortedTables = computed(() =>
  [...tables.value].toSorted((a, b) => a.tableNumber - b.tableNumber),
)

const fetchTables = async () => {
  if (!club.value) return
  try {
    loading.value = true
    const result = await GqlGetClubTables({ clubId: club.value.id })
    tables.value = (result?.clubTables || []) as ClubTable[]
  } catch (error) {
    console.error('Failed to fetch tables:', error)
  } finally {
    loading.value = false
  }
}

const addTable = async () => {
  if (!club.value || !form.value.tableNumber) return
  saving.value = true
  try {
    await GqlCreateClubTable({
      input: {
        clubId: club.value.id,
        tableNumber: form.value.tableNumber,
        maxSeats: form.value.maxSeats,
        isDefault: form.value.isDefault,
      },
    })
    form.value = {
      tableNumber: null,
      maxSeats: form.value.maxSeats,
      isDefault: form.value.isDefault,
    }
    await fetchTables()
  } catch (error) {
    toast.error(extractError(error, t('tables.addFailed')))
  } finally {
    saving.value = false
  }
}

const toggleDefault = async (table: ClubTable) => {
  try {
    await GqlUpdateClubTable({ input: { id: table.id, isDefault: !table.isDefault } })
    await fetchTables()
  } catch (error) {
    toast.error(extractError(error, t('tables.updateFailed')))
  }
}

const removeTable = async (table: ClubTable) => {
  if (!confirm(t('tables.deleteConfirm', { number: table.tableNumber }))) return
  try {
    await GqlDeleteClubTable({ id: table.id })
    await fetchTables()
  } catch (error) {
    toast.error(extractError(error, t('tables.deleteFailed')))
  }
}

// Surface the backend's human-readable message (duplicate number, in-use, …).
const extractError = (error: unknown, fallback: string): string => {
  const e = error as { gqlErrors?: { message?: string }[]; message?: string }
  return e?.gqlErrors?.[0]?.message || e?.message || fallback
}

onMounted(fetchTables)
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.5rem 1rem;
}

@media (min-width: 640px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.page-header {
  margin-bottom: 2rem;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
}

.page-title {
  margin-top: 0.65rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw + 0.5rem, 2.5rem);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-pp-text);
}

.page-subtitle {
  margin-top: 0.4rem;
  color: var(--color-pp-text-muted);
  font-size: 0.9rem;
  max-width: 40ch;
}

.add-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-pp-surface-2);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 1rem;
}

.add-field {
  display: flex;
  flex-direction: column;
  width: 7rem;
}

.default-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-pp-text-muted);
  cursor: pointer;
  padding-bottom: 0.5rem;
}

.hint {
  margin: 0.75rem 0 1.5rem;
  font-size: 0.8rem;
  color: var(--color-pp-text-dim);
}

.tables-card {
  background-color: var(--color-pp-surface-2);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 1rem;
}

.centered-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--color-pp-text-muted);
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 auto 0.75rem;
}

.tables-list > * + * {
  border-top: 1px solid var(--color-pp-border-strong);
}

.table-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
}

.table-id {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.table-num {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-pp-text);
}

.table-seats {
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
}

.table-flags {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.default-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-pp-border-strong);
  font-size: 0.75rem;
  color: var(--color-pp-text-dim);
  cursor: pointer;
  transition: all 0.2s ease;
}

.default-toggle--on {
  border-color: var(--color-pp-gold);
  color: var(--color-pp-gold);
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}

.icon-md {
  width: 1.15rem;
  height: 1.15rem;
}

/* Actions - quiet icon button; reddens only on hover (matches the players list). */
.table-actions {
  display: flex;
  justify-content: flex-end;
}

.row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 0.625rem;
  background: transparent;
  color: var(--color-pp-text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    transform 0.1s ease;
}

.row-action:hover {
  color: var(--color-pp-text);
  background-color: rgba(255, 255, 255, 0.06);
}

.row-action:active {
  transform: scale(0.94);
}

.row-action:focus-visible {
  outline: 2px solid var(--color-pp-gold);
  outline-offset: 2px;
}

.row-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.row-action--danger:not(:disabled):hover {
  color: var(--color-pp-danger);
  background-color: rgba(239, 68, 68, 0.12);
}

.row-action-icon {
  width: 1.15rem;
  height: 1.15rem;
}
</style>
