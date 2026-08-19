import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { delimiter, dirname, join, resolve } from 'node:path'
import type {
  OperationProgress,
  PluginAction,
  PluginOperationRequest,
  PluginOperationResult,
} from './shared.js'
import { PACKAGE_NAME } from './shared.js'

const require = createRequire(import.meta.url)
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i
const NPM_SPEC_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:@[a-z0-9._*^~+-]+)?$/i
const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?(?:#[a-z0-9._/-]+)?$/i
const GITHUB_SPEC_PATTERN = /^github:[a-z0-9_.-]+\/[a-z0-9_.-]+(?:#[a-z0-9._/-]+)?$/i
const WINDOWS_TARBALL_PATTERN = /^(?:file:)?[a-z]:[\\/][a-z0-9._\\/-]+\.tgz$/i
const POSIX_TARBALL_PATTERN = /^(?:file:)?\/[a-z0-9._/-]+\.tgz$/i
const MAX_OUTPUT = 32_000
const PNPM_STORE_MISMATCH =
  /ERR_PNPM_UNEXPECTED_STORE|ERR_PNPM_ABORTED_REMOVE_MODULES_DIR|different major version of pnpm|wants to use the store at/

export class PluginOperationError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid_request' | 'busy' | 'not_installed' | 'manager_protected',
  ) {
    super(message)
  }
}

export interface CommandResult {
  readonly exitCode: number
  readonly output: string
}

export type PluginCommandRunner = (
  action: PluginAction,
  target: string,
) => Promise<CommandResult>

/** 操作实时输出追踪：页面通过 /operations/progress 轮询它渲染进度条。 */
export class OperationProgressTracker {
  private running = false
  private action: PluginAction | null = null
  private target: string | null = null
  private output = ''
  private finishedAt: string | null = null

  start(action: PluginAction, target: string): void {
    this.running = true
    this.action = action
    this.target = target
    this.output = ''
    this.finishedAt = null
  }

  append(chunk: string): void {
    if (!this.running) return
    this.output = appendOutput(this.output, chunk)
  }

  finish(): void {
    if (!this.running) return
    this.running = false
    this.finishedAt = new Date().toISOString()
  }

  snapshot(): OperationProgress {
    return {
      running: this.running,
      action: this.action,
      target: this.target,
      output: this.output,
      finishedAt: this.finishedAt,
    }
  }
}

function appendOutput(current: string, chunk: Buffer | string): string {
  const combined = current + chunk.toString()
  return combined.length <= MAX_OUTPUT ? combined : combined.slice(combined.length - MAX_OUTPUT)
}

/**
 * Directories whose `.bin` shims must win over the ambient PATH when the
 * plugin command spawns `pnpm`: the profile's own installation (the pinned
 * pnpm 10.34.5 the manager depends on is hoisted there) and the manager's
 * own dependency tree as a fallback. A PATH pnpm of a different major would
 * refuse to touch a store created by another major
 * (`ERR_PNPM_UNEXPECTED_STORE`), so the operation must resolve pnpm
 * deterministically instead of trusting the environment.
 */
export function resolvePnpmBins(profileRoot: string): string[] {
  const candidates: string[] = [join(profileRoot, 'node_modules', '.bin')]
  try {
    const pnpmPackage = require.resolve('pnpm/package.json')
    candidates.push(join(dirname(pnpmPackage), '..', '.bin'))
  } catch {
    // 管理器依赖中没有 pnpm（异常安装），退回 PATH 上的 pnpm
  }
  return [...new Set(candidates)].filter((dir) => existsSync(dir))
}

/** 中文指引：pnpm 版本与 Profile 的 store 不匹配时如何修复。 */
export function pnpmStoreHint(profileRoot: string): string {
  const profilePnpmBin = join(profileRoot, 'node_modules', '.bin')
  return `检测到 pnpm 版本与 Profile 不匹配：Profile 的依赖由 pnpm 10.x（store v10）安装，而本次命令使用的 pnpm 是 11.x（store v11），pnpm 拒绝继续。插件管家会优先使用 Profile 内置的 pnpm 10.34.5（${profilePnpmBin}）；若你在终端手动执行 dsh plugin 命令，请先执行：set PATH=${profilePnpmBin};%PATH%（PowerShell：$env:PATH="${profilePnpmBin};$env:PATH"），然后重试。`
}

