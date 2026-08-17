// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { apply, PluginDoctorTab } from '../src/client/index.js'

describe('client plugin registration', () => {
  it('registers a native Plugins settings tab and owned styles', () => {
    const register = vi.fn(() => () => undefined)
    const inject = vi.fn((_name: string, provider: () => unknown) => provider())
    const effects: (() => void | (() => void))[] = []

    apply({
      slots: { inject, register },
      effect(setup) { effects.push(setup) },
    })

    const dispose = effects[0]?.()
    expect(document.head.querySelector('style[data-plugin="dsh-plugin-manager"]')).not.toBeNull()
    expect(inject).toHaveBeenCalledWith('settings.plugins.tab', expect.any(Function))
    expect(register).toHaveBeenCalledWith(expect.objectContaining({
      name: 'settings.plugins.tab',
      id: 'doctor',
      label: '插件医生',
    }), PluginDoctorTab)

    if (typeof dispose === 'function') dispose()
    expect(document.head.querySelector('style[data-plugin="dsh-plugin-manager"]')).toBeNull()
  })
})
