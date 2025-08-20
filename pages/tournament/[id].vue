<template>
    <ion-page class="bg-gray-50">
        <!-- Custom Header -->
        <div class="bg-white border-b border-gray-200 px-8 py-6">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-4xl font-bold text-gray-900 mb-2">Tournament Manager</h1>
                    <div class="flex items-center gap-4">
                        <span class="text-lg text-gray-600">Liège Poker Club</span>
                        <div class="flex items-center gap-2">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                connectionStatus === 'connected' ? 'bg-green-500' : 
                                connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
                            ]"></div>
                            <span class="text-sm text-gray-500 capitalize">{{ connectionStatus === 'connected' ? 'Connected' : connectionStatus }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-500">Last update: {{ new Date(lastUpdate).toLocaleTimeString() }}</span>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <ion-select 
                            v-model="selectedTournament"
                            placeholder="Select Tournament"
                            interface="popover"
                            class="min-w-48"
                        >
                            <ion-select-option v-for="t in tournaments" :key="t.id" :value="t.id">
                                {{ t.name }}
                            </ion-select-option>
                        </ion-select>
                    </div>
                </div>
            </div>
        </div>

        <ion-content class="bg-gray-50">
            <!-- Ionic Tabs -->
            <ion-tabs>
                <ion-tab-bar slot="top" class="bg-transparent border-b-0 px-8 py-4">
                    <ion-tab-button 
                        v-for="tab in tabs" 
                        :key="tab.value"
                        :tab="tab.value"
                        class="tab-button-custom"
                    >
                        <ion-label class="text-base font-medium">{{ tab.label }}</ion-label>
                    </ion-tab-button>
                </ion-tab-bar>

                <ion-tab :tab="'overview'">
                    <div class="px-8 py-6">
                        <!-- Three Column Grid -->
                        <div class="grid grid-cols-3 gap-8 mb-12">
                    <!-- Tournament Status Card -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-xl font-semibold text-gray-900">Tournament Status</h3>
                            <ion-icon :icon="trophyOutline" class="w-6 h-6 text-gray-400"></ion-icon>
                        </div>
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Status</span>
                                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{{ currentTournament.status }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Level</span>
                                <span class="font-semibold text-gray-900">{{ currentTournament.currentLevel }}/{{ currentTournament.totalLevels }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Time Left</span>
                                <span class="font-semibold text-gray-900">{{ currentTournament.timeRemaining }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Blinds</span>
                                <span class="font-semibold text-gray-900">{{ currentTournament.blinds }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Players Card -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-xl font-semibold text-gray-900">Players</h3>
                            <ion-icon :icon="peopleOutline" class="w-6 h-6 text-gray-400"></ion-icon>
                        </div>
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Registered</span>
                                <span class="text-4xl font-bold text-gray-900">{{ currentTournament.registrations }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600">Checked In</span>
                                <span class="font-semibold text-gray-900">{{ currentTournament.checkedIn }}</span>
                            </div>
                            <div class="space-y-2">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-600">Capacity</span>
                                    <span class="font-medium">{{ currentTournament.registrations }}/{{ currentTournament.maxPlayers }}</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        class="bg-gray-900 h-2 rounded-full transition-all duration-300" 
                                        :style="{ width: (currentTournament.registrations / currentTournament.maxPlayers * 100) + '%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Prize Pool Card -->
                    <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-xl font-semibold text-gray-900">Prize Pool</h3>
                            <ion-icon :icon="trophyOutline" class="w-6 h-6 text-gray-400"></ion-icon>
                        </div>
                        <div class="space-y-6">
                            <div class="text-4xl font-bold text-gray-900 mb-6">{{ currentTournament.prizePool }}</div>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-600">1st Place</span>
                                    <span class="font-semibold text-gray-900">€810 (40%)</span>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-600">2nd Place</span>
                                    <span class="font-semibold text-gray-900">€405 (20%)</span>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-600">3rd Place</span>
                                    <span class="font-semibold text-gray-900">€243 (12%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                    <h3 class="text-xl font-semibold text-gray-900 mb-8">Recent Activity</h3>
                    <div class="space-y-6">
                        <div v-for="activity in recentActivity" :key="activity.time" class="flex items-center gap-4">
                            <div :class="[
                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                                activity.type === 'checkin' ? 'bg-green-500' :
                                activity.type === 'level' ? 'bg-blue-500' :
                                activity.type === 'registration' ? 'bg-yellow-500' :
                                activity.type === 'seating' ? 'bg-purple-500' : 'bg-gray-500'
                            ]">
                                ✓
                            </div>
                            <div class="flex-1">
                                <div class="font-medium text-gray-900">{{ activity.action }}</div>
                                <div class="text-sm text-gray-500">{{ activity.details }}</div>
                            </div>
                            <div class="text-sm text-gray-500">{{ activity.time }}</div>
                        </div>
                    </div>
                        </div>
                    </div>
                </ion-tab>

                <ion-tab :tab="'clock'">
                    <div class="px-8 py-6">
                        <div class="grid grid-cols-2 gap-8">
                            <!-- Tournament Clock Card -->
                            <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                                <div class="flex items-center gap-3 mb-8">
                                    <ion-icon :icon="timeOutline" class="w-6 h-6 text-gray-900"></ion-icon>
                                    <h3 class="text-xl font-semibold text-gray-900">Tournament Clock</h3>
                                </div>
                                
                                <!-- Large Time Display -->
                                <div class="text-center mb-8">
                                    <div class="text-8xl font-bold text-gray-900 mb-2">{{ clock.timeRemaining }}</div>
                                    <div class="text-gray-500 text-lg">Time Remaining</div>
                                </div>

                                <!-- Current and Next Blinds -->
                                <div class="grid grid-cols-2 gap-8 mb-8">
                                    <div class="text-center">
                                        <div class="text-3xl font-bold text-gray-900 mb-1">{{ currentTournament.blinds }}</div>
                                        <div class="text-gray-500">Current Blinds</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-3xl font-bold text-gray-400 mb-1">{{ currentTournament.nextBlinds }}</div>
                                        <div class="text-gray-500">Next Blinds</div>
                                    </div>
                                </div>

                                <!-- Start/Pause Button -->
                                <button 
                                    :class="[
                                        'w-full py-4 rounded-lg text-white font-medium text-lg mb-6 flex items-center justify-center gap-2',
                                        clock.running ? 'bg-gray-900' : 'bg-gray-900'
                                    ]"
                                    @click="clock.running ? clock.pause() : clock.start()"
                                >
                                    <ion-icon :icon="clock.running ? pauseOutline : playOutline" class="w-5 h-5"></ion-icon>
                                    {{ clock.running ? 'Pause' : 'Start' }}
                                </button>

                                <!-- Control Buttons Row 1 -->
                                <div class="grid grid-cols-2 gap-4 mb-4">
                                    <button class="py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                                        <ion-icon :icon="playSkipBackOutline" class="w-4 h-4"></ion-icon>
                                        Previous Level
                                    </button>
                                    <button class="py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                                        <ion-icon :icon="playSkipForwardOutline" class="w-4 h-4"></ion-icon>
                                        Next Level
                                    </button>
                                </div>

                                <!-- Control Buttons Row 2 -->
                                <div class="grid grid-cols-2 gap-4">
                                    <button class="py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                                        <ion-icon :icon="cafeOutline" class="w-4 h-4"></ion-icon>
                                        Start Break
                                    </button>
                                    <button 
                                        class="py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
                                        @click="showAnnouncementModal"
                                    >
                                        <ion-icon :icon="megaphoneOutline" class="w-4 h-4"></ion-icon>
                                        Announce
                                    </button>
                                </div>
                            </div>

                            <!-- Blind Structure Card -->
                            <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                                <h3 class="text-xl font-semibold text-gray-900 mb-8">Blind Structure</h3>
                                
                                <div class="space-y-3">
                                    <div 
                                        v-for="level in blindStructure" 
                                        :key="level.level"
                                        :class="[
                                            'flex items-center justify-between py-4 px-4 rounded-lg',
                                            level.level === currentTournament.currentLevel 
                                                ? 'bg-gray-900 text-white' 
                                                : 'bg-gray-50 text-gray-900'
                                        ]"
                                    >
                                        <div class="flex items-center gap-4">
                                            <div :class="[
                                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                                level.level === currentTournament.currentLevel 
                                                    ? 'bg-white text-gray-900' 
                                                    : 'bg-white text-gray-900'
                                            ]">
                                                {{ level.level }}
                                            </div>
                                            <div>
                                                <div class="font-semibold">{{ level.smallBlind }}/{{ level.bigBlind }}</div>
                                                <div v-if="level.ante > 0" :class="[
                                                    'text-sm',
                                                    level.level === currentTournament.currentLevel 
                                                        ? 'text-gray-300' 
                                                        : 'text-gray-500'
                                                ]">
                                                    Ante: {{ level.ante }}
                                                </div>
                                            </div>
                                        </div>
                                        <div :class="[
                                            'text-sm font-medium',
                                            level.level === currentTournament.currentLevel 
                                                ? 'text-gray-300' 
                                                : 'text-gray-500'
                                        ]">
                                            {{ level.duration }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ion-tab>

                <ion-tab :tab="'players'">
                    <div class="px-8 py-6">
                        <!-- Players Toolbar -->
                        <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center gap-4">
                                <!-- Search Input -->
                                <div class="relative">
                                    <ion-icon :icon="searchOutline" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"></ion-icon>
                                    <input 
                                        v-model="playerSearch"
                                        type="text" 
                                        placeholder="Search players..."
                                        class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                    />
                                </div>
                                
                                <!-- Filter Dropdown -->
                                <div class="relative">
                                    <ion-select 
                                        v-model="playerFilter"
                                        placeholder="All Players"
                                        interface="popover"
                                        class="min-w-32"
                                    >
                                        <ion-select-option value="all">All Players</ion-select-option>
                                        <ion-select-option value="registered">Registered</ion-select-option>
                                        <ion-select-option value="checked-in">Checked In</ion-select-option>
                                        <ion-select-option value="seated">Seated</ion-select-option>
                                        <ion-select-option value="eliminated">Eliminated</ion-select-option>
                                    </ion-select>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex items-center gap-3">
                                <button 
                                    @click="showRegisterModal"
                                    class="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800"
                                >
                                    <ion-icon :icon="personAddOutline" class="w-4 h-4"></ion-icon>
                                    Register Player
                                </button>
                                <button 
                                    @click="showWalkInModal"
                                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50"
                                >
                                    <ion-icon :icon="personAddOutline" class="w-4 h-4"></ion-icon>
                                    Walk-in
                                </button>
                                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50">
                                    <ion-icon :icon="qrCodeOutline" class="w-4 h-4"></ion-icon>
                                    QR Check-in
                                </button>
                            </div>
                        </div>

                        <!-- Players List -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200">
                            <div class="divide-y divide-gray-200">
                                <div 
                                    v-for="player in filteredPlayers" 
                                    :key="player.id"
                                    class="p-6 flex items-center justify-between hover:bg-gray-50"
                                >
                                    <!-- Player Info -->
                                    <div class="flex items-center gap-4">
                                        <!-- Avatar -->
                                        <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                            {{ getInitials(player.name) }}
                                        </div>
                                        
                                        <!-- Player Details -->
                                        <div>
                                            <h3 class="font-semibold text-gray-900 text-lg">{{ player.name }}</h3>
                                            <p class="text-gray-600">{{ player.email }}</p>
                                            <p class="text-gray-500 text-sm">
                                                Registered: {{ player.registrationTime }}
                                                <span v-if="player.tableNumber"> • Table {{ player.tableNumber }}, Seat {{ player.seatNumber }}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Status and Actions -->
                                    <div class="flex items-center gap-4">
                                        <!-- Status Badge -->
                                        <span :class="[
                                            'px-3 py-1 rounded-full text-sm font-medium',
                                            getStatusBadgeClass(player.status)
                                        ]">
                                            {{ player.status }}
                                        </span>

                                        <!-- Action Buttons -->
                                        <div class="flex items-center gap-2">
                                            <!-- Check In Button -->
                                            <button 
                                                v-if="player.status === 'registered'"
                                                class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50"
                                            >
                                                <ion-icon :icon="checkmarkCircleOutline" class="w-4 h-4"></ion-icon>
                                                Check In
                                            </button>
                                            
                                            <!-- Undo and Seat Buttons -->
                                            <template v-else-if="player.status === 'checked-in'">
                                                <button class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
                                                    <ion-icon :icon="refreshOutline" class="w-4 h-4"></ion-icon>
                                                    Undo
                                                </button>
                                                <button class="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800">
                                                    <ion-icon :icon="locationOutline" class="w-4 h-4"></ion-icon>
                                                    Seat
                                                </button>
                                            </template>

                                            <!-- More Actions Button -->
                                            <button class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                                <ion-icon :icon="ellipsisVerticalOutline" class="w-4 h-4"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ion-tab>

                <ion-tab :tab="'seating'">
                    <div class="px-8 py-6">
                        <!-- Seating Toolbar -->
                        <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center gap-4">
                                <h2 class="text-2xl font-bold text-gray-900">Table Management</h2>
                                <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{{ tables.length }} Active Tables</span>
                            </div>
                            
                            <div class="flex items-center gap-3">
                                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50">
                                    <ion-icon :icon="shuffleOutline" class="w-4 h-4"></ion-icon>
                                    Auto Seat Next
                                </button>
                                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50">
                                    <ion-icon :icon="scaleOutline" class="w-4 h-4"></ion-icon>
                                    Balance Tables
                                </button>
                                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50">
                                    <ion-icon :icon="removeCircleOutline" class="w-4 h-4"></ion-icon>
                                    Break Table
                                </button>
                            </div>
                        </div>

                        <!-- Tables Grid -->
                        <div class="grid grid-cols-2 gap-8">
                            <div v-for="table in tables" :key="table.id" class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                                <!-- Table Header -->
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-xl font-bold text-gray-900">Table {{ table.number }}</h3>
                                    <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{{ table.status }}</span>
                                </div>
                                
                                <div class="text-gray-500 text-sm mb-8">{{ getOccupiedSeats(table) }}/{{ table.maxSeats }} seats occupied</div>

                                <!-- Poker Table Layout -->
                                <div class="relative mx-auto" style="width: 400px; height: 240px;">
                                    <!-- Table Surface -->
                                    <div class="absolute inset-0 bg-gray-200 rounded-full border-4 border-gray-300"></div>
                                    
                                    <!-- Table Center Label -->
                                    <div class="absolute inset-0 flex items-center justify-center">
                                        <div class="text-center">
                                            <div class="text-2xl font-bold text-gray-600">T{{ table.number }}</div>
                                            <div class="text-sm text-gray-500">{{ getOccupiedSeats(table) }}/{{ table.maxSeats }}</div>
                                        </div>
                                    </div>

                                    <!-- Player Seats - Better Circular Positioning -->
                                    <div 
                                        v-for="(player, seatIndex) in table.seats" 
                                        :key="seatIndex"
                                        :class="[
                                            'absolute w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all',
                                            player 
                                                ? 'bg-gray-900 border-gray-900 text-white' 
                                                : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                                        ]"
                                        :style="getSeatPosition(seatIndex, table.maxSeats)"
                                        :title="player ? player.name : `Seat ${seatIndex + 1} - Empty`"
                                    >
                                        {{ player ? getInitials(player.name) : seatIndex + 1 }}
                                    </div>
                                </div>

                                <!-- Seated Players List -->
                                <div class="mt-8">
                                    <h4 class="font-semibold text-gray-900 mb-4">Seated Players:</h4>
                                    <div v-if="getSeatedPlayers(table).length === 0" class="text-gray-500 text-sm">
                                        No players seated
                                    </div>
                                    <div v-else class="space-y-2">
                                        <div 
                                            v-for="(seatedPlayer, index) in getSeatedPlayers(table)" 
                                            :key="index"
                                            class="flex items-center justify-between text-sm py-2"
                                        >
                                            <span class="text-gray-900">
                                                Seat {{ seatedPlayer.seatNumber }}: {{ seatedPlayer.player.name }}
                                            </span>
                                            <button class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                                                <ion-icon :icon="moveOutline" class="w-4 h-4"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ion-tab>

                <ion-tab :tab="'settings'">
                    <div class="px-8 py-6">
                        <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                            <div class="flex items-center gap-3 mb-6">
                                <ion-icon :icon="settingsOutline" class="w-6 h-6 text-gray-900"></ion-icon>
                                <h3 class="text-xl font-semibold text-gray-900">Tournament Settings</h3>
                            </div>
                            <p class="text-gray-500">Tournament configuration and advanced settings will be available here.</p>
                        </div>
                    </div>
                </ion-tab>
            </ion-tabs>
        </ion-content>

        <!-- Announcement Modal -->
        <ion-modal :is-open="announcementModalOpen" @did-dismiss="announcementModalOpen = false">
            <ion-header>
                <ion-toolbar>
                    <ion-title>Broadcast Announcement</ion-title>
                    <ion-buttons slot="end">
                        <ion-button @click="announcementModalOpen = false">Close</ion-button>
                    </ion-buttons>
                </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
                <ion-item>
                    <ion-label position="stacked">Message</ion-label>
                    <ion-textarea placeholder="Enter your announcement..." :rows="4"></ion-textarea>
                </ion-item>
                <ion-button expand="block" class="ion-margin-top">Send to All</ion-button>
                <ion-button expand="block" fill="outline">Send to Tables</ion-button>
            </ion-content>
        </ion-modal>

        <!-- Register Player Modal -->
        <ion-modal :is-open="registerModalOpen" @did-dismiss="registerModalOpen = false">
            <ion-header>
                <ion-toolbar>
                    <ion-title>Register Existing Player</ion-title>
                    <ion-buttons slot="end">
                        <ion-button @click="registerModalOpen = false">Close</ion-button>
                    </ion-buttons>
                </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
                <ion-item>
                    <ion-label position="stacked">Search Player</ion-label>
                    <ion-input placeholder="Enter name or email..."></ion-input>
                </ion-item>
                <ion-button expand="block" class="ion-margin-top">Register Player</ion-button>
            </ion-content>
        </ion-modal>

        <!-- Walk-in Modal -->
        <ion-modal :is-open="walkInModalOpen" @did-dismiss="walkInModalOpen = false">
            <ion-header>
                <ion-toolbar>
                    <ion-title>Walk-in Registration</ion-title>
                    <ion-buttons slot="end">
                        <ion-button @click="walkInModalOpen = false">Close</ion-button>
                    </ion-buttons>
                </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
                <ion-item>
                    <ion-label position="stacked">Full Name</ion-label>
                    <ion-input placeholder="Enter full name..."></ion-input>
                </ion-item>
                <ion-item>
                    <ion-label position="stacked">Email</ion-label>
                    <ion-input type="email" placeholder="Enter email..."></ion-input>
                </ion-item>
                <ion-item>
                    <ion-label position="stacked">Phone</ion-label>
                    <ion-input placeholder="Enter phone number..."></ion-input>
                </ion-item>
                <ion-button expand="block" class="ion-margin-top">Register Walk-in</ion-button>
            </ion-content>
        </ion-modal>
    </ion-page>
