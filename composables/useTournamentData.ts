import type { Tournament, Player, TableModel, BlindLevel, ActivityItem } from '~/types/tournament'

export function useTournamentData() {
  const tournaments = ref<Tournament[]>([
    {
      id: '1',
      name: 'Weekly Tournament',
      status: 'running',
      currentLevel: 3,
      totalLevels: 20,
      timeRemaining: '12:34',
      blinds: '150/300',
      nextBlinds: '200/400',
      registrations: 45,
      checkedIn: 42,
      maxPlayers: 100,
      prizePool: '€2,025'
    }
  ])

  const players = ref<Player[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'seated',
      registrationTime: '18:30',
      tableNumber: 1,
      seatNumber: 3
    },
    {
      id: '2', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'checked-in',
      registrationTime: '18:45'
    }
  ])

  const tables = ref<TableModel[]>([
    {
      id: '1',
      number: 1,
      status: 'active',
      maxSeats: 8,
      seats: [
        null,
        { id: '1', name: 'John Doe' },
        null,
        { id: '2', name: 'Jane Smith' },
        null,
        null,
        null,
        null
      ]
    }
  ])

  const blindStructure = ref<BlindLevel[]>([
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: '15:00' },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: '15:00' },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: '15:00' },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: '15:00' }
  ])

  const recentActivity = ref<ActivityItem[]>([
    {
      type: 'checkin',
      action: 'Player checked in',
      details: 'John Doe checked in at table 1',
      time: '2 min ago'
    },
    {
      type: 'seating',
      action: 'Player seated',
      details: 'Jane Smith seated at table 1, seat 4',
      time: '5 min ago'
    }
  ])

  const timeRemaining = ref('12:34')

  return {
    tournaments,
    players,
    tables,
    blindStructure,
    recentActivity,
    timeRemaining
  }
}