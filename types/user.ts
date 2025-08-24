export interface User {
    id: string
    email: string
    username: string
    firstName: string
    lastName: string
    phone: string
    isActive: boolean
    role: string
    createdAt: string
    updatedAt: string
    displayPreference: 'real_name' | 'username' | 'both'
    displayName?: string
}

export interface TournamentPlayer {
    registration: {
        id: string
        status: string
        registrationTime: string
        notes?: string
    }
    user: {
        id: string
        firstName: string
        lastName: string
        username: string
        email: string
        isActive: boolean
    }
}

export interface Club {
    id: string;
    name: string;
    city?: string | null;
}