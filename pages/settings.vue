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
      </div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  title: 'nav.settings',
})

import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import { checkmarkCircle } from 'ionicons/icons'
import { useThemeStore, THEMES } from '~/stores/useThemeStore'
import { useI18n } from '~/composables/useI18n'

const { t } = useI18n()
const themeStore = useThemeStore()
const themes = THEMES
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
</style>
