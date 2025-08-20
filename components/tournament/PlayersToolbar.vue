<template>
    <ion-toolbar>
        <ion-searchbar 
            v-model="search"
            placeholder="Search players..."
            slot="start"
            class="ion-no-padding"
        ></ion-searchbar>
        
        <ion-select 
            v-model="filter"
            placeholder="Filter"
            interface="popover"
            slot="start"
            class="ml-2"
        >
            <ion-select-option value="all">All Players</ion-select-option>
            <ion-select-option value="registered">Registered</ion-select-option>
            <ion-select-option value="checked-in">Checked In</ion-select-option>
            <ion-select-option value="seated">Seated</ion-select-option>
            <ion-select-option value="eliminated">Eliminated</ion-select-option>
        </ion-select>
        
        <ion-buttons slot="end">
            <slot name="register" />
            <slot name="walkin" />
            <ion-button fill="outline">
                <ion-icon slot="start" :icon="qrCodeOutline"></ion-icon>
                QR Check-in
            </ion-button>
        </ion-buttons>
    </ion-toolbar>
</template>
<script setup lang="ts">
import { qrCodeOutline } from 'ionicons/icons'

const search = defineModel<string>('search')
const filter = defineModel<string>('filter')
</script>