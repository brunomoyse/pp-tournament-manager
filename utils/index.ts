import type {TournamentStructure} from "~/types/tournament";

export const formatTime = (seconds: number|null|undefined): string => {
    if (seconds === undefined || seconds === null || seconds < 0) return '00:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const formatBlinds = (structure: TournamentStructure | undefined): string => {
    if (!structure) return '0/0'
    return `${structure.smallBlind}/${structure.bigBlind}`
}

export const formatPrice = (cents: number|null|undefined): string => {
    if (cents) {
        const euros = cents / 100
        return new Intl.NumberFormat('fr-BE', {
            style: 'currency',
            currency: 'EUR'
        }).format(euros)
    }
    return '0,00€'
}