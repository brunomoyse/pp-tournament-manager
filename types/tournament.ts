export interface Tournament {
    id: string
    name: string
    status: 'upcoming' | 'running' | 'paused' | 'finished'
    registrations: number
    checkedIn: number
    maxPlayers: number
    currentLevel: number
    totalLevels: number
    timeRemaining: string
    blinds: string
    nextBlinds: string
    prizePool: string
}

export interface Player {
    id: string
    name: string
    email: string
    phone: string
    status: 'registered' | 'checked-in' | 'seated' | 'eliminated'
    tableNumber?: number
    seatNumber?: number
    registrationTime: string
}

export interface TableModel {
    id: string
    number: number
    seats: (Player | null)[]
    maxSeats: number
    status: 'active' | 'breaking' | 'broken'
}

export interface ActivityItem {
    time: string
    action: string
    details: string
    type: 'checkin' | 'level' | 'registration' | 'seating' | 'other'
}

export interface BlindLevel {
    level: number
    smallBlind: number
    bigBlind: number
    ante: number
    duration: string
}