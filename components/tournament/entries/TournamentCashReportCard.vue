<template>
  <div class="cash-card">
    <div class="cash-header">
      <div class="cash-header__title">
        <IonIcon :icon="walletOutline" class="cash-header__icon" />
        <h3>{{ t('cashReport.title') }}</h3>
      </div>
      <PpButton variant="ghost" size="sm" :disabled="!lines.length" @click="exportCsv">
        <IonIcon :icon="downloadOutline" class="icon-sm" />
        {{ t('cashReport.export') }}
      </PpButton>
    </div>

    <div v-if="!lines.length" class="cash-empty">{{ t('cashReport.empty') }}</div>

    <template v-else>
      <!-- Method × type matrix -->
      <div class="cash-table-wrap">
        <table class="cash-table">
          <thead>
            <tr>
              <th class="cash-th cash-th--row">{{ t('cashReport.type') }}</th>
              <th v-for="m in methods" :key="m" class="cash-th cash-th--num">
                {{ t(`payment.${methodKey(m)}`) }}
              </th>
              <th class="cash-th cash-th--num cash-th--total">{{ t('cashReport.total') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ty in entryTypes" :key="ty">
              <td class="cash-td cash-td--row">{{ t(`entries.${entryTypeKey(ty)}`) }}</td>
              <td v-for="m in methods" :key="m" class="cash-td cash-td--num">
                {{ cell(ty, m) ? formatPrice(cell(ty, m), locale) : '-' }}
              </td>
              <td class="cash-td cash-td--num cash-td--total">
                {{ formatPrice(rowTotal(ty), locale) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="cash-td cash-td--row cash-foot">{{ t('cashReport.total') }}</td>
              <td v-for="m in methods" :key="m" class="cash-td cash-td--num cash-foot">
                {{ formatPrice(methodTotal(m), locale) }}
              </td>
              <td class="cash-td cash-td--num cash-foot cash-td--total">
                {{ formatPrice(report.totalCollectedCents, locale) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Reconciliation summary -->
      <div class="cash-summary">
        <div class="cash-summary__item">
          <span class="cash-summary__label">{{ t('cashReport.collected') }}</span>
          <span class="cash-summary__value">{{
            formatPrice(report.totalCollectedCents, locale)
          }}</span>
        </div>
        <div class="cash-summary__item">
          <span class="cash-summary__label">{{ t('cashReport.rake') }}</span>
          <span class="cash-summary__value">{{ formatPrice(report.totalRakeCents, locale) }}</span>
        </div>
        <div class="cash-summary__item">
          <span class="cash-summary__label">{{ t('cashReport.prizePool') }}</span>
          <span class="cash-summary__value cash-summary__value--gold">
            {{ formatPrice(report.prizePoolCents, locale) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { walletOutline, downloadOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'
import { downloadCsv, csvAmount, exportFilename } from '~/utils/exportCsv'

const props = defineProps<{ tournamentId: string; tournamentTitle?: string }>()
const { t, locale } = useI18n()

// Canonical column / row orders (only those present are rendered).
const METHOD_ORDER = ['CASH', 'CARD', 'BANK_TRANSFER', 'VOUCHER', 'COMP', 'OTHER']
const TYPE_ORDER = ['INITIAL', 'REBUY', 'RE_ENTRY', 'ADDON', 'VOUCHER', 'BONUS']

const methodKey = (m: string) =>
  ({
    CASH: 'cash',
    CARD: 'card',
    BANK_TRANSFER: 'bankTransfer',
    VOUCHER: 'voucher',
    COMP: 'comp',
    OTHER: 'other',
  })[m] || 'other'

const entryTypeKey = (ty: string) =>
  ({
    INITIAL: 'initial',
    REBUY: 'rebuy',
    RE_ENTRY: 'reEntry',
    ADDON: 'addon',
    VOUCHER: 'voucher',
    BONUS: 'bonus',
  })[ty] || ty.toLowerCase()

const { data, refresh } = await useLazyAsyncData(`cash-report-${props.tournamentId}`, () =>
  GqlGetTournamentCashReport({ tournamentId: props.tournamentId }),
)

const report = computed(() => data.value?.tournamentCashReport)
const lines = computed(() => report.value?.lines || [])

// Methods / types actually present, in canonical order.
const methods = computed(() =>
  METHOD_ORDER.filter((m) => lines.value.some((l: any) => l.paymentMethod === m)),
)
const entryTypes = computed(() =>
  TYPE_ORDER.filter((ty) => lines.value.some((l: any) => l.entryType === ty)),
)

const cell = (ty: string, m: string) =>
  lines.value
    .filter((l: any) => l.entryType === ty && l.paymentMethod === m)
    .reduce((s: number, l: any) => s + l.amountCents, 0)

const rowTotal = (ty: string) =>
  lines.value
    .filter((l: any) => l.entryType === ty)
    .reduce((s: number, l: any) => s + l.amountCents, 0)

const methodTotal = (m: string) =>
  lines.value
    .filter((l: any) => l.paymentMethod === m)
    .reduce((s: number, l: any) => s + l.amountCents, 0)

const exportCsv = () => {
  if (!report.value) return
  // One row per entry type, a column per method, plus a total column; a final
  // total row mirrors the on-screen matrix.
  const rows = entryTypes.value.map((ty) => ({ ty }))
  const columns = [
    {
      label: t('cashReport.type'),
      value: (r: { ty: string }) => t(`entries.${entryTypeKey(r.ty)}`),
    },
    ...methods.value.map((m) => ({
      label: t(`payment.${methodKey(m)}`),
      value: (r: { ty: string }) => csvAmount(cell(r.ty, m)),
    })),
    { label: t('cashReport.total'), value: (r: { ty: string }) => csvAmount(rowTotal(r.ty)) },
  ]
  // Append the totals row.
  const totalRow = { ty: '__total__' }
  const allRows = [...rows, totalRow]
  const columnsWithTotal = columns.map((c, i) => ({
    label: c.label,
    value: (r: { ty: string }) => {
      if (r.ty !== '__total__') return c.value(r)
      if (i === 0) return t('cashReport.total')
      if (i === columns.length - 1) return csvAmount(report.value!.totalCollectedCents)
      return csvAmount(methodTotal(methods.value[i - 1]))
    },
  }))
  downloadCsv(
    exportFilename([props.tournamentTitle, t('cashReport.title')]),
    allRows,
    columnsWithTotal,
  )
}

defineExpose({ refresh })
</script>

<style scoped>
.cash-card {
  background-color: var(--color-pp-surface-2);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--color-pp-border-strong);
}

.cash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.cash-header__title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.cash-header__title h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.cash-header__icon {
  width: 1.4rem;
  height: 1.4rem;
  color: var(--color-pp-gold);
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}

.cash-empty {
  text-align: center;
  color: var(--color-pp-text-muted);
  padding: 2rem 0;
}

.cash-table-wrap {
  overflow-x: auto;
}

.cash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.cash-th {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-pp-text-dim);
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--color-pp-border-strong);
  white-space: nowrap;
}

.cash-th--row {
  text-align: left;
}

.cash-th--num,
.cash-td--num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.cash-th--total,
.cash-td--total {
  color: var(--color-pp-text);
}

.cash-td {
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--color-pp-border);
  color: var(--color-pp-text-muted);
}

.cash-td--row {
  text-align: left;
  color: var(--color-pp-text);
  font-weight: 500;
}

.cash-foot {
  border-top: 2px solid var(--color-pp-border-strong);
  border-bottom: none;
  font-weight: 700;
  color: var(--color-pp-text);
}

.cash-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-pp-border);
}

.cash-summary__item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.cash-summary__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-pp-text-dim);
}

.cash-summary__value {
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-text);
}

.cash-summary__value--gold {
  color: var(--color-pp-gold);
}
</style>
