<template>
    <ion-card>
        <ion-list>
            <ion-item v-for="p in players" :key="p.id" lines="full">
                <ion-avatar slot="start">
                    <div class="w-full h-full bg-primary/20 flex items-center justify-center">
                        <span class="text-sm font-bold text-primary">{{ initials(p.name) }}</span>
                    </div>
                </ion-avatar>
                <ion-label>
                    <h2>{{ p.name }}</h2>
                    <p>{{ p.email }}</p>
                    <p>
                        <ion-note>Registered: {{ p.registrationTime }}</ion-note>
                        <ion-note v-if="p.tableNumber"> • Table {{ p.tableNumber }}, Seat {{ p.seatNumber }}</ion-note>
                    </p>
                </ion-label>
                <ion-badge slot="end" :color="statusColor(p.status)">{{ p.status }}</ion-badge>
                <ion-buttons slot="end">
                    <ion-button v-if="p.status === 'registered'" fill="outline" size="small">
                        <ion-icon slot="start" :icon="checkmarkCircleOutline"></ion-icon>
                        Check In
                    </ion-button>
                    <template v-else-if="p.status === 'checked-in'">
                        <ion-button fill="outline" size="small">
                            <ion-icon slot="start" :icon="refreshOutline"></ion-icon>
                            Undo
                        </ion-button>
                        <ion-button fill="solid" size="small">
                            <ion-icon slot="start" :icon="shuffleOutline"></ion-icon>
                            Seat
                        </ion-button>
                    </template>
                    <ion-button fill="clear" size="small">
                        <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-item>
        </ion-list>
    </ion-card>
</template>
<script setup lang="ts">
import { checkmarkCircleOutline, refreshOutline, shuffleOutline, ellipsisVertical } from 'ionicons/icons'
import type { Player } from '~/types/tournament'

const props = defineProps<{ players: Player[] }>()

function initials(n: string) {
    return n.split(' ').map(x => x[0]).join('')
}
function statusColor(status: Player['status']) {
    switch (status) {
        case 'registered':
            return 'warning'
        case 'checked-in':
            return 'primary'
        case 'seated':
            return 'success'
        case 'eliminated':
            return 'danger'
        default:
            return 'medium'
    }
}
</script>