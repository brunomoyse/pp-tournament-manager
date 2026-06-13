import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'

// Mock the network composable so the banner's visibility is driven by a
// controllable connectionStatus ref.
const connectionStatus = ref<'connected' | 'disconnected' | 'reconnecting'>('connected')
vi.mock('~/composables/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ connectionStatus }),
}))

import PpConnectionBanner from '~/components/PpConnectionBanner.vue'

describe('PpConnectionBanner', () => {
  it('is hidden while connected', () => {
    connectionStatus.value = 'connected'
    const wrapper = mount(PpConnectionBanner)
    expect(wrapper.find('.pp-connection-banner').exists()).toBe(false)
  })

  it('shows the offline message when disconnected', async () => {
    connectionStatus.value = 'disconnected'
    const wrapper = mount(PpConnectionBanner)
    const banner = wrapper.find('.pp-connection-banner')
    expect(banner.exists()).toBe(true)
    expect(banner.classes()).not.toContain('pp-connection-banner--reconnecting')
    expect(banner.text().length).toBeGreaterThan(0)
  })

  it('shows the reconnecting state with its modifier class', () => {
    connectionStatus.value = 'reconnecting'
    const wrapper = mount(PpConnectionBanner)
    const banner = wrapper.find('.pp-connection-banner')
    expect(banner.exists()).toBe(true)
    expect(banner.classes()).toContain('pp-connection-banner--reconnecting')
  })
})
