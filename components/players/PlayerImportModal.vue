<template>
  <PpModal :open="isOpen" size="lg" :title="t('players.import.title')" @close="close">
    <!-- Step: Upload -->
    <div v-if="step === 'upload'" class="import-step">
      <label
        class="dropzone"
        :class="{ 'dropzone--active': dragActive }"
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="onDrop"
      >
        <IonIcon :icon="cloudUploadOutline" class="dropzone-icon" />
        <p class="dropzone-title">{{ t('players.import.dropPrompt') }}</p>
        <p class="dropzone-hint">{{ t('players.import.formats') }}</p>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.xlsx,.xls"
          class="dropzone-input"
          @change="onFileChange"
        />
      </label>
      <p v-if="parseError" class="import-error">{{ parseError }}</p>
    </div>

    <!-- Step: Map / Normalize -->
    <div v-else-if="step === 'map'" class="import-step">
      <p class="import-summary">
        {{ t('players.import.parsed', { rows: rows.length, file: fileName }) }}
      </p>

      <!-- Header preview -->
      <div class="preview-table-wrap">
        <table class="preview-table">
          <thead>
            <tr>
              <th v-for="(h, i) in headers" :key="i">{{ h || `#${i + 1}` }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in rows.slice(0, 3)" :key="ri">
              <td v-for="(h, ci) in headers" :key="ci">{{ row[ci] }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- AI path -->
      <div class="map-actions">
        <PpButton variant="primary" :loading="aiWorking" @click="runAiFormat">
          <IonIcon v-if="!aiWorking" :icon="sparklesOutline" class="icon-md" />
          {{ t('players.import.aiFormat') }}
        </PpButton>
        <span class="map-or">{{ t('players.import.or') }}</span>
        <PpButton variant="secondary" @click="showManual = !showManual">
          {{ t('players.import.mapManually') }}
        </PpButton>
      </div>

      <!-- Manual column mapping -->
      <div v-if="showManual" class="manual-map">
        <p class="manual-map-label">{{ t('players.import.pickColumns') }}</p>
        <div class="manual-columns">
          <label v-for="(h, i) in headers" :key="i" class="manual-column">
            <input type="checkbox" :value="i" v-model="selectedColumns" />
            <span>{{ h || `#${i + 1}` }}</span>
          </label>
        </div>
        <PpButton variant="primary" :disabled="selectedColumns.length === 0" @click="runManualMap">
          {{ t('players.import.useColumns') }}
        </PpButton>
      </div>
    </div>

    <!-- Step: Preview / edit -->
    <div v-else-if="step === 'preview'" class="import-step">
      <p class="import-summary">
        {{ t('players.import.reviewPrompt', { count: includedCount }) }}
      </p>
      <div class="candidate-list">
        <div v-for="(c, i) in candidates" :key="i" class="candidate-row">
          <input type="checkbox" v-model="c.include" class="candidate-check" />
          <input
            v-model="c.displayName"
            type="text"
            class="pp-input candidate-input"
            :class="{
              'candidate-input--empty': c.include && !c.displayName.trim(),
            }"
          />
        </div>
      </div>
    </div>

    <!-- Step: Results -->
    <div v-else-if="step === 'results'" class="import-step">
      <div class="results-head">
        <IonIcon :icon="checkmarkCircleOutline" class="results-icon" />
        <p class="results-created">
          {{
            t('players.import.createdCount', {
              count: result?.created.length || 0,
            })
          }}
        </p>
      </div>
      <div v-if="result && result.skipped.length > 0" class="results-skipped">
        <p class="results-skipped-title">
          {{ t('players.import.skippedCount', { count: result.skipped.length }) }}
        </p>
        <ul class="results-skipped-list">
          <li v-for="(s, i) in result.skipped" :key="i">
            <span class="results-skipped-name">{{ s.displayName || '—' }}</span>
            <span class="results-skipped-reason">{{ s.reason }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <PpButton v-if="step !== 'results'" variant="secondary" @click="close">
        {{ t('common.cancel') }}
      </PpButton>
      <PpButton v-if="step === 'preview'" variant="secondary" @click="step = 'map'">
        {{ t('common.back') }}
      </PpButton>
      <PpButton
        v-if="step === 'preview'"
        variant="primary"
        :disabled="includedCount === 0"
        :loading="importing"
        @click="submitImport"
      >
        {{ t('players.import.importCount', { count: includedCount }) }}
      </PpButton>
      <PpButton v-if="step === 'results'" variant="primary" @click="finish">
        {{ t('common.done') }}
      </PpButton>
    </template>
  </PpModal>
</template>

<script setup lang="ts">
import * as XLSX from 'xlsx'
import { IonIcon } from '@ionic/vue'
import { cloudUploadOutline, sparklesOutline, checkmarkCircleOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: []; imported: [] }>()

const { t } = useI18n()
const toast = useToast()
const clubStore = useClubStore()

type Step = 'upload' | 'map' | 'preview' | 'results'
interface Candidate {
  displayName: string
  include: boolean
}
interface ImportResult {
  created: { id: string; displayName: string }[]
  skipped: { displayName: string; reason: string }[]
}

const step = ref<Step>('upload')
const dragActive = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const headers = ref<string[]>([])
const rows = ref<string[][]>([])
const parseError = ref('')

const aiWorking = ref(false)
const showManual = ref(false)
const selectedColumns = ref<number[]>([])

const candidates = ref<Candidate[]>([])
const importing = ref(false)
const result = ref<ImportResult | null>(null)

const includedCount = computed(
  () => candidates.value.filter((c) => c.include && c.displayName.trim()).length,
)

// ── Parsing ────────────────────────────────────────────────────────
const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) parseFile(file)
}

