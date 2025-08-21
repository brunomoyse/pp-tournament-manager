<template>
    <ion-card>
        <ion-list>
            <ion-item v-for="p in players" :key="p.id" lines="none" class="compact-player-item">
                <div slot="start" class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <span class="text-xs font-bold text-primary">{{ initials(p.name) }}</span>
                </div>
                <ion-label class="py-2">
                    <div class="flex items-center gap-2">
                        <h3 class="font-semibold text-sm">{{ p.name }}</h3>
                        <ion-badge :color="statusColor(p.status)" class="text-xs">{{ p.status }}</ion-badge>
                        <ion-note v-if="p.tableNumber" class="text-xs">Table {{ p.tableNumber }}, Seat {{ p.seatNumber }}</ion-note>
                    </div>
                    <div class="flex items-center gap-3 mt-1">
                        <p class="text-xs text-gray-500">{{ p.email }}</p>
                        <ion-note class="text-xs">{{ p.registrationTime }}</ion-note>
                    </div>
                </ion-label>
                <ion-buttons slot="end" class="gap-1">
                    <ion-button v-if="p.status === 'registered'" fill="clear" size="small" class="text-xs">
                        <ion-icon slot="icon-only" :icon="checkmarkCircleOutline"></ion-icon>
                    </ion-button>
                    <template v-else-if="p.status === 'checked-in'">
                        <ion-button fill="clear" size="small" class="text-xs">
                            <ion-icon slot="icon-only" :icon="refreshOutline"></ion-icon>
                        </ion-button>
                        <ion-button fill="clear" size="small" class="text-xs">
                            <ion-icon slot="icon-only" :icon="shuffleOutline"></ion-icon>
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
<style scoped>
.compact-player-item {
    --padding-top: 8px;
    --padding-bottom: 8px;
    --inner-padding-end: 8px;
    --min-height: 48px;
}
.compact-player-item ion-button {
    --padding-start: 4px;
    --padding-end: 4px;
    height: 28px;
}
</style>