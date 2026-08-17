import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  MANAGER_VERSION,
  PACKAGE_NAME,
  type DiagnosticCheck,
  type DiagnosticReport,
  type DiagnosticStatus,
  type DiagnosticSummary,
} from './shared.js'
import type { LoaderEntryLike } from './context.js'

interface ProfileManifest {
  readonly dependencies?: Record<string, string>
  readonly dsh?: {
    readonly profile?: {
      readonly bundles?: readonly string[]
    }
  }
}

export interface DiagnosticInput {
  readonly dshHome: string
  readonly profileName: string
  readonly nodeVersion: string
  readonly platform: NodeJS.Platform
  readonly arch: string
  readonly webServer: {
    readonly host: '127.0.0.1' | '0.0.0.0'
    readonly port: number
  }
  readonly loaderEntries: readonly LoaderEntryLike[]
}

function check(id: string, label: string, status: DiagnosticStatus, message: string): DiagnosticCheck {
  return { id, label, status, message }
}

function nodeVersionSupported(version: string): boolean {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (match === null) return false
  const major = Number(match[1])
  const minor = Number(match[2])
  return major > 22 || (major === 22 && minor >= 19)
}

async function canAccess(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function readProfileManifest(path: string): Promise<ProfileManifest | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf8'))
    return parsed !== null && typeof parsed === 'object' ? parsed as ProfileManifest : null
  } catch {
    return null
  }
}

function summarize(checks: readonly DiagnosticCheck[]): DiagnosticSummary {
  return checks.reduce<DiagnosticSummary>((summary, item) => ({
    ...summary,
    [item.status]: summary[item.status] + 1,
  }), { pass: 0, warning: 0, fail: 0 })
}

export async function createDiagnosticReport(input: DiagnosticInput): Promise<DiagnosticReport> {
  const profileRoot = join(input.dshHome, 'profiles', input.profileName)
  const manifestPath = join(profileRoot, 'package.json')
  const lockPath = join(profileRoot, 'pnpm-lock.yaml')
  const homeAvailable = await canAccess(input.dshHome)
  const manifest = await readProfileManifest(manifestPath)
  const lockAvailable = await canAccess(lockPath)
  const dependencies = manifest?.dependencies ?? {}
  const bundles = manifest?.dsh?.profile?.bundles ?? []
  const managerEntries = input.loaderEntries.filter(entry => entry.options.name === PACKAGE_NAME)

  const checks: DiagnosticCheck[] = [
    check(
      'node-version',
      'Node.js 版本',
      nodeVersionSupported(input.nodeVersion) ? 'pass' : 'fail',
      nodeVersionSupported(input.nodeVersion)
        ? `Node.js ${input.nodeVersion} 满足 DSH 要求`
        : `Node.js ${input.nodeVersion} 低于 22.19`,
    ),
    check(
      'runtime-platform',
      '运行平台',
      'pass',
      `${input.platform}/${input.arch}`,
    ),
    check(
      'dsh-home',
      'DSH Home',
      homeAvailable ? 'pass' : 'fail',
      homeAvailable ? 'DSH Home 可访问' : 'DSH Home 不存在或不可访问',
    ),
    check(
      'profile-manifest',
      'Profile 清单',
      manifest === null ? 'fail' : 'pass',
      manifest === null ? `Profile ${input.profileName} 清单缺失或格式错误` : `Profile ${input.profileName} 清单有效`,
    ),
    check(
      'profile-lock',
      'Profile 依赖锁',
      lockAvailable ? 'pass' : 'warning',
      lockAvailable ? 'pnpm-lock.yaml 已存在' : '未发现 pnpm-lock.yaml，依赖版本可能未锁定',
    ),
    check(
      'manager-dependency',
      '管家依赖',
      Object.hasOwn(dependencies, PACKAGE_NAME) ? 'pass' : 'fail',
      Object.hasOwn(dependencies, PACKAGE_NAME) ? 'Profile 已声明插件管家依赖' : 'Profile 未声明插件管家依赖',
    ),
    check(
      'manager-bundle',
      'Bundle 注册',
      bundles.includes(PACKAGE_NAME) ? 'pass' : 'fail',
      bundles.includes(PACKAGE_NAME) ? 'Bundle 已加入 Profile 层顺序' : 'Bundle 未加入 Profile 层顺序',
    ),
    check(
      'manager-loader-entry',
      'Loader 实例',
      managerEntries.length === 1 ? 'pass' : managerEntries.length === 0 ? 'fail' : 'warning',
      managerEntries.length === 1
        ? '插件管家已加载且只有一个实例'
        : managerEntries.length === 0
          ? '当前 Loader 中未发现插件管家'
          : `当前 Loader 中发现 ${managerEntries.length} 个插件管家实例`,
    ),
    check(
      'web-runtime',
      'DSH Web',
      input.webServer.port > 0 ? 'pass' : 'fail',
      input.webServer.port > 0
        ? `Web 服务已监听 ${input.webServer.host}:${input.webServer.port}`
        : 'Web 服务尚未完成监听',
    ),
  ]

  return {
    schemaVersion: 1,
    managerVersion: MANAGER_VERSION,
    generatedAt: new Date().toISOString(),
    profileName: input.profileName,
    summary: summarize(checks),
    checks,
  }
}
