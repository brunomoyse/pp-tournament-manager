<template>
    <ion-page class="bg-pp-bg-primary">
        <!-- Custom Header -->
        <div class="bg-pp-bg-primary border-b border-pp-border px-8 py-6">
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-4 mb-2">
                        <img src="/assets/icon-no-bg.png" alt="Pocket Pair Logo" class="w-12 h-12" />
                        <h1 class="text-4xl font-bold text-pp-text-primary">Pocket Pair - Tournament Manager</h1>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-lg text-white">Liège Poker Club</span>
                        <div class="flex items-center gap-2">
                            <div :class="[
                                'w-2 h-2 rounded-full',
                                connectionStatus === 'connected' ? 'bg-green-500' : 
                                connectionStatus === 'reconnecting' ? 'bg-orange-500' : 'bg-red-500'
                            ]"></div>
                            <span :class="[
                                'text-sm capitalize font-medium',
                                connectionStatus === 'connected' ? 'text-green-500' : 
                                connectionStatus === 'reconnecting' ? 'text-orange-500' : 'text-red-500'
                            ]">{{ 
                                connectionStatus === 'connected' ? 'Connected' : 
                                connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'
                            }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-sm text-white">Last update: {{ new Date(lastUpdate).toLocaleTimeString() }}</span>
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                        <ion-select 
                            v-model="selectedTournament"
                            placeholder="Select Tournament"
                            interface="action-sheet"
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

        <ion-content class="bg-pp-bg-primary">
            <!-- Ionic Tabs -->
            <ion-tabs>
                <ion-tab-bar slot="top" class="bg-transparent border-b-0 py-6 px-8">
                    <div class="grid grid-cols-5 gap-2 bg-pp-bg-secondary/50 p-2 rounded-2xl border border-pp-border w-full">
                        <ion-tab-button 
                            v-for="tab in tabs" 
                            :key="tab.value"
                            :tab="tab.value"
                            class="tab-button-custom-grid"
                        >
                            <ion-label class="text-base font-medium">{{ tab.label }}</ion-label>
                        </ion-tab-button>
                    </div>
                </ion-tab-bar>

                <ion-tab :tab="'overview'">
                    <div class="px-8 py-6">
                        <!-- Three Column Grid -->
                        <div class="grid grid-cols-3 gap-8 mb-12">
                    <!-- Tournament Status Card -->
                    <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-xl font-semibold text-pp-text-primary">Tournament Status</h3>
                            <ion-icon :icon="trophyOutline" class="w-6 h-6 text-white"></ion-icon>
                        </div>
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <span class="text-white">Status</span>
                                <span class="px-3 py-1 bg-pp-accent-gold/20 text-pp-accent-gold rounded-full text-sm font-medium">{{ currentTournament.status }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-white">Level</span>
                                <span class="font-semibold text-white">{{ currentTournament.currentLevel }}/{{ currentTournament.totalLevels }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-white">Time Left</span>
                                <span class="font-semibold text-white">{{ currentTournament.timeRemaining }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-white">Blinds</span>
                                <span class="font-semibold text-white">{{ currentTournament.blinds }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Players Card -->
                    <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-xl font-semibold text-pp-text-primary">Players</h3>
                            <ion-icon :icon="peopleOutline" class="w-6 h-6 text-white"></ion-icon>
                        </div>
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <span class="text-white">Registered</span>
                                <span class="text-4xl font-bold text-pp-text-primary">{{ currentTournament.registrations }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-white">Checked In</span>
                                <span class="font-semibold text-white">{{ currentTournament.checkedIn }}</span>
                            </div>
                            <div class="space-y-2">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-white">Capacity</span>
                                    <span class="font-medium text-pp-text-primary">{{ currentTournament.registrations }}/{{ currentTournament.maxPlayers }}</span>
                                </div>
                                <div class="w-full bg-pp-border rounded-full h-2">
                                    <div 
                                        class="bg-pp-text-primary h-2 rounded-full transition-all duration-300" 
                                        :style="{ width: (currentTournament.registrations / currentTournament.maxPlayers * 100) + '%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Prize Pool Card -->
                    <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-xl font-semibold text-pp-text-primary">Prize Pool</h3>
                            <ion-icon :icon="trophyOutline" class="w-6 h-6 text-white"></ion-icon>
                        </div>
                        <div class="space-y-6">
                            <div class="text-4xl font-bold text-pp-text-primary mb-6">{{ currentTournament.prizePool }}</div>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-white">1st Place</span>
                                    <span class="font-semibold text-pp-text-primary">€810 (40%)</span>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-white">2nd Place</span>
                                    <span class="font-semibold text-pp-text-primary">€405 (20%)</span>
                                </div>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-white">3rd Place</span>
                                    <span class="font-semibold text-pp-text-primary">€243 (12%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                    <h3 class="text-xl font-semibold text-pp-text-primary mb-8">Recent Activity</h3>
                    <div class="space-y-6">
                        <div v-for="activity in recentActivity" :key="activity.time" class="flex items-center gap-4">
                            <div :class="[
                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                                activity.type === 'checkin' ? 'bg-green-500' :
                                activity.type === 'level' ? 'bg-blue-500' :
                                activity.type === 'registration' ? 'bg-yellow-500' :
                                activity.type === 'seating' ? 'bg-purple-500' : 'bg-pp-bg-primary0'
                            ]">
                                ✓
                            </div>
                            <div class="flex-1">
                                <div class="font-medium text-white">{{ activity.action }}</div>
                                <div class="text-sm text-white">{{ activity.details }}</div>
                            </div>
                            <div class="text-sm text-white">{{ activity.time }}</div>
                        </div>
                    </div>
                        </div>
                    </div>
                </ion-tab>

                <ion-tab :tab="'clock'">
                    <div class="px-8 py-6">
                        <div class="grid grid-cols-2 gap-8">
                            <!-- Tournament Clock Card -->
                            <div class="tournament-clock-card bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border relative" style="background-color: #24242a !important;">
                                <div class="flex items-center justify-between mb-8 fullscreen-header">
                                    <div class="flex items-center gap-3">
                                        <ion-icon :icon="timeOutline" class="w-6 h-6 text-pp-text-primary"></ion-icon>
                                        <h3 class="text-xl font-semibold text-pp-text-primary">Tournament Clock</h3>
                                        <!-- Connection Status Indicator -->
                                        <div class="flex items-center gap-2">
                                            <div :class="[
                                                'w-2 h-2 rounded-full',
                                                clock.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                                            ]"></div>
                                            <span class="text-xs text-white/60">
                                                {{ clock.connected ? 'Live' : 'Local' }}
                                            </span>
                                            <!-- Error indicator -->
                                            <div v-if="clock.error" class="flex items-center gap-1 text-red-400">
                                                <ion-icon :icon="closeOutline" class="w-3 h-3"></ion-icon>
                                                <span class="text-xs">Error</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        @click="toggleFullscreen"
                                        class="p-2 rounded-lg hover:bg-pp-border transition-colors duration-200 fullscreen-toggle"
                                        title="Toggle Fullscreen"
                                    >
                                        <ion-icon :icon="expandOutline" class="w-5 h-5 text-pp-text-primary"></ion-icon>
                                    </button>
                                </div>
                                
                                <!-- Normal View -->
                                <div class="normal-view">
                                    <!-- Large Time Display -->
                                    <div class="text-center mb-8">
                                        <div class="text-8xl font-bold text-pp-text-primary mb-2">{{ clock.timeRemaining }}</div>
                                        <div class="text-white text-lg">Time Remaining</div>
                                    </div>

                                    <!-- Current and Next Blinds -->
                                    <div class="grid grid-cols-2 gap-8 mb-8">
                                        <div class="text-center">
                                            <div class="text-3xl font-bold text-pp-text-primary mb-1">{{ currentTournament.blinds }}</div>
                                            <div class="text-white">Current Blinds</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="text-3xl font-bold text-pp-text-primary mb-1">{{ currentTournament.nextBlinds }}</div>
                                            <div class="text-white">Next Blinds</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Fullscreen View -->
                                <div class="fullscreen-view hidden">
                                    <div class="flex h-full">
                                        <!-- Left Sidebar - Payouts -->
                                        <div class="w-1/5 max-w-md min-w-[320px] bg-pp-bg-primary/50 p-4 lg:p-6 xl:p-8 border-r border-pp-border flex-shrink-0">
                                            <h2 class="text-2xl lg:text-3xl xl:text-4xl font-bold text-pp-accent-gold mb-6 lg:mb-8 text-center">Payouts</h2>
                                            
                                            <div class="space-y-3 lg:space-y-4">
                                                <!-- Prize Pool -->
                                                <div class="bg-gradient-to-br from-pp-accent-gold/30 to-pp-accent-gold/10 rounded-xl p-4 lg:p-5 xl:p-6 border border-pp-accent-gold/40">
                                                    <div class="text-pp-accent-gold text-lg lg:text-xl xl:text-2xl mb-2">Total Prize Pool</div>
                                                    <div class="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-pp-accent-gold">{{ formatPrice(currentTournament.prizePool || currentTournament.registrations * 100) }}</div>
                                                </div>

                                                <!-- Paid Positions Overview -->
                                                <div class="bg-pp-bg-secondary/50 rounded-xl p-4 lg:p-5 xl:p-6">
                                                    <div class="text-white/60 text-lg lg:text-xl xl:text-2xl mb-3">Places Paid</div>
                                                    <div class="text-3xl lg:text-4xl xl:text-5xl font-bold text-pp-text-primary text-center mb-2">
                                                        {{ currentTournament.paidPositions || Math.ceil(currentTournament.registrations * 0.15) }}
                                                    </div>
                                                    <div class="text-lg lg:text-xl xl:text-2xl text-white/60 text-center">Min Cash: {{ formatPrice(currentTournament.minCash || 200) }}</div>
                                                </div>

                                                <!-- Top 3 Payouts -->
                                                <div class="bg-pp-bg-secondary/50 rounded-xl p-4 lg:p-5 xl:p-6">
                                                    <div class="text-white/60 text-lg lg:text-xl xl:text-2xl mb-3">Top Payouts</div>
                                                    <div class="space-y-2 lg:space-y-3">
                                                        <div class="flex justify-between items-center">
                                                            <span class="text-xl lg:text-2xl xl:text-3xl text-pp-accent-gold font-bold">1st</span>
                                                            <span class="text-xl lg:text-2xl xl:text-3xl text-white font-bold">{{ formatPrice(currentTournament.firstPlace || currentTournament.registrations * 30) }}</span>
                                                        </div>
                                                        <div class="flex justify-between items-center">
                                                            <span class="text-lg lg:text-xl xl:text-2xl text-white/70">2nd</span>
                                                            <span class="text-lg lg:text-xl xl:text-2xl text-white">{{ formatPrice(currentTournament.secondPlace || currentTournament.registrations * 20) }}</span>
                                                        </div>
                                                        <div class="flex justify-between items-center">
                                                            <span class="text-lg lg:text-xl xl:text-2xl text-white/70">3rd</span>
                                                            <span class="text-lg lg:text-xl xl:text-2xl text-white">{{ formatPrice(currentTournament.thirdPlace || currentTournament.registrations * 15) }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Main Content Area -->
                                        <div class="flex-1 flex flex-col justify-center px-6 lg:px-12 xl:px-16 2xl:px-24 min-w-0">
                                            <!-- Tournament Name -->
                                            <div class="text-center mb-4 lg:mb-6 xl:mb-8">
                                                <h1 class="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-pp-accent-gold">{{ currentTournament.name }}</h1>
                                            </div>
                                            
                                            <!-- Timer Section -->
                                            <div class="text-center mb-6 lg:mb-8 xl:mb-10">
                                                <div class="timer-display text-pp-text-primary font-bold mb-3 font-mono fullscreen-timer">
                                                    {{ clock.timeRemaining }}
                                                </div>
                                                <div class="flex items-center justify-center gap-4 lg:gap-6 xl:gap-8">
                                                    <div class="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl text-white/70 uppercase tracking-wider">Level {{ clock.currentLevel }}</div>
                                                    <div class="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl text-pp-accent-gold font-bold">{{ clock.blinds }}</div>
                                                </div>
                                            </div>
                                            
                                            <!-- Blinds Section - Stacked Vertically -->
                                            <div class="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto w-full space-y-4 lg:space-y-6">
                                                <!-- Current Level -->
                                                <div class="bg-pp-bg-primary/50 rounded-2xl p-4 lg:p-6 xl:p-8 border border-pp-accent-gold/30">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center gap-4 lg:gap-6">
                                                            <div class="text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-pp-accent-gold uppercase tracking-wider">Level {{ clock.currentLevel }}</div>
                                                            <div class="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-pp-accent-gold/70">Current Blinds</div>
                                                        </div>
                                                        <div class="flex items-center gap-4 lg:gap-6 xl:gap-8">
                                                            <div class="text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-white">
                                                                {{ clock.blinds }}
                                                            </div>
                                                            <div v-if="clockSync.ante?.value" class="text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-white/70">
                                                                Ante: {{ clockSync.ante.value }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Next Level -->
                                                <div class="bg-pp-bg-primary/30 rounded-xl p-3 lg:p-5 xl:p-6 border border-pp-border">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center gap-4 lg:gap-6">
                                                            <div class="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-white/70 uppercase tracking-wider">Level {{ clock.currentLevel + 1 }}</div>
                                                            <div class="text-base lg:text-lg xl:text-xl 2xl:text-2xl text-white/50">Next Blinds</div>
                                                        </div>
                                                        <div class="flex items-center gap-4 lg:gap-6 xl:gap-8">
                                                            <div class="text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white/70">
                                                                {{ clock.nextBlinds }}
                                                            </div>
                                                            <div v-if="clockSync.nextLevel?.value?.ante" class="text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-white/50">
                                                                Ante: {{ clockSync.nextLevel.value.ante }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Right Sidebar - Stats -->
                                        <div class="w-1/5 max-w-md min-w-[320px] bg-pp-bg-primary/50 p-4 lg:p-6 xl:p-8 border-l border-pp-border flex-shrink-0">
                                            <h2 class="text-2xl lg:text-3xl xl:text-4xl font-bold text-pp-accent-gold mb-6 lg:mb-8 text-center">Tournament Info</h2>
                                            
                                            <div class="space-y-4 lg:space-y-6">
                                                <!-- Players Remaining -->
                                                <div class="bg-pp-bg-secondary/50 rounded-xl p-4 lg:p-5 xl:p-6">
                                                    <div class="text-white/60 text-lg lg:text-xl xl:text-2xl mb-2">Players Remaining</div>
                                                    <div class="text-3xl lg:text-4xl xl:text-5xl font-bold text-pp-text-primary">
                                                        {{ currentTournament.playersRemaining || currentTournament.registrations }}/{{ currentTournament.registrations }}
                                                    </div>
                                                    <div class="text-base lg:text-lg xl:text-xl text-white/50 mt-1">
                                                        {{ currentTournament.registrations - (currentTournament.playersRemaining || currentTournament.registrations) }} eliminated
                                                    </div>
                                                </div>
                                                
                                                <!-- Chip Info -->
                                                <div class="bg-pp-bg-secondary/50 rounded-xl p-4 lg:p-5 xl:p-6">
                                                    <div class="text-white/60 text-lg lg:text-xl xl:text-2xl mb-2">Total Chips in Play</div>
                                                    <div class="text-2xl lg:text-3xl xl:text-4xl font-bold text-white">{{ formatChips(currentTournament.totalChips || currentTournament.registrations * 10000) }}</div>
                                                </div>
                                                
                                                <!-- Average Stack -->
                                                <div class="bg-pp-bg-secondary/50 rounded-xl p-4 lg:p-5 xl:p-6">
                                                    <div class="text-white/60 text-lg lg:text-xl xl:text-2xl mb-2">Average Stack</div>
                                                    <div class="text-2xl lg:text-3xl xl:text-4xl font-bold text-white">{{ formatChips(currentTournament.averageStack || 10000) }}</div>
                                                </div>
                                                
                                                <!-- Next Break -->
                                                <div class="bg-pp-accent-gold/20 rounded-xl p-4 lg:p-5 xl:p-6 border border-pp-accent-gold/30">
                                                    <div class="text-pp-accent-gold text-lg lg:text-xl xl:text-2xl mb-2">Next Break</div>
                                                    <div class="text-2xl lg:text-3xl xl:text-4xl font-bold text-white">After Level {{ (currentTournament.nextBreakLevel || 6) - 1 }}</div>
                                                    <div class="text-base lg:text-lg xl:text-xl text-white/60 mt-1">{{ currentTournament.nextBreakTime || 'In ' + ((currentTournament.nextBreakLevel || 6) - currentTournament.currentLevel) + ' levels' }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Start/Pause Button -->
                                <button 
                                    :class="[
                                        'w-full py-4 rounded-lg font-medium text-lg mb-6 flex items-center justify-center gap-2 transition-all duration-200',
                                        clock.running 
                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                            : 'bg-pp-accent-gold hover:bg-yellow-600 text-pp-bg-primary',
                                        clock.loading ? 'opacity-75 cursor-not-allowed' : ''
                                    ]"
                                    @click="clock.toggleClock"
                                    :disabled="clock.loading"
                                >
                                    <ion-icon v-if="clock.loading" :icon="refresh" class="w-5 h-5 animate-spin"></ion-icon>
                                    <ion-icon v-else :icon="clock.running ? pauseOutline : playOutline" class="w-5 h-5"></ion-icon>
                                    {{ clock.running ? 'Pause' : 'Start' }}
                                </button>

                                <!-- Control Buttons -->
                                <div class="flex flex-col items-center gap-3">
                                    <div class="flex gap-3">
                                        <button 
                                            @click="clock.previousLevel"
                                            :disabled="clock.loading"
                                            class="py-4 px-6 bg-pp-bg-primary border border-pp-border rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ion-icon :icon="playSkipBackOutline" class="w-4 h-4"></ion-icon>
                                            Previous Level
                                        </button>
                                        <button 
                                            @click="clock.advanceLevel"
                                            :disabled="clock.loading"
                                            class="py-4 px-6 bg-pp-bg-primary border border-pp-border rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ion-icon :icon="playSkipForwardOutline" class="w-4 h-4"></ion-icon>
                                            Next Level
                                        </button>
                                    </div>
                                    <div class="flex gap-3">
                                        <button class="py-4 px-6 bg-pp-bg-primary border border-pp-border rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary transition-all duration-200">
                                            <ion-icon :icon="cafeOutline" class="w-4 h-4"></ion-icon>
                                            Start Break
                                        </button>
                                        <button 
                                            class="py-4 px-6 bg-pp-bg-primary border border-pp-border rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary transition-all duration-200"
                                            @click="showAnnouncementModal"
                                        >
                                            <ion-icon :icon="megaphoneOutline" class="w-4 h-4"></ion-icon>
                                            Announce
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Blind Structure Card -->
                            <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                                <h3 class="text-xl font-semibold text-pp-text-primary mb-8">Blind Structure</h3>
                                
                                <div class="space-y-3">
                                    <div 
                                        v-for="level in blindStructure" 
                                        :key="level.level"
                                        :class="[
                                            'flex items-center justify-between py-4 px-4 rounded-lg',
                                            level.level === currentTournament.currentLevel 
                                                ? 'bg-pp-text-primary text-pp-bg-primary' 
                                                : 'bg-pp-bg-primary text-pp-text-primary'
                                        ]"
                                    >
                                        <div class="flex items-center gap-4">
                                            <div :class="[
                                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                                level.level === currentTournament.currentLevel 
                                                    ? 'bg-pp-bg-primary text-pp-text-primary' 
                                                    : 'bg-pp-bg-primary text-pp-text-primary'
                                            ]">
                                                {{ level.level }}
                                            </div>
                                            <div>
                                                <div class="font-semibold">{{ level.smallBlind }}/{{ level.bigBlind }}</div>
                                                <div v-if="level.ante > 0" :class="[
                                                    'text-sm',
                                                    level.level === currentTournament.currentLevel 
                                                        ? 'text-gray-300' 
                                                        : 'text-white'
                                                ]">
                                                    Ante: {{ level.ante }}
                                                </div>
                                            </div>
                                        </div>
                                        <div :class="[
                                            'text-sm font-medium',
                                            level.level === currentTournament.currentLevel 
                                                ? 'text-pp-bg-primary' 
                                                : 'text-white'
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
                                    <ion-icon :icon="searchOutline" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white"></ion-icon>
                                    <input 
                                        v-model="playerSearch"
                                        type="text" 
                                        placeholder="Search players..."
                                        class="pl-10 pr-4 py-2 border border-pp-border rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                                    />
                                </div>
                                
                                <!-- Filter Dropdown -->
                                <div class="relative">
                                    <ion-select 
                                        v-model="playerFilter"
                                        placeholder="All Players"
                                        interface="action-sheet"
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
                                    class="px-4 py-2 bg-pp-text-primary text-pp-bg-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-accent-gold hover:text-pp-bg-primary"
                                >
                                    <ion-icon :icon="personAddOutline" class="w-4 h-4"></ion-icon>
                                    Register Player
                                </button>
                                <button 
                                    @click="showWalkInModal"
                                    class="px-4 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary"
                                >
                                    <ion-icon :icon="personAddOutline" class="w-4 h-4"></ion-icon>
                                    Walk-in
                                </button>
                                <button class="px-4 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary">
                                    <ion-icon :icon="qrCodeOutline" class="w-4 h-4"></ion-icon>
                                    QR Check-in
                                </button>
                            </div>
                        </div>

                        <!-- Players List -->
                        <div class="bg-pp-bg-secondary rounded-2xl shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                            <div class="divide-y divide-pp-border">
                                <div 
                                    v-for="player in filteredPlayers" 
                                    :key="player.id"
                                    class="p-3 flex items-center justify-between"
                                >
                                    <!-- Player Info -->
                                    <div class="flex items-center gap-4">
                                        <!-- Avatar -->
                                        <div class="w-10 h-10 bg-pp-text-secondary rounded-full flex items-center justify-center text-white font-bold text-base">
                                            {{ getInitials(player.name) }}
                                        </div>
                                        
                                        <!-- Player Details -->
                                        <div>
                                            <h3 class="font-semibold text-white text-base">{{ player.name }}</h3>
                                            <div class="flex items-center gap-3 text-white text-sm">
                                                <span>{{ player.email }}</span>
                                                <span class="text-white text-xs">
                                                    Registered: {{ player.registrationTime }}
                                                    <span v-if="player.tableNumber"> • Table {{ player.tableNumber }}, Seat {{ player.seatNumber }}</span>
                                                </span>
                                            </div>
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
                                                class="px-3 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary"
                                            >
                                                <ion-icon :icon="checkmarkCircleOutline" class="w-4 h-4"></ion-icon>
                                                Check In
                                            </button>
                                            
                                            <!-- Undo and Seat Buttons -->
                                            <template v-else-if="player.status === 'checked-in'">
                                                <button class="px-3 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary">
                                                    <ion-icon :icon="refreshOutline" class="w-4 h-4"></ion-icon>
                                                    Undo
                                                </button>
                                                <button class="px-3 py-2 bg-pp-text-primary text-pp-bg-primary rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-pp-accent-gold hover:text-pp-bg-primary">
                                                    <ion-icon :icon="locationOutline" class="w-4 h-4"></ion-icon>
                                                    Seat
                                                </button>
                                            </template>

                                            <!-- More Actions Button -->
                                            <button class="p-2 text-white hover:text-white hover:bg-pp-border rounded-lg">
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
                                <h2 class="text-2xl font-bold text-pp-text-primary">Table Management</h2>
                                <span class="px-3 py-1 bg-pp-border text-pp-text-primary rounded-full text-sm font-medium">{{ tables.length }} Active Tables</span>
                            </div>
                            
                            <div class="flex items-center gap-3">
                                <button class="px-4 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary">
                                    <ion-icon :icon="shuffleOutline" class="w-4 h-4"></ion-icon>
                                    Auto Seat Next
                                </button>
                                <button class="px-4 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary">
                                    <ion-icon :icon="scaleOutline" class="w-4 h-4"></ion-icon>
                                    Balance Tables
                                </button>
                                <button class="px-4 py-2 border border-pp-text-primary text-pp-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-pp-text-primary hover:text-pp-bg-primary">
                                    <ion-icon :icon="removeCircleOutline" class="w-4 h-4"></ion-icon>
                                    Break Table
                                </button>
                            </div>
                        </div>

                        <!-- Tables Grid -->
                        <div class="grid grid-cols-2 gap-8">
                            <div v-for="table in tables" :key="table.id" class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                                <!-- Table Header -->
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-xl font-bold text-pp-text-primary">Table {{ table.number }}</h3>
                                    <span class="px-3 py-1 bg-pp-accent-gold/20 text-pp-accent-gold rounded-full text-sm font-medium">{{ table.status }}</span>
                                </div>
                                
                                <div class="text-white text-sm mb-8">{{ getOccupiedSeats(table) }}/{{ table.maxSeats }} seats occupied</div>

                                <!-- Poker Table Layout -->
                                <div class="relative mx-auto" style="width: 400px; height: 240px;">
                                    <!-- Table Surface -->
                                    <div class="absolute inset-0 bg-pp-border rounded-full border-4 border-pp-border"></div>
                                    
                                    <!-- Table Center Label -->
                                    <div class="absolute inset-0 flex items-center justify-center">
                                        <div class="text-center">
                                            <div class="text-2xl font-bold text-pp-text-primary">T{{ table.number }}</div>
                                            <div class="text-sm text-white">{{ getOccupiedSeats(table) }}/{{ table.maxSeats }}</div>
                                        </div>
                                    </div>

                                    <!-- Player Seats - Better Circular Positioning -->
                                    <div 
                                        v-for="(player, seatIndex) in table.seats" 
                                        :key="seatIndex"
                                        :class="[
                                            'absolute w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold cursor-pointer transition-all',
                                            player 
                                                ? 'bg-pp-text-primary border-gray-900 text-white' 
                                                : 'bg-pp-bg-primary border-pp-border text-white hover:border-pp-accent-gold'
                                        ]"
                                        :style="getSeatPosition(seatIndex, table.maxSeats)"
                                        :title="player ? player.name : `Seat ${seatIndex + 1} - Empty`"
                                    >
                                        {{ player ? getInitials(player.name) : seatIndex + 1 }}
                                    </div>
                                </div>

                                <!-- Seated Players List -->
                                <div class="mt-8">
                                    <h4 class="font-semibold text-pp-text-primary mb-4">Seated Players:</h4>
                                    <div v-if="getSeatedPlayers(table).length === 0" class="text-white text-sm">
                                        No players seated
                                    </div>
                                    <div v-else class="space-y-2">
                                        <div 
                                            v-for="(seatedPlayer, index) in getSeatedPlayers(table)" 
                                            :key="index"
                                            class="flex items-center justify-between text-sm py-2"
                                        >
                                            <span class="text-pp-text-primary">
                                                Seat {{ seatedPlayer.seatNumber }}: {{ seatedPlayer.player.name }}
                                            </span>
                                            <button class="p-1 text-white hover:text-white hover:bg-pp-border rounded">
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
                        <div class="bg-pp-bg-secondary rounded-2xl p-8 shadow-sm border border-pp-border" style="background-color: #24242a !important;">
                            <div class="flex items-center gap-3 mb-6">
                                <ion-icon :icon="settingsOutline" class="w-6 h-6 text-pp-text-primary"></ion-icon>
                                <h3 class="text-xl font-semibold text-pp-text-primary">Tournament Settings</h3>
                            </div>
                            <p class="text-white">Tournament configuration and advanced settings will be available here.</p>
                        </div>
                    </div>
                </ion-tab>
            </ion-tabs>
        </ion-content>

        <!-- Custom Announcement Modal -->
        <teleport to="body">
            <div 
                v-if="announcementModalOpen" 
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
                @click.self="announcementModalOpen = false"
            >
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                
                <!-- Modal Content -->
                <div class="relative bg-pp-bg-secondary rounded-3xl border border-pp-border max-w-lg w-full mx-auto shadow-2xl">
                    
                    <!-- Header -->
                    <div class="flex items-center justify-between p-8 pb-6 border-b border-pp-border">
                        <div>
                            <h2 class="text-2xl font-bold text-pp-text-primary">Broadcast Announcement</h2>
                            <p class="text-white/70 text-sm mt-1">Send a message to all players</p>
                        </div>
                        <button 
                            @click="announcementModalOpen = false"
                            class="w-10 h-10 rounded-full bg-pp-border/20 hover:bg-pp-border/40 flex items-center justify-center transition-colors group"
                        >
                            <ion-icon :icon="closeOutline" class="w-5 h-5 text-white group-hover:text-pp-text-primary"></ion-icon>
                        </button>
                    </div>

                    <!-- Form content -->
                    <div class="p-8 space-y-6">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white">Message</label>
                            <textarea 
                                v-model="announcementMessage"
                                placeholder="Enter your announcement..."
                                rows="4"
                                class="w-full px-4 py-3 bg-pp-bg-primary border border-pp-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pp-accent-gold/50 focus:border-pp-accent-gold transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="p-8 pt-6 border-t border-pp-border space-y-3">
                        <button 
                            class="w-full px-6 py-3 bg-pp-text-primary text-pp-bg-primary rounded-xl font-medium hover:bg-pp-accent-gold/90 transition-colors flex items-center justify-center gap-2"
                            :disabled="!announcementMessage.trim()"
                        >
                            <ion-icon :icon="megaphoneOutline" class="w-4 h-4"></ion-icon>
                            Send to All Players
                        </button>
                        <button 
                            class="w-full px-6 py-3 border border-pp-border text-white rounded-xl font-medium hover:bg-pp-border/10 transition-colors"
                            :disabled="!announcementMessage.trim()"
                        >
                            Send to Tables Only
                        </button>
                    </div>

                </div>
            </div>
        </teleport>

        <!-- Custom Register Player Modal -->
        <teleport to="body">
            <div 
                v-if="registerModalOpen" 
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
                @click.self="registerModalOpen = false"
            >
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                
                <!-- Modal Content -->
                <div class="relative bg-pp-bg-secondary rounded-3xl border border-pp-border max-w-md w-full mx-auto shadow-2xl">
                    
                    <!-- Header -->
                    <div class="flex items-center justify-between p-8 pb-6 border-b border-pp-border">
                        <div>
                            <h2 class="text-2xl font-bold text-pp-text-primary">Register Existing Player</h2>
                            <p class="text-white/70 text-sm mt-1">Search and register a player from the database</p>
                        </div>
                        <button 
                            @click="registerModalOpen = false"
                            class="w-10 h-10 rounded-full bg-pp-border/20 hover:bg-pp-border/40 flex items-center justify-center transition-colors group"
                        >
                            <ion-icon :icon="closeOutline" class="w-5 h-5 text-white group-hover:text-pp-text-primary"></ion-icon>
                        </button>
                    </div>

                    <!-- Form content -->
                    <div class="p-8 space-y-6">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white">Search Player</label>
                            <div class="relative">
                                <ion-icon :icon="searchOutline" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50"></ion-icon>
                                <input 
                                    v-model="playerSearchQuery"
                                    type="text"
                                    placeholder="Enter name or email..."
                                    class="w-full pl-10 pr-4 py-3 bg-pp-bg-primary border border-pp-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pp-accent-gold/50 focus:border-pp-accent-gold transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Footer Actions -->
                    <div class="p-8 pt-6 border-t border-pp-border flex gap-3">
                        <button 
                            @click="registerModalOpen = false"
                            class="flex-1 px-6 py-3 border border-pp-border text-white rounded-xl font-medium hover:bg-pp-border/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            class="flex-1 px-6 py-3 bg-pp-bg-primary border border-pp-accent-gold text-pp-accent-gold rounded-xl font-medium hover:bg-pp-accent-gold hover:text-pp-bg-primary transition-colors flex items-center justify-center gap-2"
                            :disabled="!playerSearchQuery.trim()"
                        >
                            <ion-icon :icon="personAddOutline" class="w-4 h-4"></ion-icon>
                            Register Player
                        </button>
                    </div>

                </div>
            </div>
        </teleport>

        <!-- Custom Walk-in Modal -->
        <teleport to="body">
            <div 
                v-if="walkInModalOpen" 
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
                @click.self="walkInModalOpen = false"
            >
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                
                <!-- Modal Content -->
                <div class="relative bg-pp-bg-secondary rounded-3xl border border-pp-border max-w-md w-full mx-auto shadow-2xl transform transition-all">
                    
                    <!-- Header with close button -->
                    <div class="flex items-center justify-between p-8 pb-6 border-b border-pp-border">
                        <div>
                            <h2 class="text-2xl font-bold text-pp-text-primary">Walk-in Registration</h2>
                            <p class="text-white/70 text-sm mt-1">Register a new player on-site</p>
                        </div>
                        <button 
                            @click="walkInModalOpen = false"
                            class="w-10 h-10 rounded-full bg-pp-border/20 hover:bg-pp-border/40 flex items-center justify-center transition-colors group"
                        >
                            <ion-icon :icon="closeOutline" class="w-5 h-5 text-white group-hover:text-pp-text-primary"></ion-icon>
                        </button>
                    </div>

                    <!-- Form content -->
                    <div class="p-8 space-y-6">
                        
                        <!-- Full Name Field -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white">Full Name</label>
                            <input 
                                v-model="walkInForm.fullName"
                                type="text"
                                placeholder="Enter player's full name"
                                class="w-full px-4 py-3 bg-pp-bg-primary border border-pp-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pp-accent-gold/50 focus:border-pp-accent-gold transition-all"
                            />
                        </div>

                        <!-- Email Field -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white">Email Address</label>
                            <input 
                                v-model="walkInForm.email"
                                type="email"
                                placeholder="player@example.com"
                                class="w-full px-4 py-3 bg-pp-bg-primary border border-pp-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pp-accent-gold/50 focus:border-pp-accent-gold transition-all"
                            />
                        </div>

                        <!-- Phone Field -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white">Phone Number</label>
                            <input 
                                v-model="walkInForm.phone"
                                type="tel"
                                placeholder="+32 xxx xxx xxx"
                                class="w-full px-4 py-3 bg-pp-bg-primary border border-pp-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pp-accent-gold/50 focus:border-pp-accent-gold transition-all"
                            />
                        </div>

                        <!-- Optional Notes -->
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-white">Notes <span class="text-white/50">(Optional)</span></label>
                            <textarea 
                                v-model="walkInForm.notes"
                                placeholder="Any additional notes..."
                                rows="2"
                                class="w-full px-4 py-3 bg-pp-bg-primary border border-pp-border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pp-accent-gold/50 focus:border-pp-accent-gold transition-all resize-none"
                            ></textarea>
                        </div>

                    </div>

                    <!-- Footer Actions -->
                    <div class="p-8 pt-6 border-t border-pp-border flex gap-3">
                        <button 
                            @click="closeWalkInModal"
                            class="flex-1 px-6 py-3 border border-pp-border text-white rounded-xl font-medium hover:bg-pp-border/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            @click="submitWalkInRegistration"
                            :disabled="!walkInForm.fullName || !walkInForm.email"
                            class="flex-1 px-6 py-3 bg-pp-bg-primary border border-pp-accent-gold text-pp-accent-gold rounded-xl font-medium hover:bg-pp-accent-gold hover:text-pp-bg-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ion-icon :icon="personAddOutline" class="w-4 h-4"></ion-icon>
                            Register Player
                        </button>
                    </div>

                </div>
            </div>
        </teleport>
    </ion-page>
</template>

<script setup lang="ts">
// Protect this page with authentication
definePageMeta({
  middleware: 'auth'
})

import { settingsOutline, megaphoneOutline, personAddOutline, trophyOutline, peopleOutline, timeOutline, playOutline, pauseOutline, playSkipBackOutline, playSkipForwardOutline, cafeOutline, searchOutline, qrCodeOutline, checkmarkCircleOutline, refreshOutline, locationOutline, ellipsisVerticalOutline, shuffleOutline, scaleOutline, removeCircleOutline, moveOutline, closeOutline, expandOutline, contractOutline, refresh } from 'ionicons/icons'
import { useTournamentData } from '@/composables/useTournamentData'
import { useTournamentClock, useTournamentClockSync } from '@/composables/useTournamentClock'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const route = useRoute()
const { connectionStatus, isOnline } = useNetworkStatus()
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

// Modal form states
const walkInForm = ref({
    fullName: '',
    email: '',
    phone: '',
    notes: ''
})

const announcementMessage = ref('')
const playerSearchQuery = ref('')

const showAnnouncementModal = () => {
    announcementModalOpen.value = true
}

const showRegisterModal = () => {
    registerModalOpen.value = true
}

const showWalkInModal = () => {
    walkInModalOpen.value = true
}

const closeWalkInModal = () => {
    walkInModalOpen.value = false
    // Reset form
    walkInForm.value = {
        fullName: '',
        email: '',
        phone: '',
        notes: ''
    }
}

const submitWalkInRegistration = () => {
    // TODO: Implement registration logic
    console.log('Registering walk-in player:', walkInForm.value)
    closeWalkInModal()
}

const { tournaments, players, tables, blindStructure, recentActivity } = useTournamentData()

const selectedTournament = ref<string>((route.params.id as string) || tournaments.value[0].id)

const currentTournament = computed(() => tournaments.value.find(t => t.id === selectedTournament.value)!)

// Tournament ID from route params or default test ID
const tournamentId = computed(() => route.params.id as string || '10004444-4444-4444-4444-444444444444')

// Use synchronized clock with GraphQL subscription
const clockSync = useTournamentClockSync(tournamentId.value)

// Fallback to local clock for demo mode
const localClock = useTournamentClock(currentTournament.value.timeRemaining || '15:00')

// Choose between sync and local clock based on connection
const clock = computed(() => {
    if (clockSync.connected) {
        return {
            timeRemaining: clockSync.timeRemaining.value,
            running: clockSync.running.value,
            // Use real GraphQL mutations when connected
            start: clockSync.toggleClock,
            pause: clockSync.toggleClock,
            currentLevel: clockSync.currentLevel.value,
            blinds: clockSync.blindsText.value,
            nextBlinds: clockSync.nextBlindsText.value,
            status: clockSync.status.value,
            isBreak: clockSync.isBreak.value,
            error: clockSync.error.value,
            connected: clockSync.connected.value,
            // Clock control functions
            startClock: clockSync.startClock,
            pauseClock: clockSync.pauseClock,
            resumeClock: clockSync.resumeClock,
            toggleClock: clockSync.toggleClock,
            advanceLevel: clockSync.advanceLevel,
            previousLevel: clockSync.previousLevel,
            // Loading states
            loading: clockSync.startLoading.value || clockSync.pauseLoading.value || clockSync.resumeLoading.value
        }
    } else {
        // Fallback to local clock
        return {
            timeRemaining: localClock.timeRemaining.value,
            running: localClock.running.value,
            start: localClock.start,
            pause: localClock.pause,
            currentLevel: currentTournament.value.currentLevel,
            blinds: currentTournament.value.blinds,
            nextBlinds: currentTournament.value.nextBlinds,
            status: 'local',
            isBreak: false,
            error: null,
            connected: false,
            // Local functions (for demo mode)
            startClock: localClock.start,
            pauseClock: localClock.pause,
            resumeClock: localClock.start,
            toggleClock: () => localClock.running.value ? localClock.pause() : localClock.start(),
            advanceLevel: () => console.log('Local mode: advance level'),
            previousLevel: () => console.log('Local mode: previous level'),
            loading: false
        }
    }
})

const formatChips = (chips: number) => {
    if (chips >= 1000000) {
        return `${(chips / 1000000).toFixed(1)}M`
    } else if (chips >= 1000) {
        return `${(chips / 1000).toFixed(0)}K`
    }
    return chips.toString()
}

const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-BE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

const toggleFullscreen = () => {
    const clockCard = document.querySelector('.tournament-clock-card')
    if (!clockCard) return
    
    if (!document.fullscreenElement) {
        clockCard.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err)
        })
    } else {
        document.exitFullscreen()
    }
}

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
            return 'bg-pp-accent-gold/20 text-pp-accent-gold'
        case 'checked-in':
            return 'bg-blue-500/20 text-blue-400'
        case 'registered':
            return 'bg-yellow-500/20 text-yellow-400'
        case 'eliminated':
            return 'bg-red-500/20 text-red-400'
        default:
            return 'bg-pp-border text-pp-text-primary'
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

