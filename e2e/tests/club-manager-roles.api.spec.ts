import { test, expect, type APIRequestContext } from '@playwright/test'

// The owner/manager split, driven end to end against a real backend.
//
// This runs over the API rather than the UI because an invited co-manager has
// no password until they follow an emailed set-password link, so there is no
// way to log in as one from a browser. Onboarding two clubs sidesteps that:
// owner B already has a password, so when owner A invites B's email, B becomes
// a plain manager of club A and can act with their own token.

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

const ONBOARD = 'mutation($i:OnboardClubInput!){onboardClub(input:$i){token club{id}}}'
const TEAM = 'query($c:ID!){clubManagers(clubId:$c){id userId email role}}'
const INVITE =
  'mutation($i:InviteClubManagerInput!){inviteClubManager(input:$i){createdAccount emailSent}}'
const SET_ROLE = 'mutation($id:ID!,$r:ClubRole!){setClubManagerRole(id:$id,role:$r)}'
const REVOKE = 'mutation($id:ID!){revokeClubManager(id:$id)}'

test.describe.configure({ mode: 'serial' })

test.describe('Club manager roles (api)', () => {
  const stamp = Date.now()
  const ownerEmail = `pw-owner-${stamp}@example.test`
  const coEmail = `pw-co-${stamp}@example.test`

  let ownerToken = ''
  let coToken = ''
  let clubId = ''
  let ownerAssignment = ''
  let coAssignment = ''

  /** The team as club A's owner sees it, keyed by email. */
  async function team(request: APIRequestContext, token: string) {
    const res = await gql(request, TEAM, { c: clubId }, token)
    expect(res.errors, `team list failed: ${JSON.stringify(res.errors)}`).toBeUndefined()
    return Object.fromEntries(
      (res.data.clubManagers as { id: string; email: string; role: string }[]).map((m) => [
        m.email,
        m,
      ]),
    )
  }

  test('setup: two clubs, then A invites B onto the team', async ({ request }) => {
    const a = await gql(request, ONBOARD, {
      i: {
        firstName: 'Ada',
        lastName: 'Owner',
        email: ownerEmail,
        password: 'Str0ngPass1',
        clubName: `Roles Club A ${stamp}`,
        country: 'BE',
        plan: 'FREE',
      },
    })
    ownerToken = a.data.onboardClub.token
    clubId = a.data.onboardClub.club.id

    const b = await gql(request, ONBOARD, {
      i: {
        firstName: 'Bo',
        lastName: 'Helper',
        email: coEmail,
        password: 'Str0ngPass1',
        clubName: `Roles Club B ${stamp}`,
        country: 'BE',
        plan: 'FREE',
      },
    })
    coToken = b.data.onboardClub.token
    expect(coToken).toBeTruthy()

    // Founding a club makes you its owner.
    const founding = await team(request, ownerToken)
    expect(founding[ownerEmail].role).toBe('OWNER')
    ownerAssignment = founding[ownerEmail].id

    const invited = await gql(request, INVITE, { i: { clubId, email: coEmail } }, ownerToken)
    expect(invited.errors, JSON.stringify(invited.errors)).toBeUndefined()

    // An invite grants the lesser role unless one is asked for.
    const withCo = await team(request, ownerToken)
    expect(withCo[coEmail].role).toBe('MANAGER')
    coAssignment = withCo[coEmail].id
  })

  test('a manager sees the team but cannot change it', async ({ request }) => {
    const seen = await team(request, coToken)
    expect(Object.keys(seen)).toHaveLength(2)

    const refusals: [string, Record<string, unknown>, string][] = [
      ['invite', { i: { clubId, email: `pw-third-${stamp}@example.test` } }, INVITE],
      ['promote themselves', { id: coAssignment, r: 'OWNER' }, SET_ROLE],
      ['demote the owner', { id: ownerAssignment, r: 'MANAGER' }, SET_ROLE],
      ['revoke the owner', { id: ownerAssignment }, REVOKE],
    ]

    for (const [label, variables, query] of refusals) {
      const res = await gql(request, query, variables, coToken)
      expect(res.errors, `a manager must not be able to ${label}`).toBeDefined()
    }

    // Nothing moved.
    const after = await team(request, ownerToken)
    expect(after[coEmail].role).toBe('MANAGER')
    expect(after[ownerEmail].role).toBe('OWNER')
  })

  test('an owner can promote, and the promoted manager gains team powers', async ({ request }) => {
    const promoted = await gql(request, SET_ROLE, { id: coAssignment, r: 'OWNER' }, ownerToken)
    expect(promoted.errors, JSON.stringify(promoted.errors)).toBeUndefined()
    expect((await team(request, ownerToken))[coEmail].role).toBe('OWNER')

    const invited = await gql(
      request,
      INVITE,
      { i: { clubId, email: `pw-third-${stamp}@example.test` } },
      coToken,
    )
    expect(invited.errors, JSON.stringify(invited.errors)).toBeUndefined()
  })

  test('the last owner can be neither demoted nor removed', async ({ request }) => {
    // Two owners, so standing one down is fine. This is how you hand over.
    const stepDown = await gql(request, SET_ROLE, { id: ownerAssignment, r: 'MANAGER' }, coToken)
    expect(stepDown.errors, JSON.stringify(stepDown.errors)).toBeUndefined()
    expect((await team(request, coToken))[ownerEmail].role).toBe('MANAGER')

    // One owner left: the club must not be able to lose them.
    const demote = await gql(request, SET_ROLE, { id: coAssignment, r: 'MANAGER' }, coToken)
    expect(demote.errors, 'the last owner must not be demotable').toBeDefined()

    const revoke = await gql(request, REVOKE, { id: coAssignment }, coToken)
    expect(revoke.errors, 'the last owner must not be removable').toBeDefined()

    expect((await team(request, coToken))[coEmail].role).toBe('OWNER')
  })
})
