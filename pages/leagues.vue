<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <PpFadeUp>
          <div class="header-row">
            <div class="header-section">
              <p class="eyebrow">{{ t('nav.leagues') }}</p>
              <h1 class="page-title">{{ t('leagues.title') }}</h1>
              <p class="page-subtitle">{{ t('leagues.subtitle') }}</p>
            </div>
            <PpButton variant="primary" magnetic @click="openCreate">
              <IonIcon :icon="addOutline" class="icon-md" />
              {{ t('leagues.new') }}
            </PpButton>
          </div>
        </PpFadeUp>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <IonSpinner name="crescent" class="spinner" />
        </div>

        <!-- Empty -->
        <div v-else-if="configs.length === 0" class="empty-state pp-card">
          <IonIcon :icon="podiumOutline" class="empty-icon" />
          <p class="empty-title">{{ t('leagues.empty.title') }}</p>
          <p class="empty-text">{{ t('leagues.empty.text') }}</p>
          <PpButton variant="primary" @click="openCreate">{{ t('leagues.new') }}</PpButton>
        </div>

        <!-- League list -->
        <div v-else class="league-grid">
          <div v-for="cfg in configs" :key="cfg.id" class="league-card pp-card">
            <div class="league-card-head">
              <div class="league-card-title-row">
                <h3 class="league-name">{{ cfg.name }}</h3>
                <span v-if="cfg.isDefault" class="badge badge--gold">{{
                  t('leagues.default')
                }}</span>
              </div>
              <span class="badge badge--muted">{{ membershipLabel(cfg.membershipMode) }}</span>
            </div>

            <dl class="league-meta">
              <div class="meta-item">
                <dt>{{ t('leagues.formula.positionCurve') }}</dt>
                <dd>{{ curveLabel(cfg.formula.positionCurve) }}</dd>
              </div>
              <div class="meta-item">
                <dt>{{ t('leagues.formula.cap') }}</dt>
                <dd>{{ cfg.formula.cap }}</dd>
              </div>
              <div class="meta-item">
                <dt>{{ t('leagues.formula.bestN') }}</dt>
                <dd>{{ cfg.formula.countBestN ?? t('leagues.allResults') }}</dd>
              </div>
              <div class="meta-item">
                <dt>{{ t('leagues.period') }}</dt>
                <dd>{{ periodLabel(cfg.periodStart, cfg.periodEnd) }}</dd>
              </div>
            </dl>

            <div class="league-card-actions">
              <PpButton variant="secondary" size="sm" @click="openEdit(cfg)">
                <IonIcon :icon="createOutline" />
                {{ t('common.edit') }}
              </PpButton>
              <PpButton variant="secondary" size="sm" @click="openAdjustments(cfg)">
                <IonIcon :icon="swapVerticalOutline" />
                {{ t('leagues.adjustments.title') }}
              </PpButton>
              <PpButton variant="ghost" size="sm" @click="confirmDelete(cfg)">
                <IonIcon :icon="trashOutline" />
              </PpButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Create / Edit modal -->
      <PpModal
        :open="formOpen"
        :title="editingId ? t('leagues.editTitle') : t('leagues.newTitle')"
        size="2xl"
        @close="formOpen = false"
      >
        <div class="form-grid">
          <!-- Left: knobs -->
          <div class="form-col">
            <label class="field">
              <span class="field-label">{{ t('leagues.fields.name') }}</span>
              <input
                v-model="form.name"
                type="text"
                class="pp-input"
                :placeholder="t('leagues.fields.namePlaceholder')"
              />
            </label>

            <div class="field-group-title">{{ t('leagues.formula.title') }}</div>

            <div class="knob-grid">
              <label class="field">
                <span class="field-label">{{ t('leagues.formula.basePoints') }}</span>
                <input
                  v-model.number="form.formula.basePoints"
                  type="number"
                  step="0.5"
                  class="pp-input"
                />
              </label>
              <label class="field">
                <span class="field-label">{{ t('leagues.formula.fieldMultiplier') }}</span>
                <input
                  v-model.number="form.formula.fieldMultiplier"
                  type="number"
                  step="0.5"
                  class="pp-input"
                />
              </label>
              <label class="field">
                <span class="field-label">{{ t('leagues.formula.buyinMultiplier') }}</span>
                <input
                  v-model.number="form.formula.buyinMultiplier"
                  type="number"
                  step="0.1"
                  class="pp-input"
                />
              </label>
              <label class="field">
                <span class="field-label">{{ t('leagues.formula.positionCurve') }}</span>
                <select v-model="form.formula.positionCurve" class="pp-input">
                  <option value="SQRT">{{ t('leagues.curve.sqrt') }}</option>
                  <option value="HARMONIC">{{ t('leagues.curve.harmonic') }}</option>
                  <option value="LINEAR">{{ t('leagues.curve.linear') }}</option>
                </select>
              </label>
              <label class="field">
                <span class="field-label">{{ t('leagues.formula.minPlayers') }}</span>
                <input
                  v-model.number="form.formula.minPlayers"
                  type="number"
                  min="0"
                  class="pp-input"
                />
              </label>
              <label class="field">
                <span class="field-label">{{ t('leagues.formula.cap') }}</span>
                <input v-model.number="form.formula.cap" type="number" min="0" class="pp-input" />
              </label>
              <label class="field">
                <span class="field-label">{{ t('leagues.formula.bestN') }}</span>
                <input
                  v-model.number="bestNInput"
                  type="number"
                  min="1"
                  class="pp-input"
                  :placeholder="t('leagues.allResults')"
                />
              </label>
            </div>

            <div class="field-group-title">{{ t('leagues.membership.title') }}</div>
            <label class="field">
              <span class="field-label">{{ t('leagues.membership.mode') }}</span>
              <select v-model="form.membershipMode" class="pp-input">
                <option value="ALL_IN_PERIOD">{{ t('leagues.membership.allInPeriod') }}</option>
                <option value="TAGGED">{{ t('leagues.membership.tagged') }}</option>
              </select>
              <span class="field-hint">{{ membershipHint(form.membershipMode) }}</span>
            </label>

            <div class="knob-grid">
              <label class="field">
                <span class="field-label">{{ t('leagues.periodStart') }}</span>
                <input v-model="form.periodStart" type="date" class="pp-input" />
              </label>
              <label class="field">
                <span class="field-label">{{ t('leagues.periodEnd') }}</span>
                <input v-model="form.periodEnd" type="date" class="pp-input" />
              </label>
            </div>

            <label class="toggle-row">
              <input v-model="form.isDefault" type="checkbox" class="pp-checkbox" />
              <span>
                <span class="field-label">{{ t('leagues.fields.isDefault') }}</span>
                <span class="field-hint">{{ t('leagues.fields.isDefaultHint') }}</span>
              </span>
            </label>
          </div>

          <!-- Right: live preview -->
          <div class="form-col">
            <div class="field-group-title">{{ t('leagues.preview.title') }}</div>
            <p class="preview-caption">{{ t('leagues.preview.caption') }}</p>
            <div class="preview-card pp-card">
              <div class="preview-row preview-row--head">
                <span>{{ t('leagues.preview.finish') }}</span>
                <span>{{ t('leagues.preview.points') }}</span>
              </div>
              <div v-for="(s, i) in previewSamples" :key="i" class="preview-row">
                <span
                  >{{ ordinal(s.rank) }} / {{ s.fieldSize }} · {{ formatPrice(s.buyInCents) }}</span
                >
                <span class="preview-points">{{ previewResults[i] ?? '–' }}</span>
              </div>
            </div>
            <p class="preview-note">{{ t('leagues.preview.note') }}</p>
          </div>
        </div>

        <template #footer>
          <PpButton variant="ghost" @click="formOpen = false">{{ t('common.cancel') }}</PpButton>
          <PpButton
            variant="primary"
            :loading="saving"
            :disabled="!form.name.trim()"
            @click="saveConfig"
          >
            {{ editingId ? t('common.save') : t('common.create') }}
          </PpButton>
        </template>
      </PpModal>

      <!-- Adjustments modal -->
      <PpModal
        :open="adjOpen"
        :title="t('leagues.adjustments.modalTitle', { name: adjConfig?.name })"
        size="lg"
        @close="adjOpen = false"
      >
        <div class="adj-form">
          <label class="field adj-player">
            <span class="field-label">{{ t('leagues.adjustments.player') }}</span>
            <select v-model="adjForm.clubPlayerId" class="pp-input">
              <option value="">{{ t('leagues.adjustments.selectPlayer') }}</option>
              <option v-for="p in clubPlayers" :key="p.id" :value="p.id">
                {{ p.displayName }}
              </option>
            </select>
          </label>
          <label class="field adj-delta">
            <span class="field-label">{{ t('leagues.adjustments.delta') }}</span>
            <input v-model.number="adjForm.pointsDelta" type="number" class="pp-input" />
          </label>
        </div>
        <label class="field">
          <span class="field-label">{{ t('leagues.adjustments.reason') }}</span>
          <input
            v-model="adjForm.reason"
            type="text"
            class="pp-input"
            :placeholder="t('leagues.adjustments.reasonPlaceholder')"
          />
        </label>
        <PpButton
          variant="secondary"
          size="sm"
          :loading="addingAdj"
          :disabled="!adjForm.clubPlayerId || !adjForm.reason.trim() || !adjForm.pointsDelta"
          @click="addAdjustment"
        >
          <IonIcon :icon="addOutline" />
          {{ t('leagues.adjustments.add') }}
        </PpButton>

        <div class="adj-history">
          <div class="field-group-title">{{ t('leagues.adjustments.history') }}</div>
          <p v-if="adjustments.length === 0" class="empty-text">
            {{ t('leagues.adjustments.none') }}
          </p>
          <div v-for="a in adjustments" :key="a.id" class="adj-item">
            <div class="adj-item-main">
              <span
                :class="['adj-points', a.pointsDelta >= 0 ? 'adj-points--pos' : 'adj-points--neg']"
              >
                {{ a.pointsDelta >= 0 ? '+' : '' }}{{ a.pointsDelta }}
              </span>
              <span class="adj-player-name">{{ playerName(a.clubPlayerId) }}</span>
              <span class="adj-reason">{{ a.reason }}</span>
            </div>
            <div class="adj-item-side">
              <span class="adj-date">{{ formatDate(a.createdAt) }}</span>
              <button
                class="adj-remove"
                :aria-label="t('common.delete')"
                @click="removeAdjustment(a.id)"
              >
                <IonIcon :icon="trashOutline" />
              </button>
            </div>
          </div>
        </div>
      </PpModal>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/vue'
