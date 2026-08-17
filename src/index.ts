import { homedir } from 'node:os'
import { join } from 'node:path'
import { createPluginCatalog } from './catalog.js'
import type { DshHostContext } from './context.js'
import { createDiagnosticReport } from './diagnostics.js'
import {
  createCatalogHandler,
  createDiagnosticsHandler,
  createInventoryHandler,
  createOperationsHandler,
  createUpdatesHandler,
} from './http.js'
import { createPluginInventory, profileRoot } from './inventory.js'
import { createDshPluginRunner, PluginOperationService } from './operations.js'
import {
  CATALOG_PATH,
  DIAGNOSTICS_PATH,
  INVENTORY_PATH,
  OPERATIONS_PATH,
  UPDATES_PATH,
  type PluginCatalogEntry,
} from './shared.js'
import { createNpmLatestVersionProvider, createPluginUpdates } from './updates.js'

export const name = 'dsh-plugin-manager'
export const inject = ['webServer', 'loader']

export interface Config {
  readonly profileName?: string
  readonly catalog?: readonly Omit<PluginCatalogEntry, 'trust'>[]
}

function safeProfileName(value: unknown): string {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]+$/.test(value) ? value : 'web'
}

export function apply(ctx: DshHostContext, config: Config = {}): void {
  const profileName = safeProfileName(config.profileName)
  const dshHome = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  const root = profileRoot(dshHome, profileName)
  const getInventory = () => createPluginInventory({ dshHome, profileName })
  const latestVersion = createNpmLatestVersionProvider()
  const getUpdates = async () => createPluginUpdates((await getInventory()).plugins, latestVersion)
  const getCatalog = async () => createPluginCatalog(
    (config.catalog ?? []).map(entry => ({ ...entry, trust: 'profile' })),
  )

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
  const updatesHandler = createUpdatesHandler(getUpdates)
  const catalogHandler = createCatalogHandler(getCatalog)
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

  for (const [path, handler, label] of [
    [DIAGNOSTICS_PATH, diagnosticsHandler, 'diagnostics'],
    [INVENTORY_PATH, inventoryHandler, 'inventory'],
    [UPDATES_PATH, updatesHandler, 'updates'],
    [CATALOG_PATH, catalogHandler, 'catalog'],
    [OPERATIONS_PATH, operationsHandler, 'operations'],
  ] as const) {
    ctx.effect(
      () => ctx.webServer.register({ kind: 'exact', path, handler }),
      `dsh-plugin-manager: ${label} route`,
    )
  }
}

export default { name, inject, apply }