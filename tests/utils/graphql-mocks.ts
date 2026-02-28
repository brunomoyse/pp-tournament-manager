import { vi } from 'vitest'
import { Role, TournamentStatus, TournamentLiveStatus } from '#gql/default'

export const createMockTournament = (overrides = {}) => ({
  id: '1',
  title: 'Test Tournament',
  description: 'Test Description',
  clubId: 'club-1',
  startTime: '2026-02-15T18:00:00Z',
  buyInCents: 5000,
  status: TournamentStatus.UPCOMING,
  liveStatus: TournamentLiveStatus.NOT_STARTED,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  role: Role.PLAYER,
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
    tournaments: {
      totalCount: 1,
      pageSize: 20,
      offset: 0,
      hasNextPage: false,
      items: [createMockTournament()],
    },
  })

  vi.mocked(GqlGetTournament).mockResolvedValue({
    tournament: {
      ...createMockTournament(),
      structure: [],
      registrations: [],
    },
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
