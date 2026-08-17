import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createPluginInventory } from '../src/inventory.js'

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value), 'utf8')
}

describe('plugin inventory', () => {
  it('reports real bundle and client health for profile dependencies', async () => {
    const dshHome = await mkdtemp(join(tmpdir(), 'dpm-inventory-'))
    try {
      const root = join(dshHome, 'profiles', 'web')
      const goodRoot = join(root, 'node_modules', 'good-plugin')
      const plainRoot = join(root, 'node_modules', 'plain-lib')
      await mkdir(goodRoot, { recursive: true })
      await mkdir(plainRoot, { recursive: true })
      await writeJson(join(root, 'package.json'), {
        dependencies: {
          'good-plugin': '1.0.0',
          'plain-lib': '2.0.0',
        },
        dsh: {
          profile: {
            bundles: ['good-plugin'],
          },
        },
      })
      await writeJson(join(goodRoot, 'package.json'), {
        version: '1.0.0',
        exports: {
          './client': './client.js',
        },
        dsh: {
          bundle: { patch: './bundle.yml' },
          client: { platform: 'web' },
        },
      })
      await writeFile(join(goodRoot, 'bundle.yml'), '- insert: []\n', 'utf8')
      await writeFile(join(goodRoot, 'client.js'), 'export default {}\n', 'utf8')
      await writeJson(join(plainRoot, 'package.json'), { version: '2.0.0' })

      const inventory = await createPluginInventory({ dshHome, profileName: 'web' })
      expect(inventory.plugins).toHaveLength(2)
      expect(inventory.plugins.find(plugin => plugin.name === 'good-plugin')).toMatchObject({
        version: '1.0.0',
        bundle: true,
        client: true,
        health: 'healthy',
        issues: [],
      })
      expect(inventory.plugins.find(plugin => plugin.name === 'plain-lib')).toMatchObject({
        bundle: false,
        health: 'warning',
        issues: [expect.objectContaining({ code: 'bundle_missing' })],
      })
    } finally {
      await rm(dshHome, { recursive: true, force: true })
    }
  })

  it('marks broken declared files as errors', async () => {
    const dshHome = await mkdtemp(join(tmpdir(), 'dpm-inventory-'))
    try {
      const root = join(dshHome, 'profiles', 'web')
      const pluginRoot = join(root, 'node_modules', 'broken-plugin')
      await mkdir(pluginRoot, { recursive: true })
      await writeJson(join(root, 'package.json'), {
        dependencies: { 'broken-plugin': '1.0.0' },
        dsh: { profile: { bundles: ['broken-plugin'] } },
      })
      await writeJson(join(pluginRoot, 'package.json'), {
        version: '1.0.0',
        exports: {},
        dsh: {
          bundle: { patch: './missing.yml' },
          client: { platform: 'web' },
        },
      })

      const inventory = await createPluginInventory({ dshHome, profileName: 'web' })
      expect(inventory.plugins[0]?.health).toBe('error')
      expect(inventory.plugins[0]?.issues.map(issue => issue.code)).toEqual([
        'bundle_patch_missing',
        'client_export_missing',
      ])
    } finally {
      await rm(dshHome, { recursive: true, force: true })
    }
  })
})
