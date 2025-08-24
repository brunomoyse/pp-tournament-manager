export interface ClubTable {
    id: string,
    club_id: string,
    table_number: number,
    max_seats: number,
    is_active: boolean,
    is_assigned: boolean,
}

export enum AssignmentStrategy {
    /** Balanced distribution - fills tables evenly */
    BALANCED = 'BALANCED',
    /** Manual - no auto-assignment */
    MANUAL = 'MANUAL',
    /** Random assignment for fairness */
    RANDOM = 'RANDOM',
    /** Sequential - fills tables in order */
    SEQUENTIAL = 'SEQUENTIAL'
}
