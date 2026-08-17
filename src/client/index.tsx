import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { DIAGNOSTICS_PATH, type DiagnosticReport } from '../shared.js'
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

type ViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly report: DiagnosticReport }

async function loadReport(signal: AbortSignal): Promise<DiagnosticReport> {
  const response = await fetch(DIAGNOSTICS_PATH, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    signal,
  })
  if (!response.ok) throw new Error(`diagnostics request failed: ${response.status}`)
  return await response.json() as DiagnosticReport
}

export function PluginDoctorTab(): ReactNode {
  const [request, setRequest] = useState(0)
  const [state, setState] = useState<ViewState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    void loadReport(controller.signal).then(
      report => { if (!controller.signal.aborted) setState({ status: 'ready', report }) },
      () => { if (!controller.signal.aborted) setState({ status: 'error' }) },
    )
    return () => controller.abort()
  }, [request])

  const refresh = useCallback(() => setRequest(value => value + 1), [])

  return (
    <section className="dpm-root" aria-busy={state.status === 'loading'}>
      <header className="dpm-heading">
        <div>
          <h3>插件医生</h3>
          <p>只读检查当前 DSH Profile、Bundle 和 Loader 状态。</p>
        </div>
        <button className="dpm-refresh" type="button" onClick={refresh}>重新检查</button>
      </header>

      {state.status === 'loading' ? <p className="dpm-state">正在检查当前环境…</p> : null}
      {state.status === 'error' ? <p className="dpm-state dpm-error" role="alert">诊断接口不可用，请检查插件 Host 端是否已加载。</p> : null}
      {state.status === 'ready' ? (
        <>
          <div className="dpm-summary" aria-label="诊断摘要">
            <span className="dpm-badge" data-status="pass">通过 {state.report.summary.pass}</span>
            <span className="dpm-badge" data-status="warning">提醒 {state.report.summary.warning}</span>
            <span className="dpm-badge" data-status="fail">失败 {state.report.summary.fail}</span>
          </div>
          <ul className="dpm-list">
            {state.report.checks.map(item => (
              <li className="dpm-check" key={item.id} data-status={item.status}>
                <span className="dpm-dot" data-status={item.status} aria-hidden="true" />
                <span className="dpm-label">{item.label}</span>
                <span className="dpm-message">{item.message}</span>
              </li>
            ))}
          </ul>
        </>
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
    id: 'doctor',
    order: 20,
    label: '插件医生',
  }, PluginDoctorTab))
}

export default { name, inject, apply }