// Update last update timestamp when connection status changes
watch(connectionStatus, () => {
    lastUpdate.value = Date.now()
})

// Update timestamp periodically when connected
const updateTimer = setInterval(() => {
    if (connectionStatus.value === 'connected') {
        lastUpdate.value = Date.now()
    }
}, 30000) // Update every 30 seconds when connected

onBeforeUnmount(() => clearInterval(updateTimer))
</script>

<style>
/* Custom tab styling to match the design */
.tab-button-custom {
  --background: transparent;
  --background-selected: #24242a;
  --color: #94a3b8;
  --color-selected: #fee78a;
  --border-radius: 12px;
  --padding-start: 32px;
  --padding-end: 32px;
  --margin: 4px;
  --box-shadow: none;
  --box-shadow-selected: 0 2px 8px 0 rgb(254 231 138 / 0.2);
  margin: 0 2px;
  border: 1px solid #54545f; /* Subtle border for visibility */
  transition: all 0.2s ease;
}

.tab-button-custom:hover:not([aria-selected="true"]) {
  --background: rgba(94, 164, 184, 0.1);
  --color: #ffffff;
  border: 1px solid #94a3b8;
  transform: translateY(-1px);
}

.tab-button-custom[aria-selected="true"] {
  --background: #24242a;
  border: 1px solid rgba(254, 231, 138, 0.6);
  box-shadow: 0 2px 8px 0 rgb(254 231 138 / 0.2);
}