import {
  addOutline,
  createOutline,
  trashOutline,
  podiumOutline,
  swapVerticalOutline,
} from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { DEFAULT_FORMULA } from '~/types/league'
import type { MembershipMode, PositionCurve } from '~/types/league'

const clubStore = useClubStore()
const { t, locale } = useI18n()
const club = computed(() => clubStore.club)

type ConfigItem = GetLeaderboardConfigsQuery['leaderboardConfigs'][number]
type AdjustmentItem = GetLeaderboardAdjustmentsQuery['leaderboardAdjustments'][number]
type ClubPlayerItem = GetClubPlayersQuery['clubPlayers'][number]

const loading = ref(true)
const configs = ref<ConfigItem[]>([])
const clubPlayers = ref<ClubPlayerItem[]>([])

// ── List ───────────────────────────────────────────────────────────────
const fetchConfigs = async () => {
  if (!club.value) return
  loading.value = true
  try {
    const { leaderboardConfigs } = await GqlGetLeaderboardConfigs({ clubId: club.value.id })
    configs.value = leaderboardConfigs || []
  } catch (e) {
    console.error('Failed to load leagues:', e)
    configs.value = []
  } finally {
    loading.value = false
  }
}

const fetchClubPlayers = async () => {
  if (!club.value) return
  try {
    const { clubPlayers: players } = await GqlGetClubPlayers({ clubId: club.value.id })
    clubPlayers.value = (players || []).filter((p) => p.isActive)
  } catch (e) {
    console.error('Failed to load club players:', e)
  }
}

