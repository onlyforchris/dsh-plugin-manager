import { PACKAGE_NAME, type PluginCatalog, type PluginCatalogEntry } from './shared.js'

const BUILTIN: readonly PluginCatalogEntry[] = [{
  name: PACKAGE_NAME,
  description: '管理 DSH Profile 插件生命周期并检查 Manifest、Bundle 与 Client 声明。',
  installSpec: 'https://github.com/onlyforchris/dsh-plugin-manager',
  repository: 'https://github.com/onlyforchris/dsh-plugin-manager',
  trust: 'builtin',
}]

export function createPluginCatalog(profileEntries: readonly PluginCatalogEntry[] = []): PluginCatalog {
  const entries = new Map<string, PluginCatalogEntry>()
  for (const entry of [...BUILTIN, ...profileEntries]) entries.set(entry.name, entry)
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), entries: [...entries.values()] }
}