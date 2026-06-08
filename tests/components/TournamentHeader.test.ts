import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TournamentHeader from '~/components/TournamentHeader.vue'
import type { Tournament } from '~/types/tournament'

describe('TournamentHeader', () => {
  const mockTournaments: Tournament[] = [
    {
      id: '1',
      title: 'Weekly Tournament',
      status: 'UPCOMING',
      liveStatus: 'NOT_STARTED',
      startTime: '2026-02-15T18:00:00Z',
      buyInCents: 5000,
      registrations: [],
      structure: [],
    },
    {
      id: '2',
      title: 'Monthly Championship',
      status: 'IN_PROGRESS',
      liveStatus: 'REGISTRATION_OPEN',
      startTime: '2026-02-20T19:00:00Z',
      buyInCents: 10000,
      registrations: [],
      structure: [],
    },
  ]

  it('should mount successfully', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'connected',
        modelValue: '1',
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should accept required props', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'connected',
        modelValue: '1',
      },
    })

    expect(wrapper.props('tournaments')).toEqual(mockTournaments)
    expect(wrapper.props('connectionStatus')).toBe('connected')
    expect(wrapper.props('modelValue')).toBe('1')
  })

  it('should render the status dot modifier for connected state', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'connected',
        modelValue: '1',
      },
    })

    expect(wrapper.find('.status-dot').classes()).toContain('status-dot--connected')
  })

  it('should render the status dot modifier for disconnected state', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'disconnected',
        modelValue: '1',
      },
    })

    expect(wrapper.find('.status-dot').classes()).toContain('status-dot--disconnected')
  })

  it('should render the status dot modifier for reconnecting state', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'reconnecting',
        modelValue: '1',
      },
    })

    expect(wrapper.find('.status-dot').classes()).toContain('status-dot--reconnecting')
  })

  it('should have selectedId computed property in sync with modelValue', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'connected',
        modelValue: '1',
      },
    })

    expect((wrapper.vm as any).selectedId).toBe('1')
  })

  it('should emit update:modelValue when selectedId changes', async () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'connected',
        modelValue: '1',
      },
    })

    ;(wrapper.vm as any).selectedId = '2'
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
  })
})
