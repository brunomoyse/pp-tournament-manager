<template>
  <div class="bounty-card">
    <div class="bounty-header">
      <div class="bounty-header__title">
        <IonIcon :icon="skullOutline" class="bounty-header__icon" />
        <h3>{{ t('bounties.title') }}</h3>
      </div>
      <span class="bounty-header__total">{{ formatPrice(totalCents, locale) }}</span>
    </div>

    <div v-if="!bounties.length" class="bounty-empty">{{ t('bounties.empty') }}</div>

    <template v-else>
      <!-- Hunter leaderboard -->
      <div class="bounty-table-wrap">
        <table class="bounty-table">
          <thead>
            <tr>
              <th class="bounty-th bounty-th--row">{{ t('bounties.hunter') }}</th>
              <th class="bounty-th bounty-th--num">{{ t('bounties.knockouts') }}</th>
              <th class="bounty-th bounty-th--num bounty-th--total">
                {{ t('bounties.collected') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in leaderboard" :key="row.name">
              <td class="bounty-td bounty-td--row">{{ row.name }}</td>
              <td class="bounty-td bounty-td--num">{{ row.count }}</td>
              <td class="bounty-td bounty-td--num bounty-td--total">
                {{ formatPrice(row.cents, locale) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Recent knockouts -->
      <ul class="bounty-feed">
        <li v-for="b in bounties" :key="b.id" class="bounty-feed__item">
          <span class="bounty-feed__text">
            <strong>{{ b.hunterName }}</strong>
            {{ t('bounties.knockedOut') }}
            <strong>{{ b.victimName }}</strong>
          </span>
          <span class="bounty-feed__amount">{{ formatPrice(b.amountCents, locale) }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { skullOutline } from 'ionicons/icons'
import { useI18n } from '~/composables/useI18n'
import { formatPrice } from '~/utils'

const props = defineProps<{ tournamentId: string }>()
const { t, locale } = useI18n()

const { data, refresh } = await useLazyAsyncData(`bounties-${props.tournamentId}`, () =>
  GqlGetTournamentBounties({ tournamentId: props.tournamentId }),
)

const bounties = computed(() => data.value?.tournamentBounties || [])
const totalCents = computed(() =>
  bounties.value.reduce((s: number, b: any) => s + b.amountCents, 0),
)

// Per-hunter totals, richest first.
const leaderboard = computed(() => {
  const map = new Map<string, { name: string; count: number; cents: number }>()
  for (const b of bounties.value) {
    const row = map.get(b.hunterClubPlayerId) || { name: b.hunterName, count: 0, cents: 0 }
    row.count += 1
    row.cents += b.amountCents
    map.set(b.hunterClubPlayerId, row)
  }
  return [...map.values()].toSorted((a, b) => b.cents - a.cents)
})

defineExpose({ refresh })
</script>

<style scoped>
.bounty-card {
  background-color: var(--color-pp-surface-2);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--color-pp-border-strong);
}

.bounty-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.bounty-header__title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.bounty-header__title h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.bounty-header__icon {
  width: 1.4rem;
  height: 1.4rem;
  color: var(--color-pp-gold);
}

.bounty-header__total {
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-gold);
}

.bounty-empty {
  text-align: center;
  color: var(--color-pp-text-muted);
  padding: 2rem 0;
}

.bounty-table-wrap {
  overflow-x: auto;
}

.bounty-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.bounty-th {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-pp-text-dim);
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--color-pp-border-strong);
  white-space: nowrap;
}

.bounty-th--row {
  text-align: left;
}

.bounty-th--num,
.bounty-td--num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.bounty-th--total,
.bounty-td--total {
  color: var(--color-pp-text);
}

.bounty-td {
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--color-pp-border);
  color: var(--color-pp-text-muted);
}

.bounty-td--row {
  text-align: left;
  color: var(--color-pp-text);
  font-weight: 500;
}

.bounty-feed {
  list-style: none;
  margin: 1.25rem 0 0;
  padding: 1.25rem 0 0;
  border-top: 1px solid var(--color-pp-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bounty-feed__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
}

.bounty-feed__text strong {
  color: var(--color-pp-text);
  font-weight: 600;
}

.bounty-feed__amount {
  font-variant-numeric: tabular-nums;
  color: var(--color-pp-gold);
  font-weight: 600;
}
</style>
