import { access, readFile } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import {
  PACKAGE_NAME,
  type ManagedPlugin,
  type PluginHealthIssue,
  type PluginHealthStatus,
  type PluginInventory,
} from './shared.js'

interface ProfileManifest {
  readonly dependencies?: Record<string, string>
  readonly dsh?: {
    readonly profile?: {
      readonly bundles?: readonly string[]
    }
  }
}

interface PackageManifest {
  readonly version?: string
  readonly exports?: unknown
  readonly dsh?: {
    readonly bundle?: {
      readonly patch?: string
    }
    readonly client?: {
      readonly platform?: string
    }
  }
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return null
  }
}

async function canAccess(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function safePackageFile(packageRoot: string, declaredPath: string): string | null {
  if (!declaredPath.startsWith('./')) return null
  const candidate = resolve(packageRoot, declaredPath)
  const inside = relative(packageRoot, candidate)
  return inside !== '' && !inside.startsWith('..') && !isAbsolute(inside) ? candidate : null
}

function clientExport(exportsValue: unknown): string | null {
  if (exportsValue === null || typeof exportsValue !== 'object' || Array.isArray(exportsValue)) return null
  const value = (exportsValue as Record<string, unknown>)['./client']
  if (typeof value === 'string') return value
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    for (const key of ['browser', 'import', 'default']) {
      if (typeof record[key] === 'string') return record[key]
    }
  }
  return null
}

function healthOf(issues: readonly PluginHealthIssue[]): PluginHealthStatus {
  if (issues.some(issue => issue.severity === 'error')) return 'error'
  return issues.length > 0 ? 'warning' : 'healthy'
}

export function profileRoot(dshHome: string, profileName: string): string {
  return join(dshHome, 'profiles', profileName)
}

export async function createPluginInventory(input: {
  readonly dshHome: string
  readonly profileName: string
}): Promise<PluginInventory> {
  const root = profileRoot(input.dshHome, input.profileName)
  const manifest = await readJson<ProfileManifest>(join(root, 'package.json'))
  const dependencies = manifest?.dependencies ?? {}
  const bundles = new Set(manifest?.dsh?.profile?.bundles ?? [])

  const plugins: ManagedPlugin[] = await Promise.all(
    Object.entries(dependencies).map(async ([name, spec]) => {
      const packageRoot = join(root, 'node_modules', ...name.split('/'))
      const installed = await readJson<PackageManifest>(join(packageRoot, 'package.json'))
      const issues: PluginHealthIssue[] = []
      const manager = name === PACKAGE_NAME
      const patch = installed?.dsh?.bundle?.patch
      const hasBundle = typeof patch === 'string'
      const hasClient = installed?.dsh?.client !== undefined

      if (installed === null) {
        issues.push({
          code: 'package_missing',
          severity: 'error',
          message: 'Profile 已声明依赖，但安装目录中没有有效的 package.json',
        })
      } else if (!hasBundle) {
        issues.push({
          code: 'bundle_missing',
          severity: 'warning',
          message: '该依赖没有声明 dsh.bundle，不会作为 DSH Bundle 加载',
        })
      } else {
        if (!bundles.has(name)) {
          issues.push({
            code: 'bundle_unregistered',
            severity: 'error',
            message: '包声明了 dsh.bundle，但没有加入当前 Profile 的 Bundle 顺序',
          })
        }
        const patchFile = safePackageFile(packageRoot, patch)
        if (patchFile === null || !(await canAccess(patchFile))) {
          issues.push({
            code: 'bundle_patch_missing',
            severity: 'error',
            message: 'dsh.bundle.patch 指向的配置文件不存在或路径无效',
          })
        }
      }

      if (hasClient) {
        const exported = clientExport(installed?.exports)
        const clientFile = exported === null ? null : safePackageFile(packageRoot, exported)
        if (clientFile === null || !(await canAccess(clientFile))) {
          issues.push({
            code: 'client_export_missing',
            severity: 'error',
            message: '包声明了 dsh.client，但没有可访问的 ./client 导出',
          })
        }
      }

      return {
        name,
        spec,
        version: typeof installed?.version === 'string' ? installed.version : null,
        bundle: hasBundle && bundles.has(name),
        client: hasClient,
        manager,
        health: healthOf(issues),
        issues,
        canUpdate: !manager && !/^(?:file|link):/i.test(spec),
        canRemove: !manager,
      }
    }),
  )

  plugins.sort((left, right) =>
    Number(right.manager) - Number(left.manager) || left.name.localeCompare(right.name),
  )

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    profileName: input.profileName,
    plugins,
  }
}
