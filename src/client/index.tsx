import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CATALOG_PATH,
  DIAGNOSTICS_PATH,
  INVENTORY_PATH,
  OPERATIONS_PATH,
  UPDATES_PATH,
  type DiagnosticReport,
  type ManagedPlugin,
  type PluginAction,
  type PluginCatalog,
  type PluginInventory,
  type PluginOperationResult,
  type PluginUpdateInfo,
  type PluginUpdatesReport,
} from '../shared.js'
import { CLIENT_STYLES } from './styles.js'

interface ClientSlots {
  inject(name: string, provider: () => unknown): unknown
  register(options: Record<string, unknown>, component: () => ReactNode): unknown
}

interface DshClientContext {
  readonly slots: ClientSlots
  effect(setup: () => void | (() => void), label?: string): void
}

interface ReadyPage {
  readonly status: 'ready'
  readonly report: DiagnosticReport
  readonly inventory: PluginInventory
  readonly updates: PluginUpdatesReport
  readonly catalog: PluginCatalog
}
type PageState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | ReadyPage

type OperationState =
  | { readonly status: 'idle' }
  | { readonly status: 'running'; readonly label: string }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'done'; readonly result: PluginOperationResult }

async function loadJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { method: 'GET', cache: 'no-store', credentials: 'same-origin', ...(signal ? { signal } : {}) })
  if (!response.ok) throw new Error(`request failed: ${response.status}`)
  return await response.json() as T
}

async function loadPage(signal: AbortSignal): Promise<Omit<ReadyPage, 'status'>> {
  const [report, inventory, updates, catalog] = await Promise.all([
    loadJson<DiagnosticReport>(DIAGNOSTICS_PATH, signal),
    loadJson<PluginInventory>(INVENTORY_PATH, signal),
    loadJson<PluginUpdatesReport>(UPDATES_PATH, signal),
    loadJson<PluginCatalog>(CATALOG_PATH, signal),
  ])
  return { report, inventory, updates, catalog }
}

async function sendOperation(action: PluginAction, target: string): Promise<PluginOperationResult> {
  const response = await fetch(OPERATIONS_PATH, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', 'x-dsh-plugin-manager': '1' },
    body: JSON.stringify({ action, target }),
  })
  const payload = await response.json() as PluginOperationResult | { readonly message?: string }
  if (!response.ok) throw new Error('message' in payload && payload.message ? payload.message : `操作失败：HTTP ${response.status}`)
  return payload as PluginOperationResult
}

function actionLabel(action: PluginAction, target: string): string {
  if (action === 'add') return `安装 ${target}`
  if (action === 'update') return `升级 ${target}`
  return `卸载 ${target}`
}

