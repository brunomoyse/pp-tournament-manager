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
  IonTabs,
  IonRouterOutlet,
} from '@ionic/vue'
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

.pp-app {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #18181a;
}

.pp-tabbar {
  --background: #18181a;
  --border: 1px solid #24242a;
  height: 70px;
  border-top: 1px solid #24242a;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding-bottom: env(safe-area-inset-bottom);
}

.pp-tab-button {
  --color: #54545f;
  --color-selected: #fee78a;
  --background: transparent;
  --background-focused: transparent;
  --background-focused-opacity: 0;
  --background-activated: transparent;
  --background-activated-opacity: 0;
  --background-hover: transparent;
  --background-hover-opacity: 0;
  --background-selected: transparent;
  --ripple-color: transparent;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 12px;
  margin: 6px;
  border: 1px solid transparent;
}

.pp-tab-button:hover:not([aria-selected="true"]) {
  --color: #fee78a;
  background: rgb(254 231 138 / 0.1);
}

.pp-tab-button[aria-selected="true"] {
  --color: #fee78a;
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.3), rgba(71, 85, 105, 0.2));
  border: 1px solid rgba(100, 116, 139, 0.6);
  opacity: 1 !important;
}

.pp-tab-button[aria-selected="true"]:hover {
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.3), rgba(71, 85, 105, 0.2));
}

.pp-tab-button ion-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.pp-tab-button ion-label {
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
}

.pp-tab-disabled {
  opacity: 0.5;
}
</style>