/* Fullscreen styles for tournament clock */
.tournament-clock-card:fullscreen {
    display: flex;
    flex-direction: column;
    background-color: #1a1a1f !important;
    padding: 0;
    width: 100vw;
    height: 100vh;
}

/* Hide normal view in fullscreen */
.tournament-clock-card:fullscreen .normal-view {
    display: none;
}

.tournament-clock-card:fullscreen .fullscreen-header {
    display: none;
}

/* Show fullscreen view only in fullscreen */
.tournament-clock-card:fullscreen .fullscreen-view {
    display: block !important;
    height: 100vh;
}

/* Position fullscreen toggle button */
.tournament-clock-card:fullscreen .fullscreen-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    background: rgba(36, 36, 42, 0.9);
    backdrop-filter: blur(10px);
    display: block !important;
}

/* Hide all other buttons in fullscreen */
.tournament-clock-card:fullscreen button:not(.fullscreen-toggle) {
    display: none;
}

/* Responsive timer scaling */
.fullscreen-timer {
    font-size: clamp(8rem, 18vw, 20rem);
    line-height: 1;
}

/* Extra large screens (4K+) */
@media (min-width: 2560px) {
    .fullscreen-timer {
        font-size: clamp(16rem, 20vw, 24rem);
    }
}

/* Make sure tab labels are visible */
.tab-button-custom ion-label {
  font-weight: 500;
  font-size: 16px;
  opacity: 1 !important;
}

/* Grid-based tab styling */
.tab-button-custom-grid {
  --background: transparent;
  --background-selected: #24242a;
  --color: #ffffff;
  --color-selected: #fee78a;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --margin: 0;
  --box-shadow: none;
  --box-shadow-selected: 0 2px 8px 0 rgb(254 231 138 / 0.15);
  border: 1px solid transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
  flex: 1;
}

.tab-button-custom-grid:hover:not([aria-selected="true"]) {
  --background: rgba(148, 163, 184, 0.1);
  --color: #ffffff;
  border: 1px solid #94a3b8;
}

.tab-button-custom-grid[aria-selected="true"] {
  --background: #24242a;
  --color: #fee78a;
  border: 1px solid rgba(254, 231, 138, 0.4);
  box-shadow: 0 2px 8px 0 rgb(254 231 138 / 0.15);
}

.tab-button-custom-grid ion-label {
  font-weight: 500;
  font-size: 14px;
  opacity: 1 !important;
  margin: 0;
}


/* Remove default ionic tab bar styling */
ion-tab-bar {
  border: none !important;
}

/* Custom Modal Animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>