</template>

<script setup lang="ts">
import { settingsOutline, megaphoneOutline, personAddOutline, trophyOutline, peopleOutline, timeOutline, playOutline, pauseOutline, playSkipBackOutline, playSkipForwardOutline, cafeOutline, searchOutline, qrCodeOutline, checkmarkCircleOutline, refreshOutline, locationOutline, ellipsisVerticalOutline, shuffleOutline, scaleOutline, removeCircleOutline, moveOutline } from 'ionicons/icons'
import { useTournamentData } from '@/composables/useTournamentData'
import { useTournamentClock } from '@/composables/useTournamentClock'

const route = useRoute()
const connectionStatus = ref<'connected' | 'disconnected' | 'reconnecting'>('connected')
const lastUpdate = ref(Date.now())

const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Clock', value: 'clock' },
    { label: 'Players', value: 'players' },
    { label: 'Seating', value: 'seating' },
    { label: 'Settings', value: 'settings' }
]

const announcementModalOpen = ref(false)
const registerModalOpen = ref(false)
const walkInModalOpen = ref(false)

const showAnnouncementModal = () => {
    announcementModalOpen.value = true
}

const showRegisterModal = () => {
    registerModalOpen.value = true
}

const showWalkInModal = () => {
    walkInModalOpen.value = true
}