/**
 * 解析 pnpm 的 bin 脚本绝对路径（`<node_modules>/pnpm/bin/pnpm.cjs`）。
 * Windows 上 `.cmd` shim 无法被 `spawn({shell:false})` 直接执行（EINVAL），
 * 而 `spawn("pnpm")` 又不做扩展名解析（ENOENT）——最可靠的方式是用
 * `node <pnpm.cjs>` 直接运行，且配合 `windowsHide` 完全无窗口。
 */
export function resolvePnpmBinScript(bins: readonly string[]): string | null {
  for (const bin of bins) {
    const candidate = join(bin, '..', 'pnpm', 'bin', 'pnpm.cjs')
    if (existsSync(candidate)) return candidate
  }
  try {
    return require.resolve('pnpm/bin/pnpm.cjs')
  } catch {
    return null
  }
}

export function isInstallSpec(value: string): boolean {
  return NPM_SPEC_PATTERN.test(value)
    || GITHUB_URL_PATTERN.test(value)
    || GITHUB_SPEC_PATTERN.test(value)
    || WINDOWS_TARBALL_PATTERN.test(value)
    || POSIX_TARBALL_PATTERN.test(value)
}

const RELATIVE_SPEC = /^(?<prefix>(?:file|link):)?(?<path>\.{1,2}(?:[/\\].*)?)$/
const GIT_SPEC = /^git\+|^github:|\.git(?:#|$)/

/**
 * 与 `dsh plugin` 的 CLI 行为一致：把相对路径规格（`.`、`../x`、`file:./x`）
 * 锚定到调用方目录而不是 Profile 目录；绝对路径和其他规格原样透传。
 */
export function anchorPathSpec(argument: string, cwd: string): string {
  const match = RELATIVE_SPEC.exec(argument)
  if (!match?.groups?.path) return argument
  return `${match.groups.prefix ?? ''}${resolve(cwd, match.groups.path)}`
}

/**
 * 判断 Profile 中已安装的某个依赖是否声明了 `dsh.bundle.patch`
 * （即是否属于 profile layer bundle）。先查 hoisted 顶层，再兜底扫 .pnpm 虚拟 store。
 */
export async function declaresBundle(
  profileRoot: string,
  packageName: string,
): Promise<boolean> {
  const candidates = [join(profileRoot, 'node_modules', packageName, 'package.json')]
  try {
    const scoped = packageName.startsWith('@') ? packageName.replace('/', '+') : packageName
    const entries = await readdir(join(profileRoot, 'node_modules', '.pnpm'))
    for (const entry of entries) {
      if (entry.startsWith(`${scoped}@`)) {
        candidates.push(join(profileRoot, 'node_modules', '.pnpm', entry, 'node_modules', packageName, 'package.json'))
      }
    }
  } catch {
    // 没有 .pnpm 虚拟 store（非 pnpm 布局）
  }
  for (const candidate of candidates) {
    try {
      const manifest = JSON.parse(await readFile(candidate, 'utf8')) as {
        dsh?: { bundle?: { patch?: string } }
      }
      return manifest.dsh?.bundle?.patch !== undefined
    } catch {
      // 继续下一个候选
    }
  }
  return false
}

async function readDependencyNames(profileRoot: string): Promise<ReadonlySet<string>> {
  try {
    const manifest = JSON.parse(await readFile(join(profileRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }
    return new Set(Object.keys(manifest.dependencies ?? {}))
  } catch {
    throw new PluginOperationError('Profile 状态异常：缺少可读的 package.json', 'invalid_request')
  }
}

/**
 * 镜像 `dsh plugin` 命令的 bundles 对账：依赖中声明 `dsh.bundle` 的包进入
 * `dsh.profile.bundles` 层栈（按依赖顺序追加）；被移除或不再声明 bundle 的
 * 依赖从层栈退出；模板自带的 in-box bundles（非依赖）永不触碰。
 */
export async function reconcileBundles(
  profileRoot: string,
  beforeDeps: ReadonlySet<string>,
): Promise<void> {
  const manifestPath = join(profileRoot, 'package.json')
  let manifest: {
    dependencies?: Record<string, string>
    dsh?: { profile?: { bundles?: string[] } }
  }
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch {
    throw new PluginOperationError('Profile 状态异常：缺少可读的 package.json', 'invalid_request')
  }
  const dependencyNames = Object.keys(manifest.dependencies ?? {})
  const plugins = manifest.dsh?.profile?.bundles ?? []
  let changed = false
  for (const packageName of dependencyNames) {
    if (!plugins.includes(packageName) && await declaresBundle(profileRoot, packageName)) {
      plugins.push(packageName)
      changed = true
    }
  }
  const dependencySet = new Set(dependencyNames)
  for (const packageName of [...plugins]) {
    const wasDependency = beforeDeps.has(packageName) || dependencySet.has(packageName)
    const stillBundle = dependencySet.has(packageName) && await declaresBundle(profileRoot, packageName)
    if (wasDependency && !stillBundle) {
      plugins.splice(plugins.indexOf(packageName), 1)
      changed = true
    }
  }
  if (!changed) return
  await writeFile(manifestPath, JSON.stringify({
    ...manifest,
    dsh: {
      ...manifest.dsh,
      profile: {
        ...manifest.dsh?.profile,
        bundles: plugins,
      },
    },
  }, null, 2) + '\n', 'utf8')
}

function runPnpm(
  args: readonly string[],
  input: {
    readonly profileRoot: string
    readonly timeoutMs?: number
    readonly onOutput?: (chunk: string) => void
  },
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const bins = resolvePnpmBins(input.profileRoot)
    const pnpmBin = resolvePnpmBinScript(bins)
    if (pnpmBin === null) {
      reject(new PluginOperationError(
        'Profile 中找不到 pnpm（node_modules/pnpm 缺失），请先在终端执行 dsh plugin --profile web install 修复依赖',
        'invalid_request',
      ))
      return
    }
    const env = { ...process.env }
    const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') ?? 'PATH'
    env[pathKey] = [...bins, env[pathKey] ?? ''].join(delimiter)

    // 直接以隐藏控制台运行 Profile 内置 pnpm：不经过 `dsh plugin` 的
    // shell 包装，Windows 上每次操作不会再弹出可见的 cmd 窗口。
    const child = spawn(process.execPath, [pnpmBin, ...args], {
      cwd: input.profileRoot,
      env,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    child.stdout.on('data', chunk => {
      output = appendOutput(output, chunk)
      input.onOutput?.(chunk.toString())
    })
    child.stderr.on('data', chunk => {
      output = appendOutput(output, chunk)
      input.onOutput?.(chunk.toString())
    })
    child.once('error', reject)

    const timeout = setTimeout(() => child.kill(), input.timeoutMs ?? 120_000)
    child.once('close', code => {
      clearTimeout(timeout)
      const exitCode = code ?? 1
      const trimmed = output.trim()
      const hint = exitCode !== 0 && PNPM_STORE_MISMATCH.test(trimmed)
        ? `${pnpmStoreHint(input.profileRoot)}\n\n${trimmed}`
        : trimmed
      resolve({ exitCode, output: hint })
    })
  })
}

/**
 * 组装实际传给 pnpm 的参数。update 必须带 --latest：Profile 中插件常以
 * 精确版本（如 "0.1.31"）或 Git 源声明，裸 `pnpm update <name>` 只会在
 * 既有 semver 范围内更新，精确版本会被判定为 "Already up to date" 而不升级。
 */
export function buildPnpmArgs(
  action: PluginAction,
  target: string,
  cwd: string,
): string[] {
  return action === 'add'
    ? ['add', anchorPathSpec(target, cwd)]
    : action === 'update'
      ? ['update', '--latest', target]
      : [action, target]
}

export function createDshPluginRunner(input: {
  readonly profileRoot: string
  readonly cwd: string
  readonly timeoutMs?: number
  readonly onOutput?: (chunk: string) => void
}): PluginCommandRunner {
  return async (action, target) => {
    const beforeDeps = await readDependencyNames(input.profileRoot)
    const args = buildPnpmArgs(action, target, input.cwd)
    const result = await runPnpm(args, {
      profileRoot: input.profileRoot,
      ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
      ...(input.onOutput !== undefined ? { onOutput: input.onOutput } : {}),
    })
    if (result.exitCode !== 0) {
      if (action === 'add' && GIT_SPEC.test(target)) {
        return {
          ...result,
          output: `${result.output}\n\n提示：git 仓库插件在安装时通过 prepare 脚本构建，pnpm 默认阻止——请把 pnpm 输出中列出的 key 加入 ${join(input.profileRoot, 'pnpm-workspace.yaml')} 的 allowBuilds 后重试。`,
        }
      }
      return result
    }
    try {
      await reconcileBundles(input.profileRoot, beforeDeps)
    } catch (error) {
      return {
        ...result,
        output: `${result.output}\n\n警告：pnpm 执行成功，但 bundles 对账失败：${error instanceof Error ? error.message : String(error)}`,
      }
    }
    return result
  }
}

function validateRequest(request: PluginOperationRequest, installedNames: ReadonlySet<string>): void {
  if (!(['add', 'update', 'remove'] as const).includes(request.action)) {
    throw new PluginOperationError('不支持的插件操作', 'invalid_request')
  }
  if (request.target.length === 0 || request.target.length > 512) {
    throw new PluginOperationError('插件目标不能为空或超过 512 个字符', 'invalid_request')
  }
  if (request.action === 'add') {
    if (!isInstallSpec(request.target)) {
      throw new PluginOperationError(
        '仅支持 npm 包、GitHub 仓库或无空格的本地 .tgz 绝对路径',
        'invalid_request',
      )
    }
    if (request.target === PACKAGE_NAME) {
      throw new PluginOperationError('插件管家自身请通过外部 CLI 升级', 'manager_protected')
    }
    return
  }
  if (!PACKAGE_NAME_PATTERN.test(request.target)) {
    throw new PluginOperationError('升级和卸载只接受已安装的包名', 'invalid_request')
  }
  if (request.target === PACKAGE_NAME) {
    throw new PluginOperationError('不能从运行中的插件管家卸载或升级自身', 'manager_protected')
  }
  if (!installedNames.has(request.target)) {
    throw new PluginOperationError('目标插件不在当前 Profile 依赖中', 'not_installed')
  }
}

/**
 * pnpm 无实际变更时的输出特征：只出现 "Already up to date"，没有
 * "Packages: +N" 变更行。此类结果不应视为需要重启的成功变更——
 * 否则点一次"升级"（实际没升）也会触发一次 DSH 重启。
 */
function unchangedOutput(output: string): boolean {
  return /already up to date/i.test(output) && !/Packages:\s*\+/i.test(output)
}

export class PluginOperationService {
  private running = false
  private readonly progress: OperationProgressTracker

  constructor(
    private readonly runner: PluginCommandRunner,
    private readonly getInstalledNames: () => Promise<ReadonlySet<string>>,
    private readonly profileName: string,
    progress?: OperationProgressTracker,
  ) {
    this.progress = progress ?? new OperationProgressTracker()
  }

  /** 页面轮询用的实时输出快照。 */
  progressSnapshot(): OperationProgress {
    return this.progress.snapshot()
  }

  async run(request: PluginOperationRequest): Promise<PluginOperationResult> {
    if (this.running) throw new PluginOperationError('已有插件操作正在执行', 'busy')
    this.running = true
    this.progress.start(request.action, request.target)
    try {
      const installedNames = await this.getInstalledNames()
      validateRequest(request, installedNames)
      const result = await this.runner(request.action, request.target)
      return {
        schemaVersion: 1,
        action: request.action,
        target: request.target,
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        command: `dsh plugin --profile ${this.profileName} ${request.action} ${request.target}`,
        output: result.output,
        restartRequired:
          result.exitCode === 0 && !unchangedOutput(result.output),
        finishedAt: new Date().toISOString(),
      }
    } finally {
      this.running = false
      this.progress.finish()
    }
  }
}