const onDrop = (e: DragEvent) => {
  dragActive.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) parseFile(file)
}

const parseFile = async (file: File) => {
  parseError.value = ''
  try {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
    })
    if (matrix.length < 2) {
      parseError.value = t('players.import.emptyFile')
      return
    }
    headers.value = (matrix[0] || []).map((h) => String(h ?? '').trim())
    rows.value = matrix.slice(1).map((r) => r.map((c) => String(c ?? '')))
    fileName.value = file.name
    showManual.value = false
    selectedColumns.value = guessNameColumns(headers.value)
    step.value = 'map'
  } catch (err) {
    console.error('Parse failed:', err)
    parseError.value = t('players.import.parseFailed')
  }
}

// ── AI normalization ───────────────────────────────────────────────
const runAiFormat = async () => {
  aiWorking.value = true
  try {
    const res = await GqlFormatRosterImport({
      input: {
        clubId: clubStore.club?.id || '',
        headers: headers.value,
        rows: rows.value,
      },
    })
    const list = res?.formatRosterImport || []
    if (list.length === 0) {
      toast.warning(t('players.import.aiNoResult'))
      showManual.value = true
      return
    }
    candidates.value = list.map((c: { displayName: string }) => ({
      displayName: c.displayName,
      include: true,
    }))
    step.value = 'preview'
  } catch (err: unknown) {
    // OpenRouter not configured or call failed → fall back to manual mapping.
    console.error('AI format failed:', err)
    toast.warning(t('players.import.aiUnavailable'))
    showManual.value = true
  } finally {
    aiWorking.value = false
  }
}

// ── Manual column mapping ──────────────────────────────────────────
// Pre-select name columns from known header conventions. Kholdem (the main
// migration source: FR/EN UI, semicolon CSVs) labels them Pseudo / Prénom /
// Nom; a standalone nickname column wins over first+last name pairs.
const NICKNAME_HEADERS = ['pseudo', 'nickname', 'surnom', 'bijnaam', 'alias']
const FIRSTNAME_HEADERS = ['prénom', 'prenom', 'first name', 'firstname', 'voornaam']
const LASTNAME_HEADERS = ['nom', 'last name', 'lastname', 'naam', 'achternaam', 'nom de famille']
const FULLNAME_HEADERS = ['joueur', 'player', 'name', 'speler', 'display name', 'displayname']

const guessNameColumns = (cols: string[]): number[] => {
  const norm = cols.map((h) => h.toLowerCase().trim())
  const findAll = (names: string[]) =>
    norm.map((h, i) => (names.includes(h) ? i : -1)).filter((i) => i >= 0)

  const nick = findAll(NICKNAME_HEADERS)
  if (nick.length) return [nick[0]]

  const first = findAll(FIRSTNAME_HEADERS)
  const last = findAll(LASTNAME_HEADERS)
  if (first.length && last.length) return [first[0], last[0]]

  const full = findAll(FULLNAME_HEADERS)
  if (full.length) return [full[0]]

  return []
}

