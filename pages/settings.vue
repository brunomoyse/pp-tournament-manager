<template>
  <IonPage class="page-bg">
    <IonContent class="content-bg">
      <div class="page-container">
        <PpFadeUp>
          <p class="eyebrow">{{ t('nav.settings') }}</p>
          <h1 class="page-title">{{ t('settings.title') }}</h1>
        </PpFadeUp>

        <PpFadeUp :delay="0.08">
          <section class="settings-section">
            <div class="settings-section__head">
              <h2 class="settings-section__title">{{ t('theme.label') }}</h2>
              <p class="settings-section__help">{{ t('settings.themeHelp') }}</p>
            </div>

            <div class="theme-options" role="radiogroup" :aria-label="t('theme.label')">
              <button
                v-for="opt in themes"
                :key="opt.id"
                type="button"
                role="radio"
                class="theme-option"
                :class="{ 'theme-option--active': themeStore.theme === opt.id }"
                :aria-checked="themeStore.theme === opt.id"
                @click="themeStore.setTheme(opt.id)"
              >
                <span class="theme-option__swatch" :style="{ backgroundColor: opt.swatch }" />
                <span class="theme-option__name">{{ t(opt.labelKey) }}</span>
                <IonIcon
                  v-if="themeStore.theme === opt.id"
                  :icon="checkmarkCircle"
                  class="theme-option__check"
                />
              </button>
            </div>
          </section>
        </PpFadeUp>

        <PpFadeUp :delay="0.12">
          <section class="settings-section">
            <div class="settings-section__head">
              <h2 class="settings-section__title">{{ t('settings.planTitle') }}</h2>
              <p class="settings-section__help">{{ t('settings.planHelp') }}</p>
            </div>

            <div class="plan-row">
              <div class="plan-row__info">
                <span class="plan-row__label">{{ t('settings.currentPlan') }}</span>
                <span class="plan-row__value">
                  {{ planLabel }}
                  <span v-if="renewalDate" class="plan-row__renewal">
                    · {{ t('settings.renews', { date: renewalDate }) }}
                  </span>
                </span>
              </div>
              <span class="plan-badge" :class="`plan-badge--${currentPlan}`">{{ planLabel }}</span>
            </div>

            <template v-if="currentPlan === 'FREE'">
              <PpButton
                block
                size="lg"
                :loading="isUpgrading"
                :disabled="isUpgrading"
                @click="startUpgrade"
              >
                {{ t('settings.upgradeToClub') }}
              </PpButton>
              <p v-if="upgradeError" class="plan-error">{{ upgradeError }}</p>
              <p class="plan-casino-hint">
                {{ t('settings.casinoHint') }}
                <a :href="casinoContactHref" class="plan-link">{{ t('settings.casinoLink') }}</a>
              </p>
            </template>
            <p v-else class="plan-note">{{ t('settings.planActive') }}</p>
          </section>
        </PpFadeUp>
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  title: 'nav.settings',
})

import { ref, computed, onMounted } from 'vue'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import { checkmarkCircle } from 'ionicons/icons'
import { useThemeStore, THEMES } from '~/stores/useThemeStore'
import { useI18n } from '~/composables/useI18n'
import { useAuthStore } from '~/stores/useAuthStore'

const { t } = useI18n()
const themeStore = useThemeStore()
const themes = THEMES

const authStore = useAuthStore()
const config = useRuntimeConfig()
const casinoContactHref = 'mailto:cloud@nuagemagique.dev'

const isUpgrading = ref(false)
const upgradeError = ref('')

// Current club's plan — defaults to FREE until `me` resolves.
const currentPlan = computed<'FREE' | 'CLUB' | 'CASINO'>(
  () => (authStore.currentUser as any)?.managedClub?.plan ?? 'FREE',
)
const planLabel = computed(() => {
  switch (currentPlan.value) {
    case 'CLUB':
      return t('settings.planClub')
    case 'CASINO':
      return t('settings.planCasino')
    default:
      return t('settings.planFree')
  }
})
const renewalDate = computed(() => {
  const iso = (authStore.currentUser as any)?.managedClub?.subscriptionExpiresAt
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
})

// Kick off a Mollie checkout via the payments microservice (see tsb-service).
// Until that service is configured, fall back to the contact link.
const startUpgrade = async () => {
  upgradeError.value = ''
  const clubId = (authStore.currentUser as any)?.managedClub?.id
  if (!clubId) return

  const base = config.public.paymentsBaseUrl as string
  if (!base) {
    window.location.href = casinoContactHref
    return
  }

  isUpgrading.value = true
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.authToken}`,
      },
      body: JSON.stringify({
        clubId,
        plan: 'CLUB',
        returnUrl: `${window.location.origin}/settings`,
      }),
    })
    if (!res.ok) throw new Error('checkout failed')
    const data = await res.json()
    if (data?.checkoutUrl) {
      window.location.href = data.checkoutUrl
    } else {
      throw new Error('missing checkout url')
    }
  } catch {
    upgradeError.value = t('settings.upgradeError')
  } finally {
    isUpgrading.value = false
  }
}

// Refresh the plan on mount so returning from a successful checkout reflects
// the upgrade immediately.
onMounted(() => {
  if (authStore.isAuthenticated) authStore.fetchMe().catch(() => {})
})
</script>

<style scoped>
.page-bg,
.content-bg {
  background-color: var(--color-pp-bg);
}

.page-container {
  padding: 1.5rem 1rem;
  max-width: 720px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .page-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
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

.settings-section {
  margin-top: 2rem;
}

.settings-section__title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-pp-text);
}

.settings-section__help {
  margin-top: 0.2rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
}

.theme-options {
  display: grid;
  gap: 0.5rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  color: var(--color-pp-text-muted);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.theme-option:hover {
  color: var(--color-pp-text);
  border-color: var(--color-pp-border-strong);
}

.theme-option--active {
  color: var(--color-pp-text);
  border-color: var(--color-pp-gold);
  background-color: var(--color-pp-surface-2);
}

.theme-option__swatch {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.theme-option__name {
  flex: 1;
  text-align: left;
}

.theme-option__check {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-pp-gold);
  flex-shrink: 0;
}

/* Club plan section */
.plan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid var(--color-pp-border);
  background-color: var(--color-pp-surface);
  margin-bottom: 1rem;
}

.plan-row__info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.plan-row__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-pp-text-dim);
}

.plan-row__value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-pp-text);
}

.plan-row__renewal {
  color: var(--color-pp-text-dim);
  font-weight: 400;
}

.plan-badge {
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  border: 1px solid var(--color-pp-border-strong);
  color: var(--color-pp-text-muted);
}
.plan-badge--CLUB,
.plan-badge--CASINO {
  color: var(--color-pp-gold);
  border-color: var(--color-pp-gold);
  background-color: rgba(var(--pp-accent-rgb), 0.08);
}

.plan-error {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  color: var(--color-pp-danger);
  text-align: center;
}

.plan-casino-hint {
  margin-top: 0.8rem;
  font-size: 0.8rem;
  color: var(--color-pp-text-dim);
  text-align: center;
}

.plan-link {
  color: var(--color-pp-gold);
  font-weight: 500;
  margin-left: 0.2rem;
}

.plan-note {
  font-size: 0.85rem;
  color: var(--color-pp-text-muted);
}
</style>
