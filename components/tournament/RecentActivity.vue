<template>
    <ion-card>
        <ion-card-header>
            <ion-card-title>Recent Activity</ion-card-title>
        </ion-card-header>
        <ion-card-content>
            <ion-list>
                <ion-item v-for="(a, i) in items" :key="i" lines="full">
                    <ion-icon slot="start" :icon="icon(a.type)" :color="iconColor(a.type)"></ion-icon>
                    <ion-label>
                        <h3>{{ a.action }}</h3>
                        <p>{{ a.details }}</p>
                    </ion-label>
                    <ion-note slot="end">{{ a.time }}</ion-note>
                </ion-item>
            </ion-list>
        </ion-card-content>
    </ion-card>
</template>
<script setup lang="ts">
import { checkmarkCircleOutline, timeOutline, personAddOutline, shuffleOutline, alertCircleOutline } from 'ionicons/icons'
import type { ActivityItem } from '~/types/tournament'

const props = defineProps<{ items: ActivityItem[] }>()

function icon(t: ActivityItem['type']) {
    switch (t) {
        case 'checkin':
            return checkmarkCircleOutline
        case 'level':
            return timeOutline
        case 'registration':
            return personAddOutline
        case 'seating':
            return shuffleOutline
        default:
            return alertCircleOutline
    }
}
function iconColor(t: ActivityItem['type']) {
    return t === 'checkin'
        ? 'success'
        : t === 'level'
            ? 'primary'
            : t === 'registration'
                ? 'warning'
                : t === 'seating'
                    ? 'tertiary'
                    : 'medium'
}
</script>