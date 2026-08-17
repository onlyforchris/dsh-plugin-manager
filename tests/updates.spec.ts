import { describe, expect, it, vi } from 'vitest'
import type { ManagedPlugin } from '../src/shared.js'
import { createNpmLatestVersionProvider, createPluginUpdates, isNewerVersion, usesNpmRegistry } from '../src/updates.js'

const plugin = (overrides: Partial<ManagedPlugin> = {}): ManagedPlugin => ({
  name: 'demo-plugin',
  spec: '^1.0.0',
  version: '1.2.3',
  bundle: true,
  client: true,
  manager: false,
  health: 'healthy',
  issues: [],
  canUpdate: true,
  canRemove: true,
  ...overrides,
})

describe('plugin update discovery', () => {
  it('compares stable semantic versions numerically', () => {
    expect(isNewerVersion('1.10.0', '1.9.9')).toBe(true)
    expect(isNewerVersion('1.2.3', '1.2.3')).toBe(false)
    expect(isNewerVersion('1.2.2', '1.2.3')).toBe(false)
  })

  it('only sends registry-backed dependencies to npm', () => {
    expect(usesNpmRegistry(plugin())).toBe(true)
    expect(usesNpmRegistry(plugin({ spec: 'file:D:/plugins/demo.tgz' }))).toBe(false)
    expect(usesNpmRegistry(plugin({ spec: 'https://github.com/owner/repo' }))).toBe(false)
  })

  it('reports available, current and unavailable states independently', async () => {
    const report = await createPluginUpdates([
      plugin(),
      plugin({ name: 'current-plugin', version: '2.0.0' }),
      plugin({ name: 'local-plugin', spec: 'file:D:/local.tgz' }),
    ], async name => name === 'demo-plugin' ? '1.3.0' : '2.0.0')
    expect(report.updates.map(item => item.state)).toEqual(['available', 'current', 'unavailable'])
    expect(report.updates[0]?.latestVersion).toBe('1.3.0')
  })

  it('caches successful npm registry responses', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ version: '3.0.0' }), { status: 200 }))
    const latest = createNpmLatestVersionProvider({ fetcher, cacheMs: 60_000 })
    await expect(latest('demo-plugin')).resolves.toBe('3.0.0')
    await expect(latest('demo-plugin')).resolves.toBe('3.0.0')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})