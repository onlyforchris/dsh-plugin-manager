import { spawn } from 'node:child_process'
import { delimiter, join } from 'node:path'
import type {
  PluginAction,
  PluginOperationRequest,
  PluginOperationResult,
} from './shared.js'
import { PACKAGE_NAME } from './shared.js'

const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i
const NPM_SPEC_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:@[a-z0-9._*^~+-]+)?$/i
const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?(?:#[a-z0-9._/-]+)?$/i
const GITHUB_SPEC_PATTERN = /^github:[a-z0-9_.-]+\/[a-z0-9_.-]+(?:#[a-z0-9._/-]+)?$/i
const WINDOWS_TARBALL_PATTERN = /^(?:file:)?[a-z]:[\\/][a-z0-9._\\/-]+\.tgz$/i
const POSIX_TARBALL_PATTERN = /^(?:file:)?\/[a-z0-9._/-]+\.tgz$/i
const MAX_OUTPUT = 32_000

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

function appendOutput(current: string, chunk: Buffer | string): string {
  const combined = current + chunk.toString()
  return combined.length <= MAX_OUTPUT ? combined : combined.slice(combined.length - MAX_OUTPUT)
}

export function isInstallSpec(value: string): boolean {
  return NPM_SPEC_PATTERN.test(value)
    || GITHUB_URL_PATTERN.test(value)
    || GITHUB_SPEC_PATTERN.test(value)
    || WINDOWS_TARBALL_PATTERN.test(value)
    || POSIX_TARBALL_PATTERN.test(value)
}

export function createDshPluginRunner(input: {
  readonly dshCliPath: string
  readonly profileName: string
  readonly profileRoot: string
  readonly cwd: string
  readonly timeoutMs?: number
}): PluginCommandRunner {
  return (action, target) => new Promise((resolve, reject) => {
    const env = { ...process.env }
    const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') ?? 'PATH'
    env[pathKey] = `${join(input.profileRoot, 'node_modules', '.bin')}${delimiter}${env[pathKey] ?? ''}`

    const child = spawn(process.execPath, [
      input.dshCliPath,
      'plugin',
      '--profile',
      input.profileName,
      action,
      target,
    ], {
      cwd: input.cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let output = ''
    child.stdout.on('data', chunk => { output = appendOutput(output, chunk) })
    child.stderr.on('data', chunk => { output = appendOutput(output, chunk) })
    child.once('error', reject)

    const timeout = setTimeout(() => child.kill(), input.timeoutMs ?? 120_000)
    child.once('close', code => {
      clearTimeout(timeout)
      resolve({ exitCode: code ?? 1, output: output.trim() })
    })
  })
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

export class PluginOperationService {
  private running = false

  constructor(
    private readonly runner: PluginCommandRunner,
    private readonly getInstalledNames: () => Promise<ReadonlySet<string>>,
    private readonly profileName: string,
  ) {}

  async run(request: PluginOperationRequest): Promise<PluginOperationResult> {
    if (this.running) throw new PluginOperationError('已有插件操作正在执行', 'busy')
    this.running = true
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
        restartRequired: result.exitCode === 0,
        finishedAt: new Date().toISOString(),
      }
    } finally {
      this.running = false
    }
  }
}
