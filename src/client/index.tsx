import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DIAGNOSTICS_PATH,
  INVENTORY_PATH,
  OPERATIONS_PATH,
  type DiagnosticReport,
  type ManagedPlugin,
  type PluginAction,
  type PluginInventory,
  type PluginOperationResult,
} from '../shared.js'
import { CLIENT_STYLES } from './styles.js'

interface ClientSlots {
  inject(
    name: string,
    provider: () => unknown,
  ): unknown
  register(options: Record<string, unknown>, component: () => ReactNode): unknown
}

interface DshClientContext {
  readonly slots: ClientSlots
  effect(setup: () => void | (() => void), label?: string): void
}

type PageState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
    readonly status: 'ready'
    readonly report: DiagnosticReport
    readonly inventory: PluginInventory
  }

type OperationState =
  | { readonly status: 'idle' }
  | { readonly status: 'running'; readonly label: string }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'done'; readonly result: PluginOperationResult }

async function loadJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    ...(signal === undefined ? {} : { signal }),
  })
  if (!response.ok) throw new Error(`request failed: ${response.status}`)
  return await response.json() as T
}

async function loadPage(signal: AbortSignal): Promise<{
  readonly report: DiagnosticReport
  readonly inventory: PluginInventory
}> {
  const [report, inventory] = await Promise.all([
    loadJson<DiagnosticReport>(DIAGNOSTICS_PATH, signal),
    loadJson<PluginInventory>(INVENTORY_PATH, signal),
  ])
  return { report, inventory }
}

async function sendOperation(
  action: PluginAction,
  target: string,
): Promise<PluginOperationResult> {
  const response = await fetch(OPERATIONS_PATH, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      'x-dsh-plugin-manager': '1',
    },
    body: JSON.stringify({ action, target }),
  })
  const payload = await response.json() as PluginOperationResult | { readonly message?: string }
  if (!response.ok) {
    throw new Error('message' in payload && payload.message ? payload.message : `操作失败：HTTP ${response.status}`)
  }
  return payload as PluginOperationResult
}

function actionLabel(action: PluginAction, target: string): string {
  if (action === 'add') return `安装 ${target}`
  if (action === 'update') return `升级 ${target}`
  return `卸载 ${target}`
}

function PluginCard(props: {
  readonly plugin: ManagedPlugin
  readonly disabled: boolean
  readonly onAction: (action: PluginAction, target: string) => void
}): ReactNode {
  const { plugin } = props
  return (
    <li className="dpm-plugin" data-health={plugin.health}>
      <div className="dpm-plugin-main">
        <span className="dpm-health-dot" data-health={plugin.health} aria-hidden="true" />
        <div className="dpm-plugin-copy">
          <div className="dpm-plugin-title">
            <strong>{plugin.name}</strong>
            {plugin.version ? <span className="dpm-version">v{plugin.version}</span> : null}
            {plugin.bundle ? <span className="dpm-kind">Bundle</span> : null}
            {plugin.client ? <span className="dpm-kind">Client</span> : null}
            {plugin.manager ? <span className="dpm-kind">管家自身</span> : null}
          </div>
          <code className="dpm-spec">{plugin.spec}</code>
        </div>
        <span className="dpm-health-label" data-health={plugin.health}>
          {plugin.health === 'healthy' ? '正常' : plugin.health === 'warning' ? '提醒' : '异常'}
        </span>
      </div>

      {plugin.issues.length > 0 ? (
        <ul className="dpm-issues">
          {plugin.issues.map(issue => (
            <li key={issue.code} data-severity={issue.severity}>{issue.message}</li>
          ))}
        </ul>
      ) : (
        <p className="dpm-healthy-copy">Manifest、Bundle 注册和声明文件检查通过。</p>
      )}

      {!plugin.manager ? (
        <div className="dpm-plugin-actions">
          <button
            type="button"
            disabled={props.disabled || !plugin.canUpdate}
            onClick={() => props.onAction('update', plugin.name)}
          >
            升级
          </button>
          <button
            className="dpm-danger"
            type="button"
            disabled={props.disabled || !plugin.canRemove}
            onClick={() => props.onAction('remove', plugin.name)}
          >
            卸载
          </button>
        </div>
      ) : null}
    </li>
  )
}

