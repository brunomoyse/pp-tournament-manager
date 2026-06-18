import { test, expect, type APIRequestContext } from '@playwright/test'

// Deeper player-app exclusion checks: a free club's tournament is unreachable
// and unjoinable for players, but stays visible to its own manager; the upgrade
// entry point is admin-only; and — as a positive control — paid clubs remain
// publicly listed while free ones never are.

const GQL = process.env.PP_GRAPHQL ?? 'http://localhost:8080/graphql'

async function gql(
  request: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
  token?: string,
) {
  const res = await request.post(GQL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: { query, variables },
  })
  expect(res.ok(), `HTTP ${res.status()} from GraphQL`).toBeTruthy()
  return res.json()
}

test.describe.configure({ mode: 'serial' })

test.describe('Player-app exclusion of free (Home Game) clubs', () => {
  const stamp = Date.now()
  let managerToken = ''
  let playerToken = ''
  let clubId = ''
  let tournamentId = ''

  test('setup: a free club with a tournament, plus an unrelated player', async ({ request }) => {
    const onboard = await gql(
      request,
      'mutation($i:OnboardClubInput!){onboardClub(input:$i){token club{id}}}',
      {
        i: {
          firstName: 'Mgr',
          lastName: 'Host',
          email: `pw-mgr-${stamp}@example.test`,
          password: 'Str0ngPass1',
          clubName: 'Exclusion Home Game',
          country: 'BE',
          plan: 'FREE',
        },
      },
    )
    managerToken = onboard.data.onboardClub.token
    clubId = onboard.data.onboardClub.club.id

    const tourn = await gql(
      request,
      'mutation($i:CreateTournamentInput!){createTournament(input:$i){id}}',
      { i: { clubId, name: 'Home Game', startTime: '2026-07-01T18:00:00Z', buyInCents: 2000 } },
      managerToken,
    )
    tournamentId = tourn.data.createTournament.id
    expect(tournamentId).toBeTruthy()

    await gql(request, 'mutation($i:UserRegistrationInput!){registerUser(input:$i){id}}', {
      i: {
        email: `pw-plyr-${stamp}@example.test`,
        username: `pwplyr${stamp}`,
        password: 'Str0ngPass1',
        firstName: 'Ply',
        lastName: 'Er',
      },
    })
    const login = await gql(request, 'mutation($i:UserLoginInput!){loginUser(input:$i){token}}', {
      i: { email: `pw-plyr-${stamp}@example.test`, password: 'Str0ngPass1' },
    })
    playerToken = login.data.loginUser.token
    expect(playerToken).toBeTruthy()
  })

  test('a player cannot self-register into a free club tournament', async ({ request }) => {
    const data = await gql(
      request,
      'mutation($i:RegisterForTournamentInput!){registerForTournament(input:$i){id}}',
      { i: { tournamentId } },
      playerToken,
    )
    expect(data.errors?.[0]?.message).toContain("isn't available")
  })

  test('tournament(id) is null for outsiders but resolves for the manager', async ({ request }) => {
    const outsider = await gql(
      request,
      'query($t:UUID!){ tournament(id:$t){ id } }',
      { t: tournamentId },
      playerToken,
    )
    expect(outsider.data.tournament).toBeNull()

    const manager = await gql(
      request,
      'query($t:UUID!){ tournament(id:$t){ id } }',
      { t: tournamentId },
      managerToken,
    )
    expect(manager.data.tournament?.id).toBe(tournamentId)
  })

  test('upgrading a club is admin-only (a manager cannot self-upgrade)', async ({ request }) => {
    const data = await gql(
      request,
      'mutation($id:ID!){ setClubPlan(clubId:$id, plan:CLUB){ plan } }',
      { id: clubId },
      managerToken,
    )
    expect(data.data?.setClubPlan ?? null).toBeNull()
    expect(data.errors?.[0]?.message).toMatch(/permission|denied/i)
  })

  test('positive control: paid clubs are publicly listed, free clubs are not', async ({
    request,
  }) => {
    const data = await gql(request, '{ clubs { id plan } }')
    const plans: string[] = data.data.clubs.map((c: { plan: string }) => c.plan)
    expect(plans.length).toBeGreaterThan(0)
    expect(plans).toContain('CLUB')
    expect(plans).not.toContain('FREE')
  })
})
