<template>
    <ion-toolbar>
        <ion-buttons slot="start">
            <ion-title size="small">Table Management</ion-title>
            <ion-badge color="medium">{{ count }} Active Tables</ion-badge>
        </ion-buttons>
        <ion-buttons slot="end">
            <ion-button fill="outline">
                <ion-icon slot="start" :icon="shuffleOutline"></ion-icon>
                Auto Seat Next
            </ion-button>
            <ion-button fill="outline">
                <ion-icon slot="start" :icon="moveOutline"></ion-icon>
                Balance Tables
            </ion-button>
            <ion-button fill="outline">
                <ion-icon slot="start" :icon="closeCircleOutline"></ion-icon>
                Break Table
            </ion-button>
        </ion-buttons>
    </ion-toolbar>
</template>
<script setup lang="ts">
import { shuffleOutline, moveOutline, closeCircleOutline } from 'ionicons/icons'

const props = defineProps<{ count: number }>()
</script>