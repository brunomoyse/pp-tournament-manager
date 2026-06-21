import { test, expect, type APIRequestContext } from '@playwright/test'

// API-level checks for the free ("Home Game") tier, run directly against the
// pp-service GraphQL endpoint - no manager login required. Each run creates its
// own free club (unique email) so the tests are self-contained.

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

test.describe('Freemium tiering - free (Home Game) tier', () => {
  let token = ''
  let clubId = ''

  test('free onboarding skips VAT and creates a FREE club', async ({ request }) => {
    const email = `pw-free-${Date.now()}@example.test`
    const data = await gql(
      request,
      'mutation($i:OnboardClubInput!){onboardClub(input:$i){token club{id plan}}}',
      {
        i: {
          firstName: 'PW',
          lastName: 'Free',
          email,
          password: 'Str0ngPass1',
          clubName: 'PW Home Game',
          country: 'BE',
          plan: 'FREE',
        },
      },
    )
    expect(data.errors).toBeUndefined()
    token = data.data.onboardClub.token
    clubId = data.data.onboardClub.club.id
    expect(data.data.onboardClub.club.plan).toBe('FREE')
    expect(token).toBeTruthy()
  })

  test('free club is hidden from the public clubs directory', async ({ request }) => {
    const data = await gql(request, '{ clubs { id } }')
    const ids: string[] = data.data.clubs.map((c: { id: string }) => c.id)
    expect(ids).not.toContain(clubId)
  })

  test('limited to a single table', async ({ request }) => {
    const mk = (tableNumber: number) =>
      gql(
        request,
        'mutation($i:CreateClubTableInput!){createClubTable(input:$i){id}}',
        { i: { clubId, tableNumber, maxSeats: 9, isDefault: true } },
        token,
      )
    expect((await mk(1)).errors).toBeUndefined()
    const second = await mk(2)
    expect(second.errors?.[0]?.message).toContain('1 table')
  })

  test('one active tournament at a time; recurring rejected', async ({ request }) => {
    const mk = (name: string, extra: Record<string, unknown> = {}) =>
      gql(
        request,
        'mutation($i:CreateTournamentInput!){createTournament(input:$i){id}}',
        { i: { clubId, name, startTime: '2026-07-01T18:00:00Z', buyInCents: 2000, ...extra } },
        token,
      )

    const recurring = await mk('Weekly', {
      recurrenceFrequency: 'WEEKLY',
      recurrenceEndDate: '2026-09-01T18:00:00Z',
    })
    expect(recurring.errors?.[0]?.message).toContain('Recurring')

    expect((await mk('First')).errors).toBeUndefined()

    const second = await mk('Second')
    expect(second.errors?.[0]?.message).toContain('1 active tournament')
  })

  test('tournaments are hidden from players but visible to the club manager', async ({
    request,
  }) => {
    const query = 'query($c:UUID){ tournaments(clubId:$c){ totalCount } }'
    const publicView = await gql(request, query, { c: clubId })
    expect(publicView.data.tournaments.totalCount).toBe(0)

    const managerView = await gql(request, query, { c: clubId }, token)
    expect(managerView.data.tournaments.totalCount).toBeGreaterThanOrEqual(1)
  })

  test('free club cannot broadcast announcements to players', async ({ request }) => {
    const data = await gql(
      request,
      'mutation($i:CreateAnnouncementInput!){createAnnouncement(input:$i){id}}',
      { i: { scope: 'CLUB', clubId, title: 'Hi', body: 'Test' } },
      token,
    )
    expect(data.errors?.[0]?.message).toContain('Club plan')
  })
})
