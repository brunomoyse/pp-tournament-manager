import { vi } from 'vitest'

export const createMockTournament = (overrides = {}) => ({
  id: '1',
  title: 'Test Tournament',
  description: 'Test Description',
  status: 'NOT_STARTED',
  startDate: '2026-02-15T18:00:00Z',
  buyIn: 5000,
  rebuyAmount: 5000,
  addonAmount: 5000,
  maxPlayers: 100,
  minPlayers: 10,
  currentPlayers: 0,
  prizePool: 0,
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  role: 'PLAYER',
  isActive: true,
  ...overrides,
})

export const createMockClub = (overrides = {}) => ({
  id: '1',
  name: 'Test Club',
  city: 'Test City',
  ...overrides,
})

export const createMockRegistration = (overrides = {}) => ({
  id: '1',
  userId: '1',
  tournamentId: '1',
  status: 'REGISTERED',
  createdAt: new Date().toISOString(),
  ...overrides,
})

export const createMockClock = (overrides = {}) => ({
  id: '1',
  tournamentId: '1',
  status: 'NOT_STARTED',
  currentLevel: 1,
  timeRemaining: 1200,
  blinds: {
    small: 50,
    big: 100,
    ante: 0,
  },
  ...overrides,
})

export const mockGraphQLQueries = () => {
  vi.mocked(GqlGetTournaments).mockResolvedValue({
    tournaments: [createMockTournament()],
  })

  vi.mocked(GqlGetTournament).mockResolvedValue({
    tournament: createMockTournament(),
  })

  vi.mocked(GqlGetMe).mockResolvedValue({
    me: createMockUser(),
  })

  vi.mocked(GqlLoginUser).mockResolvedValue({
    loginUser: {
      token: 'test-token',
      user: createMockUser(),
    },
  })
}

export const clearGraphQLMocks = () => {
  vi.mocked(GqlGetTournaments).mockClear()
  vi.mocked(GqlGetTournament).mockClear()
  vi.mocked(GqlGetMe).mockClear()
  vi.mocked(GqlLoginUser).mockClear()
}
