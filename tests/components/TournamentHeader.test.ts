import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TournamentHeader from '~/components/TournamentHeader.vue'

describe('TournamentHeader', () => {
  const mockTournaments = [
    {
      id: '1',
      title: 'Weekly Tournament',
      status: 'NOT_STARTED',
      startDate: '2026-02-15T18:00:00Z',
      buyIn: 5000,
    },
    {
      id: '2',
      title: 'Monthly Championship',
      status: 'REGISTRATION_OPEN',
      startDate: '2026-02-20T19:00:00Z',
      buyIn: 10000,
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

  it('should compute statusDot correctly for connected state', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'connected',
        modelValue: '1',
      },
    })

    expect(wrapper.vm.statusDot).toBe('bg-pp-accent-gold')
  })

  it('should compute statusDot correctly for disconnected state', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'disconnected',
        modelValue: '1',
      },
    })

    expect(wrapper.vm.statusDot).toBe('bg-red-500')
  })

  it('should compute statusDot correctly for reconnecting state', () => {
    const wrapper = mount(TournamentHeader, {
      props: {
        tournaments: mockTournaments,
        lastUpdate: Date.now(),
        connectionStatus: 'reconnecting',
        modelValue: '1',
      },
    })

    expect(wrapper.vm.statusDot).toBe('bg-pp-text-secondary animate-pulse')
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

    expect(wrapper.vm.selectedId).toBe('1')
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

    wrapper.vm.selectedId = '2'
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
  })
})
