<template>
  <div class="sheet-root">
    <!-- Screen-only toolbar (hidden when printing) -->
    <div class="toolbar no-print">
      <button class="toolbar__btn" @click="doPrint">{{ t('exports.print') }}</button>
      <span class="toolbar__hint">{{ t('exports.printHint') }}</span>
    </div>

    <article class="sheet">
      <header class="sheet__head">
        <div>
          <p v-if="clubName" class="sheet__club">{{ clubName }}</p>
          <h1 class="sheet__title">{{ tournament?.title || '' }}</h1>
          <p class="sheet__meta">
            <span v-if="tournamentDate">{{ tournamentDate }}</span>
            <span v-if="tournament?.buyInCents">
              · {{ t('exports.buyIn') }} {{ formatPrice(tournament.buyInCents, priceLocale) }}
            </span>
          </p>
        </div>
        <div class="sheet__doc">
          <p class="sheet__doc-kind">{{ docTitle }}</p>
          <p class="sheet__printed">{{ t('exports.printedOn') }} {{ printedAt }}</p>
        </div>
      </header>

      <!-- Payout sheet -->
      <table v-if="doc === 'payouts'" class="sheet__table">
        <thead>
          <tr>
            <th class="col-pos">{{ t('exports.col.position') }}</th>
            <th class="col-name">{{ t('exports.col.player') }}</th>
            <th class="col-amount">{{ t('exports.col.prize') }}</th>
            <th class="col-sign">{{ t('exports.col.signature') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in payoutRows" :key="row.position">
            <td class="col-pos">{{ row.position }}</td>
            <td class="col-name">{{ row.name }}</td>
            <td class="col-amount">{{ formatPrice(row.prizeCents, priceLocale) }}</td>
            <td class="col-sign"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="sheet__total-label">{{ t('exports.totalPrizePool') }}</td>
            <td class="col-amount">{{ formatPrice(totalPrize, priceLocale) }}</td>
            <td class="col-sign"></td>
          </tr>
        </tfoot>
      </table>

      <!-- Player list -->
      <table v-else-if="doc === 'players'" class="sheet__table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-name">{{ t('exports.col.player') }}</th>
            <th class="col-status">{{ t('exports.col.status') }}</th>
            <th class="col-seat">{{ t('exports.col.seat') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in playerRows" :key="row.id">
            <td class="col-num">{{ i + 1 }}</td>
            <td class="col-name">{{ row.name }}</td>
            <td class="col-status">{{ getRegistrationStatusLabel(row.status, t) }}</td>
            <td class="col-seat">{{ row.seat }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="loaded && rowCount === 0" class="sheet__empty">{{ t('exports.noData') }}</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '~/composables/useI18n'
import { useClubStore } from '~/stores/useClubStore'
import { formatPrice } from '~/utils'
import { getRegistrationStatusLabel } from '~/utils/registrationStatus'

// A printable paper document: light theme on purpose (ink on paper), distinct
// from the dark app surface. No layout, no auth — fed by public queries so a
// document can be printed from a fresh tab.
definePageMeta({ layout: false, title: 'nav.tournaments' })

const { t, locale } = useI18n()
const route = useRoute()
const clubStore = useClubStore()
const tournamentId = route.params.id as string
const doc = computed(() => (route.query.doc as string) || 'payouts')

const priceLocale = computed(() => (locale.value === 'en' ? 'en-BE' : `${locale.value}-BE`))

const tournament = ref<any>(null)
const payout = ref<any>(null)
const results = ref<any[]>([])
const players = ref<any[]>([])
const seating = ref<any>(null)
const loaded = ref(false)

const clubName = computed(() => clubStore.club?.name || '')

const tournamentDate = computed(() => {
  if (!tournament.value?.startTime) return ''
  return new Date(tournament.value.startTime).toLocaleDateString(priceLocale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const printedAt = computed(() =>
  new Date().toLocaleString(priceLocale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }),
)

const docTitle = computed(() =>
  doc.value === 'players' ? t('exports.doc.playerList') : t('exports.doc.payoutSheet'),
)

// ── Payout rows: prefer real recorded results, fall back to the payout
//    structure (positions without names) when results aren't entered yet. ──
const payoutRows = computed(() => {
  if (results.value.length) {
    return [...results.value]
      .filter((r) => r.prizeCents > 0)
      .toSorted((a, b) => a.finalPosition - b.finalPosition)
      .map((r) => ({ position: r.finalPosition, name: r.displayName, prizeCents: r.prizeCents }))
  }
  const positions = payout.value?.positions || []
  return [...positions]
    .toSorted((a: any, b: any) => a.position - b.position)
    .map((p: any) => ({ position: p.position, name: '', prizeCents: p.amountCents }))
})

const totalPrize = computed(
  () => payout.value?.totalPrizePool || payoutRows.value.reduce((s, r) => s + r.prizeCents, 0),
)

// ── Player list rows: status + seat (seat resolved from the seating chart). ──
const seatByPlayer = computed(() => {
  const map = new Map<string, string>()
  for (const tbl of seating.value?.tables || []) {
    const tableNo = tbl.table?.tableNumber
    for (const s of tbl.seats || []) {
      const a = s.assignment
      const key = a?.clubPlayerId || a?.userId
      if (key && a?.seatNumber != null) map.set(key, `T${tableNo} · S${a.seatNumber}`)
    }
  }
  return map
})

const playerRows = computed(() =>
  players.value
    .filter((tp: any) => tp.registration.status !== 'CANCELLED')
    .map((tp: any) => {
      const key = tp.registration.clubPlayerId || tp.registration.userId
      return {
        id: tp.registration.id,
        name: tp.displayName || tp.user?.username || tp.user?.email || '—',
        status: tp.registration.status,
        seat: (key && seatByPlayer.value.get(key)) || '',
      }
    })
    .sort((a: any, b: any) => a.name.localeCompare(b.name)),
)

const rowCount = computed(() =>
  doc.value === 'players' ? playerRows.value.length : payoutRows.value.length,
)

const doPrint = () => window.print()

onMounted(async () => {
  try {
    const res = await GqlGetTournament({ id: tournamentId })
    tournament.value = res?.tournament || null
  } catch (e) {
    console.error('[Print] tournament load failed:', e)
  }

  if (doc.value === 'payouts') {
    try {
      const [r, p] = await Promise.all([
        GqlGetTournamentResults({ tournamentId }),
        GqlGetTournamentPayout({ tournamentId }),
      ])
      results.value = r?.tournamentResults || []
      payout.value = p?.tournamentPayout || null
    } catch (e) {
      console.error('[Print] payout load failed:', e)
    }
  } else {
    try {
      const [pl, sc] = await Promise.all([
        GqlGetTournamentPlayers({ tournamentId, pagination: { limit: 500 } }),
        GqlGetTournamentSeatingChart({ tournamentId }).catch(() => null),
      ])
      players.value = pl?.tournamentPlayers?.items || []
      seating.value = sc?.tournamentSeatingChart || null
    } catch (e) {
      console.error('[Print] player list load failed:', e)
    }
  }

  loaded.value = true
  // Give Vue a tick to paint the table before opening the print dialog.
  await nextTick()
  setTimeout(doPrint, 300)
})
</script>

<style scoped>
.sheet-root {
  background: #f3f4f6;
  min-height: 100dvh;
  padding: 1.5rem;
  color: #111827;
}

.toolbar {
  max-width: 21cm;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar__btn {
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
}

.toolbar__btn:hover {
  background: #374151;
}

.toolbar__hint {
  color: #6b7280;
  font-size: 0.85rem;
}

.sheet {
  max-width: 21cm;
  min-height: 29.7cm;
  margin: 0 auto;
  background: #fff;
  padding: 2cm 1.8cm;
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.12);
  font-family: 'Inter', sans-serif;
}

.sheet__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #111827;
  margin-bottom: 1.5rem;
}

.sheet__club {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
}

.sheet__title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.15;
  margin-top: 0.15rem;
  /* Override the app's global gradient/clip h1 styling for ink-on-paper. */
  color: #111827;
  background: none;
  -webkit-text-fill-color: #111827;
  -webkit-background-clip: border-box;
}

.sheet__meta {
  margin-top: 0.3rem;
  color: #4b5563;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.sheet__doc {
  text-align: right;
  flex-shrink: 0;
}

.sheet__doc-kind {
  font-weight: 700;
  font-size: 1rem;
}

.sheet__printed {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

.sheet__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.sheet__table th {
  text-align: left;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #d1d5db;
}

.sheet__table td {
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid #e5e7eb;
}

.col-pos,
.col-num {
  width: 3rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.col-amount {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.col-sign {
  width: 38%;
}

.col-status,
.col-seat {
  width: 22%;
}

.sheet__total-label {
  text-align: right;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
}

.sheet__table tfoot td {
  border-top: 2px solid #111827;
  border-bottom: none;
  font-weight: 700;
  padding-top: 0.7rem;
}

.sheet__empty {
  text-align: center;
  color: #6b7280;
  padding: 3rem 0;
}

@media print {
  .no-print {
    display: none !important;
  }

  .sheet-root {
    background: #fff;
    padding: 0;
  }

  .sheet {
    box-shadow: none;
    max-width: none;
    min-height: 0;
    padding: 0;
  }

  .col-sign {
    border-bottom: 1px solid #111827 !important;
  }
}

@page {
  size: A4;
  margin: 1.4cm;
}
</style>
