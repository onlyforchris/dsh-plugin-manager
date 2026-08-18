import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  isInstallSpec,
  PluginOperationService,
  pnpmStoreHint,
  resolvePnpmBins,
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

  it('prefers the profile and manager pnpm bins over the ambient PATH', () => {
    const bins = resolvePnpmBins(process.cwd())
    expect(bins.length).toBeGreaterThan(0)
    // 每个候选都必须是真实存在的 .bin 目录，且包含 pnpm 入口
    for (const bin of bins) {
      expect(bin.endsWith('.bin')).toBe(true)
      expect(existsSync(join(bin, 'pnpm.cmd')) || existsSync(join(bin, 'pnpm'))).toBe(true)
    }
  })

  it('renders a remediation hint for pnpm store mismatches', () => {
    const hint = pnpmStoreHint(process.cwd())
    expect(hint).toContain('pnpm 版本与 Profile 不匹配')
    expect(hint).toContain('pnpm 10.34.5')
    expect(hint).toContain(process.cwd())
  })
})