function PluginCard(props: {
  readonly plugin: ManagedPlugin
  readonly update: PluginUpdateInfo | undefined
  readonly disabled: boolean
  readonly onAction: (action: PluginAction, target: string) => void
}): ReactNode {
  const { plugin, update } = props
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
            {update?.state === 'available' ? <span className="dpm-update-badge">有新版本</span> : null}
          </div>
          <code className="dpm-spec">{plugin.spec}</code>
          {update ? <span className="dpm-update-copy" data-state={update.state}>{update.message}</span> : null}
        </div>
        <span className="dpm-health-label" data-health={plugin.health}>
          {plugin.health === 'healthy' ? '正常' : plugin.health === 'warning' ? '提醒' : '异常'}
        </span>
      </div>
      {plugin.issues.length > 0 ? (
        <ul className="dpm-issues">{plugin.issues.map(issue => <li key={issue.code} data-severity={issue.severity}>{issue.message}</li>)}</ul>
      ) : <p className="dpm-healthy-copy">Manifest、Bundle 注册和声明文件检查通过。</p>}
      {!plugin.manager ? (
        <div className="dpm-plugin-actions">
          <button type="button" disabled={props.disabled || !plugin.canUpdate} onClick={() => props.onAction('update', plugin.name)}>
            {update?.state === 'available' ? `升级到 ${update.latestVersion}` : '升级'}
          </button>
          <button className="dpm-danger" type="button" disabled={props.disabled || !plugin.canRemove} onClick={() => props.onAction('remove', plugin.name)}>卸载</button>
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
      value => { if (!controller.signal.aborted) setPage({ status: 'ready', ...value }) },
      () => { if (!controller.signal.aborted) setPage({ status: 'error', message: '无法读取插件清单、版本或目录状态。' }) },
    )
    return () => controller.abort()
  }, [request])

  const refresh = useCallback(() => setRequest(value => value + 1), [])
  const operating = operation.status === 'running'
  const healthSummary = useMemo(() => {
    if (page.status !== 'ready') return { healthy: 0, warning: 0, error: 0 }
    return page.inventory.plugins.reduce((summary, plugin) => ({ ...summary, [plugin.health]: summary[plugin.health] + 1 }), { healthy: 0, warning: 0, error: 0 })
  }, [page])

  const runOperation = useCallback(async (action: PluginAction, rawTarget: string) => {
    const target = rawTarget.trim()
    if (!target) {
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
      setOperation({ status: 'error', message: error instanceof Error ? error.message : '插件操作失败' })
    }
  }, [refresh])

  const updateMap = page.status === 'ready' ? new Map(page.updates.updates.map(item => [item.name, item])) : new Map<string, PluginUpdateInfo>()
  const installed = page.status === 'ready' ? new Set(page.inventory.plugins.map(item => item.name)) : new Set<string>()

  return (
    <section className="dpm-root" aria-busy={page.status === 'loading' || operating}>
      <header className="dpm-heading">
        <div><h3>插件管家</h3><p>管理当前 DSH Profile 的插件生命周期、结构健康和可用更新。</p></div>
        <button className="dpm-button" type="button" onClick={refresh} disabled={operating}>刷新</button>
      </header>

      <section className="dpm-panel">
        <div className="dpm-section-heading"><div><h4>安装插件</h4><p>支持 npm 包、GitHub 仓库地址和本地 .tgz 绝对路径。</p></div></div>
        <div className="dpm-install-row">
          <input aria-label="插件安装目标" value={installTarget} disabled={operating} onChange={event => setInstallTarget(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !operating) void runOperation('add', installTarget) }} placeholder="例如 @scope/plugin、https://github.com/owner/repo 或 D:\plugins\plugin.tgz" />
          <button className="dpm-primary" type="button" disabled={operating || !installTarget.trim()} onClick={() => void runOperation('add', installTarget)}>安装</button>
        </div>
      </section>

      {operation.status === 'running' ? <section className="dpm-operation" data-status="running"><strong>正在{operation.label}</strong><span>完成后会自动刷新清单。</span></section> : null}
      {operation.status === 'error' ? <section className="dpm-operation" data-status="error" role="alert"><strong>操作未完成</strong><span>{operation.message}</span></section> : null}
      {operation.status === 'done' ? (
        <section className="dpm-operation" data-status={operation.result.success ? 'success' : 'error'}>
          <strong>{operation.result.success ? 'Profile 已更新' : `命令失败（退出码 ${operation.result.exitCode}）`}</strong>
          <code>{operation.result.command}</code>
          {operation.result.output ? <pre>{operation.result.output}</pre> : null}
          {operation.result.restartRequired ? <p>请停止当前 DSH Web，再运行 <code>dsh web</code> 加载新插件代码。</p> : null}
        </section>
      ) : null}

      <section className="dpm-panel">
        <div className="dpm-section-heading">
          <div><h4>已安装插件</h4><p>{page.status === 'ready' ? `Profile：${page.inventory.profileName} · 版本数据来自 npm Registry` : '正在读取当前 Profile'}</p></div>
          {page.status === 'ready' ? <div className="dpm-health-summary"><span data-health="healthy">正常 {healthSummary.healthy}</span><span data-health="warning">提醒 {healthSummary.warning}</span><span data-health="error">异常 {healthSummary.error}</span></div> : null}
        </div>
        {page.status === 'loading' ? <p className="dpm-state">正在读取插件清单…</p> : null}
        {page.status === 'error' ? <p className="dpm-state dpm-error" role="alert">{page.message}</p> : null}
        {page.status === 'ready' ? <ul className="dpm-plugin-list">{page.inventory.plugins.map(plugin => <PluginCard key={plugin.name} plugin={plugin} update={updateMap.get(plugin.name)} disabled={operating} onAction={(action, target) => { void runOperation(action, target) }} />)}</ul> : null}
      </section>

      {page.status === 'ready' ? (
        <section className="dpm-panel">
          <div className="dpm-section-heading"><div><h4>可信来源目录</h4><p>只展示内置核验或由当前 Profile 管理员明确配置的来源。</p></div></div>
          <ul className="dpm-catalog-list">
            {page.catalog.entries.map(entry => (
              <li className="dpm-catalog-item" key={entry.name}>
                <div><strong>{entry.name}</strong><span className="dpm-kind">{entry.trust === 'builtin' ? '内置核验' : 'Profile 配置'}</span><p>{entry.description}</p><a href={entry.repository} target="_blank" rel="noreferrer">查看源码</a></div>
                <button type="button" disabled={operating || installed.has(entry.name)} onClick={() => void runOperation('add', entry.installSpec)}>{installed.has(entry.name) ? '已安装' : '安装'}</button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {page.status === 'ready' ? (
        <details className="dpm-diagnostics"><summary><span>运行环境自检</span><span className="dpm-summary-inline">通过 {page.report.summary.pass} · 提醒 {page.report.summary.warning} · 失败 {page.report.summary.fail}</span></summary>
          <ul className="dpm-check-list">{page.report.checks.map(item => <li className="dpm-check" key={item.id} data-status={item.status}><span className="dpm-dot" data-status={item.status} aria-hidden="true" /><span className="dpm-label">{item.label}</span><span className="dpm-message">{item.message}</span></li>)}</ul>
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
  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({ name: 'settings.plugins.tab', id: 'manager', order: 20, label: '插件管家' }, PluginManagerTab))
}

export default { name, inject, apply }