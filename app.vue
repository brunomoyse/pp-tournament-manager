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
</script>

<style>
.pp-app {
  font-family: var(--font-sans);
  background-color: var(--color-pp-bg);
}
</style>