onMounted(() => {
  fetchConfigs()
  fetchClubPlayers()
})

// ── Create / Edit form ───────────────────────────────────────────────────
const formOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const blankForm = () => ({
  name: '',
  formula: { ...DEFAULT_FORMULA },
  membershipMode: 'ALL_IN_PERIOD' as MembershipMode,
  periodStart: '',
  periodEnd: '',
  isDefault: false,
})
const form = reactive(blankForm())

// best-N is null in the model but an empty number input in the UI.
const bestNInput = ref<number | null>(null)
watch(bestNInput, (v) => {
  form.formula.countBestN = v && v >= 1 ? v : null
})

const openCreate = () => {
  editingId.value = null
  Object.assign(form, blankForm())
  bestNInput.value = null
  formOpen.value = true
}

const openEdit = (cfg: ConfigItem) => {
  editingId.value = cfg.id
  form.name = cfg.name
  form.formula = {
    basePoints: cfg.formula.basePoints,
    fieldMultiplier: cfg.formula.fieldMultiplier,
    buyinMultiplier: cfg.formula.buyinMultiplier,
    positionCurve: cfg.formula.positionCurve as PositionCurve,
    minPlayers: cfg.formula.minPlayers,
    cap: cfg.formula.cap,
    countBestN: cfg.formula.countBestN ?? null,
  }
  form.membershipMode = cfg.membershipMode as MembershipMode
  form.periodStart = cfg.periodStart ? cfg.periodStart.slice(0, 10) : ''
  form.periodEnd = cfg.periodEnd ? cfg.periodEnd.slice(0, 10) : ''
  form.isDefault = cfg.isDefault
  bestNInput.value = cfg.formula.countBestN ?? null
  formOpen.value = true
}

