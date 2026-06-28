<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <div class="page-header">
          <PpFadeUp>
            <p class="eyebrow">{{ tables.length }} {{ t('nav.tables') }}</p>
            <h1 class="page-title">{{ t('tables.title') }}</h1>
            <p class="page-subtitle">{{ t('tables.subtitle') }}</p>
          </PpFadeUp>
        </div>

        <!-- Inline add-tables config row -->
        <PpFadeUp :delay="0.05">
          <form class="add-panel" @submit.prevent="addTables">
            <div class="add-field">
              <label class="pp-label">{{ t('tables.quantity') }}</label>
              <input
                v-model.number="form.quantity"
                type="number"
                min="1"
                max="50"
                class="pp-input"
                required
              />
            </div>
            <div class="add-field">
              <label class="pp-label">{{ t('tables.startNumber') }}</label>
              <input
                v-model.number="form.startNumber"
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
            <p class="range-hint">{{ rangePreview }}</p>
          </form>
        </PpFadeUp>

        <p class="hint">{{ t('tables.defaultHint') }}</p>

        <!-- Table cards -->
        <div v-if="loading" class="centered-state">{{ t('status.loading') }}</div>
        <div v-else-if="tables.length === 0" class="centered-state">
          <IonIcon :icon="gridOutline" class="empty-icon" />
          <p class="empty-text">{{ t('tables.empty') }}</p>
        </div>
        <PpStagger v-else class="tables-grid" :stagger-children="0.04">
          <PpStaggerItem v-for="table in sortedTables" :key="table.id">
            <PpCard padding="none" class="table-card">
              <div class="table-card__head">
                <span class="table-num">#{{ table.tableNumber }}</span>
                <PpStatusPill v-if="table.isAssigned" tone="warning" dot>
                  {{ t('tables.inUse') }}
                </PpStatusPill>
              </div>

              <div class="felt">
                <div class="felt__oval">
                  <span
                    v-for="(pos, i) in seatPositions(table.maxSeats)"
                    :key="i"
                    class="seat-dot"
                    :style="pos"
                  />
                  <span class="felt__count">{{ table.maxSeats }}</span>
                </div>
                <span class="felt__label">{{ table.maxSeats }} {{ t('tables.seatsShort') }}</span>
              </div>

              <div class="table-card__foot">
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
            </PpCard>
          </PpStaggerItem>
        </PpStagger>
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
const form = ref<{
  quantity: number
  startNumber: number
  maxSeats: number
  isDefault: boolean
}>({
  quantity: 1,
  startNumber: 1,
  maxSeats: 9,
  isDefault: true,
})

const sortedTables = computed(() =>
  [...tables.value].toSorted((a, b) => a.tableNumber - b.tableNumber),
)

/** Next free table number = highest existing + 1 (or 1 when empty). */
const nextNumber = computed(() =>
  tables.value.length ? Math.max(...tables.value.map((t) => t.tableNumber)) + 1 : 1,
)

const rangePreview = computed(() => {
  const start = form.value.startNumber || 1
  const qty = Math.max(1, form.value.quantity || 1)
  return qty === 1
    ? t('tables.addRangeHintOne', { number: start })
    : t('tables.addRangeHint', { from: start, to: start + qty - 1, count: qty })
})

// Seat-dot positions around the oval felt (clockwise from the top), so each
// card's graphic reflects its real seat count.
const seatPositions = (seats: number) => {
  const n = Math.max(1, seats)
  return Array.from({ length: n }, (_, i) => {
    const angle = (-90 + (360 * i) / n) * (Math.PI / 180)
    return {
      left: `${50 + 40 * Math.cos(angle)}%`,
      top: `${50 + 32 * Math.sin(angle)}%`,
    }
  })
}

const fetchTables = async () => {
  if (!club.value) return
  try {
    loading.value = true
    const result = await GqlGetClubTables({ clubId: club.value.id })
    tables.value = (result?.clubTables || []) as ClubTable[]
    // Prefill the next add to start right after the last existing table.
    form.value.startNumber = nextNumber.value
  } catch (error) {
    console.error('Failed to fetch tables:', error)
  } finally {
    loading.value = false
  }
}

const addTables = async () => {
  if (!club.value) return
  const start = form.value.startNumber || 1
  const qty = Math.max(1, Math.min(50, form.value.quantity || 1))
  saving.value = true
  let added = 0
  let lastError: unknown = null
  try {
    // No bulk mutation backend-side, so create sequentially. Skip duplicates
    // gracefully (a number may already exist) and report how many landed.
    for (let i = 0; i < qty; i++) {
      try {
        await GqlCreateClubTable({
          input: {
            clubId: club.value.id,
            tableNumber: start + i,
            maxSeats: form.value.maxSeats,
            isDefault: form.value.isDefault,
          },
        })
        added++
      } catch (error) {
        lastError = error
      }
    }
    await fetchTables()
    form.value.quantity = 1
    if (added > 0) {
      toast.success(t('tables.addedCount', { count: added }))
    } else if (lastError) {
      toast.error(extractError(lastError, t('tables.addFailed')))
    }
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
  padding: 1.75rem 1rem 3rem;
}

@media (min-width: 640px) {
  .page-container {
    padding: 2rem 1.5rem 3rem;
  }
}

@media (min-width: 1024px) {
  .page-container {
    padding: 2.5rem 2rem 4rem;
  }
}

.page-header {
  margin-bottom: 1.5rem;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-pp-gold-deep);
  font-variant-numeric: tabular-nums;
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
  max-width: 44ch;
}

/* Add-tables config row */
.add-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0));
  border: 1px solid var(--color-pp-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
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
  padding-bottom: 0.55rem;
  font-size: 0.85rem;
}

.range-hint {
  flex-basis: 100%;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  color: var(--color-pp-gold-deep);
}

.hint {
  margin: 0.85rem 0 1.5rem;
  font-size: 0.8rem;
  color: var(--color-pp-text-dim);
}

.centered-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--color-pp-text-muted);
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--color-pp-text-dim);
  margin: 0 auto 0.75rem;
}

/* Card grid */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

@media (min-width: 640px) {
  .tables-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .tables-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.table-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  height: 100%;
}

.table-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.table-num {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
  color: var(--color-pp-text);
  font-variant-numeric: tabular-nums;
}

/* Oval felt graphic */
.felt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.felt__oval {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: 9999px;
  background:
    radial-gradient(120% 120% at 50% 0%, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) 60%),
    radial-gradient(circle at 50% 50%, #1f3a2c, #14271d);
  border: 1px solid rgba(52, 211, 153, 0.18);
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.45);
}

.seat-dot {
  position: absolute;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
}

.felt__count {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.35);
}

.felt__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pp-text-muted);
}

.table-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
}

.default-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-pp-border);
  background: transparent;
  font-size: 0.72rem;
  color: var(--color-pp-text-dim);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.default-toggle--on {
  border-color: rgba(var(--pp-accent-rgb), 0.4);
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

/* Delete action - quiet icon button, reddens on hover. */
.row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.1rem;
  height: 2.1rem;
  border: none;
  border-radius: 0.6rem;
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
  background-color: rgba(var(--pp-danger-rgb), 0.12);
}

.row-action-icon {
  width: 1.1rem;
  height: 1.1rem;
}
</style>
