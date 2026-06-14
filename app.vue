<template>
  <IonApp class="pp-app">
    <PpConnectionBanner />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </IonApp>
</template>

<script setup lang="ts">
import { IonApp } from '@ionic/vue'
import { useI18n } from '~/composables/useI18n'

// Dynamic browser-tab title: each page declares an i18n key via
// `definePageMeta({ title: 'nav.x' })`; we resolve it here so the title is
// reactive to both navigation and locale changes. Pages without a key fall
// back to the bare app name.
const route = useRoute()
const { t } = useI18n()

useHead({
  titleTemplate: (title?: string | null) => (title ? `${title} · PocketPair` : 'PocketPair'),
  title: computed(() => {
    const key = route.meta.title as string | undefined
    return key ? t(key) : ''
  }),
})
</script>

<style>
.pp-app {
  font-family: var(--font-sans);
  background-color: var(--color-pp-bg);
}
</style>