const { tournaments, players, tables, blindStructure, recentActivity } = useTournamentData()

const selectedTournament = ref<string>((route.params.id as string) || tournaments.value[0].id)

const currentTournament = computed(() => tournaments.value.find(t => t.id === selectedTournament.value)!)

// Keep page clock in sync with composable for demo
const clock = reactive({
    ...useTournamentClock(currentTournament.value.timeRemaining || '15:00'),
})

watch(
    () => clock.timeRemaining,
    v => {
        // mirror into currentTournament for display in Overview
        currentTournament.value.timeRemaining = v
    }
)

// Filters
const playerSearch = ref('')
const playerFilter = ref('all')
const filteredPlayers = computed(() => {
    return players.value.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(playerSearch.value.toLowerCase()) ||
            p.email.toLowerCase().includes(playerSearch.value.toLowerCase())
        const matchesFilter = playerFilter.value === 'all' || p.status === (playerFilter.value as any)
        return matchesSearch && matchesFilter
    })
})

// Helper functions
const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'seated':
            return 'bg-green-100 text-green-700'
        case 'checked-in':
            return 'bg-blue-100 text-blue-700'
        case 'registered':
            return 'bg-yellow-100 text-yellow-700'
        case 'eliminated':
            return 'bg-red-100 text-red-700'
        default:
            return 'bg-gray-100 text-gray-700'
    }
}

