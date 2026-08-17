import { homedir } from 'node:os'
import { join } from 'node:path'
import type { DshHostContext } from './context.js'
import { createDiagnosticReport } from './diagnostics.js'
import { createDiagnosticsHandler } from './http.js'
import { DIAGNOSTICS_PATH } from './shared.js'

export const name = 'dsh-plugin-manager'
export const inject = ['webServer', 'loader']

export interface Config {
  readonly profileName?: string
}

function safeProfileName(value: unknown): string {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]+$/.test(value) ? value : 'web'
}

export function apply(ctx: DshHostContext, config: Config = {}): void {
  const profileName = safeProfileName(config.profileName)
  const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const handler = createDiagnosticsHandler(async () => createDiagnosticReport({
    dshHome,
    profileName,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    webServer: {
      host: ctx.webServer.host,
      port: ctx.webServer.port,
    },
    loaderEntries: [...ctx.loader.entries()],
  }))

  ctx.effect(
    () => ctx.webServer.register({ kind: 'exact', path: DIAGNOSTICS_PATH, handler }),
    'dsh-plugin-manager: diagnostics route',
  )
}

export default { name, inject, apply }