const toIso = (d: string) => (d ? new Date(d + 'T00:00:00Z').toISOString() : null)

const formulaInput = () => ({
  basePoints: form.formula.basePoints,
  fieldMultiplier: form.formula.fieldMultiplier,
  buyinMultiplier: form.formula.buyinMultiplier,
  positionCurve: form.formula.positionCurve,
  minPlayers: form.formula.minPlayers,
  cap: form.formula.cap,
  countBestN: form.formula.countBestN,
})

const saveConfig = async () => {
  if (!club.value || !form.name.trim()) return
  saving.value = true
  try {
    if (editingId.value) {
      await GqlUpdateLeaderboardConfig({
        input: {
          id: editingId.value,
          name: form.name.trim(),
          formula: formulaInput(),
          membershipMode: form.membershipMode,
          periodStart: toIso(form.periodStart),
          periodEnd: toIso(form.periodEnd),
          isDefault: form.isDefault,
        },
      })
    } else {
      await GqlCreateLeaderboardConfig({
        input: {
          clubId: club.value.id,
          name: form.name.trim(),
          formula: formulaInput(),
          membershipMode: form.membershipMode,
          periodStart: toIso(form.periodStart),
          periodEnd: toIso(form.periodEnd),
          isDefault: form.isDefault,
        },
      })
    }
    formOpen.value = false
    await fetchConfigs()
  } catch (e) {
    console.error('Failed to save league:', e)
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (cfg: ConfigItem) => {
  if (!window.confirm(t('leagues.deleteConfirm', { name: cfg.name }))) return
  try {
    await GqlDeleteLeaderboardConfig({ id: cfg.id })
    await fetchConfigs()
  } catch (e) {
    console.error('Failed to delete league:', e)
  }
}

// ── Live preview (debounced, backend is the source of truth) ───────────────
const previewSamples = [
  { fieldSize: 20, rank: 1, buyInCents: 5000 },
  { fieldSize: 20, rank: 2, buyInCents: 5000 },
  { fieldSize: 20, rank: 3, buyInCents: 5000 },
  { fieldSize: 20, rank: 5, buyInCents: 5000 },
  { fieldSize: 20, rank: 10, buyInCents: 5000 },
  { fieldSize: 20, rank: 20, buyInCents: 5000 },
]
const previewResults = ref<number[]>([])
let previewTimer: ReturnType<typeof setTimeout> | null = null

const runPreview = async () => {
  try {
    const { previewScoring } = await GqlPreviewScoring({
      formula: formulaInput(),
      samples: previewSamples,
    })
    previewResults.value = previewScoring || []
  } catch (e) {
    console.error('Preview failed:', e)
  }
}

watch(
  () => [formOpen.value, JSON.stringify(form.formula)],
  () => {
    if (!formOpen.value) return
    if (previewTimer) clearTimeout(previewTimer)
    previewTimer = setTimeout(runPreview, 250)
  },
  { immediate: true },
)

// ── Manual adjustments ─────────────────────────────────────────────────────
const adjOpen = ref(false)
const adjConfig = ref<ConfigItem | null>(null)
const adjustments = ref<AdjustmentItem[]>([])
const addingAdj = ref(false)
const adjForm = reactive({ clubPlayerId: '', pointsDelta: 0, reason: '' })

const fetchAdjustments = async (configId: string) => {
  try {
    const { leaderboardAdjustments } = await GqlGetLeaderboardAdjustments({ configId })
    adjustments.value = leaderboardAdjustments || []
  } catch (e) {
    console.error('Failed to load adjustments:', e)
    adjustments.value = []
  }
}

const openAdjustments = async (cfg: ConfigItem) => {
  adjConfig.value = cfg
  adjForm.clubPlayerId = ''
  adjForm.pointsDelta = 0
  adjForm.reason = ''
  adjOpen.value = true
  await fetchAdjustments(cfg.id)
}

const addAdjustment = async () => {
  if (!adjConfig.value || !adjForm.clubPlayerId || !adjForm.reason.trim()) return
  addingAdj.value = true
  try {
    await GqlAddLeaderboardAdjustment({
      input: {
        configId: adjConfig.value.id,
        clubPlayerId: adjForm.clubPlayerId,
        pointsDelta: adjForm.pointsDelta,
        reason: adjForm.reason.trim(),
      },
    })
    adjForm.clubPlayerId = ''
    adjForm.pointsDelta = 0
    adjForm.reason = ''
    await fetchAdjustments(adjConfig.value.id)
  } catch (e) {
    console.error('Failed to add adjustment:', e)
  } finally {
    addingAdj.value = false
  }
}

const removeAdjustment = async (id: string) => {
  if (!adjConfig.value) return
  try {
    await GqlRemoveLeaderboardAdjustment({ id, configId: adjConfig.value.id })
    await fetchAdjustments(adjConfig.value.id)
  } catch (e) {
    console.error('Failed to remove adjustment:', e)
  }
}

// ── Display helpers ────────────────────────────────────────────────────────
const curveLabel = (c: string) =>
  ({
    SQRT: t('leagues.curve.sqrt'),
    HARMONIC: t('leagues.curve.harmonic'),
    LINEAR: t('leagues.curve.linear'),
  })[c] || c

const membershipLabel = (m: string) =>
  m === 'TAGGED' ? t('leagues.membership.tagged') : t('leagues.membership.allInPeriod')

const membershipHint = (m: string) =>
  m === 'TAGGED' ? t('leagues.membership.taggedHint') : t('leagues.membership.allInPeriodHint')

const playerName = (id: string) =>
  clubPlayers.value.find((p) => p.id === id)?.displayName || t('common.unknown')

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-GB' : `${locale.value}-BE`, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const periodLabel = (start?: string | null, end?: string | null) => {
  if (!start && !end) return t('leagues.allTime')
  const fmt = (d: string) => formatDate(d)
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `${t('leagues.from')} ${fmt(start)}`
  return `${t('leagues.until')} ${fmt(end as string)}`
}

const ordinal = (n: number) => {
  if (locale.value !== 'en') return `${n}${t('leagues.preview.rankSuffix')}`
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
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

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
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

.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-pp-gold);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
}