export function PluginManagerTab(): ReactNode {
  const [request, setRequest] = useState(0)
  const [page, setPage] = useState<PageState>({ status: 'loading' })
  const [installTarget, setInstallTarget] = useState('')
  const [operation, setOperation] = useState<OperationState>({ status: 'idle' })

  useEffect(() => {
    const controller = new AbortController()
    setPage({ status: 'loading' })
    void loadPage(controller.signal).then(
      value => {
        if (!controller.signal.aborted) setPage({ status: 'ready', ...value })
      },
      () => {
        if (!controller.signal.aborted) {
          setPage({ status: 'error', message: '无法读取插件清单或环境状态。' })
        }
      },
    )
    return () => controller.abort()
  }, [request])

  const refresh = useCallback(() => setRequest(value => value + 1), [])
  const operating = operation.status === 'running'
  const healthSummary = useMemo(() => {
    if (page.status !== 'ready') return { healthy: 0, warning: 0, error: 0 }
    return page.inventory.plugins.reduce((summary, plugin) => ({
      ...summary,
      [plugin.health]: summary[plugin.health] + 1,
    }), { healthy: 0, warning: 0, error: 0 })
  }, [page])

  const runOperation = useCallback(async (action: PluginAction, rawTarget: string) => {
    const target = rawTarget.trim()
    if (target.length === 0) {
      setOperation({ status: 'error', message: '请先输入要安装的插件包或本地 .tgz 路径。' })
      return
    }
    const label = actionLabel(action, target)
    if (!window.confirm(`确认${label}？\n\n插件管家将执行标准 dsh plugin 命令并修改当前 web Profile。`)) return

    setOperation({ status: 'running', label })
    try {
      const result = await sendOperation(action, target)
      setOperation({ status: 'done', result })
      if (result.success) {
        if (action === 'add') setInstallTarget('')
        refresh()
      }
    } catch (error) {
      setOperation({
        status: 'error',
        message: error instanceof Error ? error.message : '插件操作失败',
      })
    }
  }, [refresh])

  return (
    <section className="dpm-root" aria-busy={page.status === 'loading' || operating}>
      <header className="dpm-heading">
        <div>
          <h3>插件管家</h3>
          <p>管理当前 DSH Profile 的第三方插件，并检查 Manifest、Bundle 和 Client 声明。</p>
        </div>
        <button className="dpm-button" type="button" onClick={refresh} disabled={operating}>刷新</button>
      </header>

      <section className="dpm-panel">
        <div className="dpm-section-heading">
          <div>
            <h4>安装插件</h4>
            <p>支持 npm 包、GitHub 仓库地址和本地 .tgz 绝对路径。</p>
          </div>
        </div>
        <div className="dpm-install-row">
          <input
            aria-label="插件安装目标"
            value={installTarget}
            disabled={operating}
            onChange={event => setInstallTarget(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !operating) void runOperation('add', installTarget)
            }}
            placeholder="例如 @scope/plugin、https://github.com/owner/repo 或 D:\plugins\plugin.tgz"
          />
          <button
            className="dpm-primary"
            type="button"
            disabled={operating || installTarget.trim().length === 0}
            onClick={() => void runOperation('add', installTarget)}
          >
            安装
          </button>
        </div>
        <p className="dpm-help">为避免命令注入，本地路径当前不接受空格或 shell 特殊字符。</p>
      </section>

      {operation.status === 'running' ? (
        <section className="dpm-operation" data-status="running">
          <strong>正在{operation.label}</strong>
          <span>请保持 DSH Web 运行，完成后会自动刷新清单。</span>
        </section>
      ) : null}
      {operation.status === 'error' ? (
        <section className="dpm-operation" data-status="error" role="alert">
          <strong>操作未完成</strong>
          <span>{operation.message}</span>
        </section>
      ) : null}
      {operation.status === 'done' ? (
        <section className="dpm-operation" data-status={operation.result.success ? 'success' : 'error'}>
          <strong>{operation.result.success ? 'Profile 已更新' : `命令失败（退出码 ${operation.result.exitCode}）`}</strong>
          <code>{operation.result.command}</code>
          {operation.result.output ? <pre>{operation.result.output}</pre> : null}
          {operation.result.restartRequired ? (
            <p>变更已经写入 Profile。请停止当前 DSH Web，再运行 <code>dsh web</code> 加载新插件代码。</p>
          ) : null}
        </section>
      ) : null}

      <section className="dpm-panel">
        <div className="dpm-section-heading">
          <div>
            <h4>第三方插件</h4>
            <p>{page.status === 'ready' ? `Profile：${page.inventory.profileName}` : '正在读取当前 Profile'}</p>
          </div>
          {page.status === 'ready' ? (
            <div className="dpm-health-summary" aria-label="插件健康摘要">
              <span data-health="healthy">正常 {healthSummary.healthy}</span>
              <span data-health="warning">提醒 {healthSummary.warning}</span>
              <span data-health="error">异常 {healthSummary.error}</span>
            </div>
          ) : null}
        </div>

        {page.status === 'loading' ? <p className="dpm-state">正在读取插件清单…</p> : null}
        {page.status === 'error' ? <p className="dpm-state dpm-error" role="alert">{page.message}</p> : null}
        {page.status === 'ready' && page.inventory.plugins.length === 0 ? (
          <p className="dpm-empty">当前 Profile 没有第三方插件依赖。</p>
        ) : null}
        {page.status === 'ready' ? (
          <ul className="dpm-plugin-list">
            {page.inventory.plugins.map(plugin => (
              <PluginCard
                key={plugin.name}
                plugin={plugin}
                disabled={operating}
                onAction={(action, target) => { void runOperation(action, target) }}
              />
            ))}
          </ul>
        ) : null}
      </section>

      {page.status === 'ready' ? (
        <details className="dpm-diagnostics">
          <summary>
            <span>运行环境自检</span>
            <span className="dpm-summary-inline">
              通过 {page.report.summary.pass} · 提醒 {page.report.summary.warning} · 失败 {page.report.summary.fail}
            </span>
          </summary>
          <ul className="dpm-check-list">
            {page.report.checks.map(item => (
              <li className="dpm-check" key={item.id} data-status={item.status}>
                <span className="dpm-dot" data-status={item.status} aria-hidden="true" />
                <span className="dpm-label">{item.label}</span>
                <span className="dpm-message">{item.message}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}

export const name = 'dsh-plugin-manager-client'
export const inject = ['slots']

export function apply(ctx: DshClientContext): void {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-plugin-manager'
    style.textContent = CLIENT_STYLES
    document.head.append(style)
    return () => style.remove()
  }, 'dsh-plugin-manager: styles')

  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'manager',
    order: 20,
    label: '插件管家',
  }, PluginManagerTab))
}

export default { name, inject, apply }
