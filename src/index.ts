import { homedir } from 'node:os'
import { join } from 'node:path'
import type { DshHostContext } from './context.js'
import { createDiagnosticReport } from './diagnostics.js'
import {
  createDiagnosticsHandler,
  createInventoryHandler,
  createOperationsHandler,
} from './http.js'
import { createPluginInventory, profileRoot } from './inventory.js'
import { createDshPluginRunner, PluginOperationService } from './operations.js'
import { DIAGNOSTICS_PATH, INVENTORY_PATH, OPERATIONS_PATH } from './shared.js'

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
  const root = profileRoot(dshHome, profileName)
  const getInventory = () => createPluginInventory({ dshHome, profileName })

  const diagnosticsHandler = createDiagnosticsHandler(async () => createDiagnosticReport({
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
  const inventoryHandler = createInventoryHandler(getInventory)
  const operationService = new PluginOperationService(
    createDshPluginRunner({
      dshCliPath: process.argv[1] ?? '',
      profileName,
      profileRoot: root,
      cwd: process.cwd(),
    }),
    async () => new Set((await getInventory()).plugins.map(plugin => plugin.name)),
    profileName,
  )
  const operationsHandler = createOperationsHandler(operationService)

  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: DIAGNOSTICS_PATH,
      handler: diagnosticsHandler,
    }),
    'dsh-plugin-manager: diagnostics route',
  )
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: INVENTORY_PATH,
      handler: inventoryHandler,
    }),
    'dsh-plugin-manager: inventory route',
  )
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'exact',
      path: OPERATIONS_PATH,
      handler: operationsHandler,
    }),
    'dsh-plugin-manager: operations route',
  )
}

export default { name, inject, apply }