.empty-icon {
  font-size: 2.5rem;
  color: var(--color-pp-gold-deep);
}

.empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.empty-text {
  color: var(--color-pp-text-muted);
  font-size: 0.9rem;
}

.league-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .league-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.league-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.league-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.league-card-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.league-name {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.badge {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  white-space: nowrap;
}

.badge--gold {
  background-color: rgba(254, 231, 138, 0.15);
  color: var(--color-pp-gold);
  border: 1px solid rgba(254, 231, 138, 0.4);
}

.badge--muted {
  background-color: var(--color-pp-surface-2);
  color: var(--color-pp-text-muted);
  border: 1px solid var(--color-pp-border-strong);
}

.league-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem 1rem;
}

.meta-item dt {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-pp-text-dim);
}

.meta-item dd {
  margin-top: 0.15rem;
  color: var(--color-pp-text);
  font-size: 0.85rem;
}

.league-card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: auto;
}

/* ── Form modal ──────────────────────────────────────── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1.4fr 1fr;
  }
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pp-text-muted);
}

.field-hint {
  font-size: 0.7rem;
  color: var(--color-pp-text-dim);
}

.field-group-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-pp-gold-deep);
  margin-top: 0.5rem;
}

.pp-input {
  background-color: var(--color-pp-surface-2);
  color: var(--color-pp-text);
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.65rem;
  padding: 0.55rem 0.7rem;
  font-size: 0.875rem;
  width: 100%;
}

.pp-input:focus {
  outline: none;
  border-color: rgba(254, 231, 138, 0.5);
}

.knob-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-top: 0.5rem;
  cursor: pointer;
}

.toggle-row > span {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.pp-checkbox {
  margin-top: 0.15rem;
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--color-pp-gold);
}

.preview-caption {
  font-size: 0.8rem;
  color: var(--color-pp-text-muted);
  margin-bottom: 0.5rem;
}

.preview-card {
  padding: 0.85rem 1rem;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  font-size: 0.85rem;
  color: var(--color-pp-text);
  border-bottom: 1px solid var(--color-pp-border);
}

.preview-row:last-child {
  border-bottom: none;
}

.preview-row--head {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-pp-text-dim);
}

.preview-points {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--color-pp-gold);
}

.preview-note {
  margin-top: 0.75rem;
  font-size: 0.7rem;
  color: var(--color-pp-text-dim);
}

/* ── Adjustments modal ───────────────────────────────── */
.adj-form {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.adj-history {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.adj-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background-color: var(--color-pp-surface);
  border: 1px solid var(--color-pp-border);
  border-radius: 0.65rem;
}

.adj-item-main {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  flex-wrap: wrap;
}

.adj-points {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.9rem;
}

.adj-points--pos {
  color: #4ade80;
}

.adj-points--neg {
  color: #f87171;
}

.adj-player-name {
  font-weight: 600;
  color: var(--color-pp-text);
  font-size: 0.85rem;
}

.adj-reason {
  color: var(--color-pp-text-muted);
  font-size: 0.8rem;
}

.adj-item-side {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  white-space: nowrap;
}

.adj-date {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-pp-text-dim);
}

.adj-remove {
  color: var(--color-pp-text-dim);
  cursor: pointer;
  transition: color 0.2s ease;
}

.adj-remove:hover {
  color: #f87171;
}
</style>
