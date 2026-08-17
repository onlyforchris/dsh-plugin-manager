import { describe, expect, it, vi } from 'vitest'
import {
  isInstallSpec,
  PluginOperationService,
} from '../src/operations.js'

describe('plugin operation service', () => {
  it('accepts only bounded package, GitHub, and local tarball specs', () => {
    expect(isInstallSpec('@scope/plugin@1.2.3')).toBe(true)
    expect(isInstallSpec('https://github.com/owner/repo.git#main')).toBe(true)
    expect(isInstallSpec('D:\\plugins\\demo.tgz')).toBe(true)
    expect(isInstallSpec('D:\\plugins\\bad name.tgz')).toBe(false)
    expect(isInstallSpec('demo & whoami')).toBe(false)
  })

  it('runs the exact standard DSH plugin action', async () => {
    const runner = vi.fn(async () => ({ exitCode: 0, output: 'done' }))
    const service = new PluginOperationService(
      runner,
      async () => new Set(['demo-plugin']),
      'web',
    )

    const result = await service.run({ action: 'update', target: 'demo-plugin' })
    expect(runner).toHaveBeenCalledWith('update', 'demo-plugin')
    expect(result).toMatchObject({
      success: true,
      command: 'dsh plugin --profile web update demo-plugin',
      restartRequired: true,
    })
  })

  it('protects the running manager and rejects missing dependencies', async () => {
    const service = new PluginOperationService(
      async () => ({ exitCode: 0, output: '' }),
      async () => new Set(['dsh-plugin-manager']),
      'web',
    )

    await expect(service.run({
      action: 'remove',
      target: 'dsh-plugin-manager',
    })).rejects.toMatchObject({ code: 'manager_protected' })

    await expect(service.run({
      action: 'update',
      target: 'missing-plugin',
    })).rejects.toMatchObject({ code: 'not_installed' })
  })

  it('serializes mutating operations', async () => {
    let release: (() => void) | undefined
    const runner = vi.fn(() => new Promise<{ exitCode: number; output: string }>(resolve => {
      release = () => resolve({ exitCode: 0, output: '' })
    }))
    const service = new PluginOperationService(
      runner,
      async () => new Set(['demo-plugin']),
      'web',
    )

    const first = service.run({ action: 'update', target: 'demo-plugin' })
    await expect(service.run({
      action: 'remove',
      target: 'demo-plugin',
    })).rejects.toMatchObject({ code: 'busy' })
    release?.()
    await first
  })
})
