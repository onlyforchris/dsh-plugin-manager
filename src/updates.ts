import type { ManagedPlugin, PluginUpdateInfo, PluginUpdatesReport } from './shared.js'

const REGISTRY = 'https://registry.npmjs.org' as const

function numericVersion(value: string): readonly number[] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

export function isNewerVersion(latest: string, installed: string): boolean {
  const left = numericVersion(latest)
  const right = numericVersion(installed)
  if (left === null || right === null) return false
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return (left[index] ?? 0) > (right[index] ?? 0)
  }
  return false
}

export function usesNpmRegistry(plugin: ManagedPlugin): boolean {
  return !/^(?:file|link|https?:|github:|git(?:\+|:))/i.test(plugin.spec)
}

export type LatestVersionProvider = (name: string) => Promise<string>

export function createNpmLatestVersionProvider(input: {
  readonly timeoutMs?: number
  readonly cacheMs?: number
  readonly fetcher?: typeof fetch
} = {}): LatestVersionProvider {
  const cache = new Map<string, { expires: number; value: Promise<string> }>()
  const fetcher = input.fetcher ?? fetch
  return async name => {
    const now = Date.now()
    const hit = cache.get(name)
    if (hit && hit.expires > now) return hit.value
    const value = (async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 4_000)
      try {
        const response = await fetcher(`${REGISTRY}/${encodeURIComponent(name)}/latest`, {
          headers: { accept: 'application/json', 'user-agent': 'dsh-plugin-manager' },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`registry_http_${response.status}`)
        const body = await response.json() as { readonly version?: unknown }
        if (typeof body.version !== 'string') throw new Error('registry_invalid_response')
        return body.version
      } finally {
        clearTimeout(timeout)
      }
    })()
    cache.set(name, { expires: now + (input.cacheMs ?? 10 * 60_000), value })
    void value.catch(() => cache.delete(name))
    return value
  }
}

export async function createPluginUpdates(
  plugins: readonly ManagedPlugin[],
  latestVersion: LatestVersionProvider,
): Promise<PluginUpdatesReport> {
  const updates: PluginUpdateInfo[] = await Promise.all(plugins.map(async plugin => {
    if (!usesNpmRegistry(plugin)) {
      return { name: plugin.name, installedVersion: plugin.version, latestVersion: null, state: 'unavailable', message: '本地包或 Git 源无法通过 npm Registry 判断新版本' }
    }
    if (plugin.version === null) {
      return { name: plugin.name, installedVersion: null, latestVersion: null, state: 'unavailable', message: '未读取到已安装版本' }
    }
    try {
      const latest = await latestVersion(plugin.name)
      const available = isNewerVersion(latest, plugin.version)
      return {
        name: plugin.name,
        installedVersion: plugin.version,
        latestVersion: latest,
        state: available ? 'available' : 'current',
        message: available ? `可升级到 ${latest}` : '已是 Registry 最新版本',
      }
    } catch {
      return { name: plugin.name, installedVersion: plugin.version, latestVersion: null, state: 'unavailable', message: 'npm Registry 暂时不可用或包未发布' }
    }
  }))
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), registry: REGISTRY, updates }
}