// Table seating helper functions
const getOccupiedSeats = (table: any) => {
    return table.seats.filter((seat: any) => seat !== null).length
}

const getSeatedPlayers = (table: any) => {
    return table.seats
        .map((player: any, index: number) => player ? { player, seatNumber: index + 1 } : null)
        .filter((item: any) => item !== null)
}

const getSeatPosition = (seatIndex: number, totalSeats: number) => {
    // Improved positioning for better circular layout around oval table
    const angle = (seatIndex / totalSeats) * 2 * Math.PI - Math.PI / 2
    
    // Use elliptical positioning for more realistic poker table layout
    const radiusX = 180 // horizontal radius
    const radiusY = 96  // vertical radius
    
    const x = Math.cos(angle) * radiusX
    const y = Math.sin(angle) * radiusY
    
    // Center the seat and adjust for seat size (48px / 2 = 24px)
    return {
        left: `${200 + x - 24}px`,  // 200 is half of table width (400px)
        top: `${120 + y - 24}px`    // 120 is half of table height (240px)
    }
}

// Fake polling / connection changes
const poll = setInterval(() => {
    lastUpdate.value = Date.now()
    if (Math.random() < 0.05) {
        connectionStatus.value = 'reconnecting'
        setTimeout(() => (connectionStatus.value = 'connected'), 2000)
    }
}, 5000)

onBeforeUnmount(() => clearInterval(poll))
</script>

<style>
/* Custom tab styling to match the design */
.tab-button-custom {
  --background: transparent;
  --background-selected: white;
  --color: #6b7280;
  --color-selected: #111827;
  --border-radius: 12px;
  --padding-start: 32px;
  --padding-end: 32px;
  --margin: 4px;
  --box-shadow: none;
  --box-shadow-selected: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  margin: 0 2px;
}

.tab-button-custom ion-label {
  font-weight: 500;
  font-size: 16px;
}

/* Remove default ionic tab bar styling */
ion-tab-bar {
  border: none !important;
}
</style>