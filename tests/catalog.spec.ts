import { describe, expect, it } from 'vitest'
import { createPluginCatalog } from '../src/catalog.js'

describe('trusted plugin catalog', () => {
  it('keeps builtin trust and lets profile configuration override by package name', () => {
    const catalog = createPluginCatalog([{
      name: 'profile-plugin',
      description: 'Profile managed source',
      installSpec: 'profile-plugin',
      repository: 'https://github.com/example/profile-plugin',
      trust: 'profile',
    }])
    expect(catalog.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'dsh-plugin-manager', trust: 'builtin' }),
      expect.objectContaining({ name: 'profile-plugin', trust: 'profile' }),
    ]))
  })
})