<template>
    <IonApp class="pp-app">
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </IonApp>
</template>

<script setup lang="ts">
import {
  IonApp,
} from '@ionic/vue'
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

.pp-app {
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--pp-bg-primary);
}
</style>