const runManualMap = () => {
  const cols = selectedColumns.value.toSorted((a, b) => a - b)
  candidates.value = rows.value.map((row) => ({
    displayName: cols
      .map((ci) => (row[ci] ?? '').trim())
      .filter(Boolean)
      .join(' ')
      .trim(),
    include: true,
  }))
  step.value = 'preview'
}

// ── Submit ─────────────────────────────────────────────────────────
const submitImport = async () => {
  importing.value = true
  try {
    const displayNames = candidates.value
      .filter((c) => c.include && c.displayName.trim())
      .map((c) => c.displayName.trim())

    const res = await GqlCreateClubPlayersBulk({
      input: { clubId: clubStore.club?.id || '', displayNames },
    })
    result.value = (res?.createClubPlayersBulk as ImportResult) || {
      created: [],
      skipped: [],
    }
    step.value = 'results'
  } catch (err) {
    console.error('Bulk import failed:', err)
    toast.error(t('players.import.importFailed'))
  } finally {
    importing.value = false
  }
}

const resetState = () => {
  step.value = 'upload'
  dragActive.value = false
  fileName.value = ''
  headers.value = []
  rows.value = []
  parseError.value = ''
  aiWorking.value = false
  showManual.value = false
  selectedColumns.value = []
  candidates.value = []
  importing.value = false
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const close = () => {
  emit('close')
}

const finish = () => {
  emit('imported')
}

// Reset whenever the modal opens fresh.
watch(
  () => props.isOpen,
  (open) => {
    if (open) resetState()
  },
)
</script>

<style scoped>
.import-step > * + * {
  margin-top: 1rem;
}

/* Dropzone */
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  border: 2px dashed var(--color-pp-border-strong);
  border-radius: 1rem;
  cursor: pointer;
  text-align: center;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.dropzone--active,
.dropzone:hover {
  border-color: var(--color-pp-gold);
  background-color: rgba(254, 231, 138, 0.05);
}

.dropzone-icon {
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-pp-gold);
}

.dropzone-title {
  font-weight: 600;
  color: var(--color-pp-text);
}

.dropzone-hint {
  font-size: 0.8rem;
  color: var(--color-pp-text-dim);
}

.dropzone-input {
  display: none;
}

.import-error {
  color: var(--pp-red-400);
  font-size: 0.875rem;
}

.import-summary {
  font-size: 0.875rem;
  color: var(--color-pp-text-muted);
}

/* Preview table */
.preview-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.75rem;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.preview-table th,
.preview-table td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-pp-border);
  color: var(--color-pp-text-muted);
}

.preview-table th {
  color: var(--color-pp-gold-deep);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Map actions */
.map-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.map-or {
  color: var(--color-pp-text-dim);
  font-size: 0.85rem;
}

.manual-map {
  padding: 1rem;
  border: 1px solid var(--color-pp-border-strong);
  border-radius: 0.75rem;
}

.manual-map-label {
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
  margin-bottom: 0.75rem;
}

.manual-columns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
}

.manual-column {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-pp-text);
  font-size: 0.875rem;
}

/* Candidate list */
.candidate-list {
  max-height: 22rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.candidate-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.candidate-input {
  flex: 1;
}

.candidate-input--empty {
  border-color: var(--pp-red-400);
}

/* Results */
.results-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.results-icon {
  width: 1.6rem;
  height: 1.6rem;
  color: #22c55e;
}

.results-created {
  font-weight: 600;
  color: var(--color-pp-text);
}

.results-skipped {
  border-top: 1px solid var(--color-pp-border);
  padding-top: 0.75rem;
}

.results-skipped-title {
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
  margin-bottom: 0.5rem;
}

.results-skipped-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 14rem;
  overflow-y: auto;
}

.results-skipped-list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.8rem;
}

.results-skipped-name {
  color: var(--color-pp-text);
}

.results-skipped-reason {
  color: var(--color-pp-text-dim);
}

.icon-md {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
