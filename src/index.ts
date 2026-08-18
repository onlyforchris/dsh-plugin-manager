import { homedir } from "node:os";
import { join } from "node:path";
import { createCatalogProvider } from "./catalog.js";
import type { DshHostContext } from "./context.js";
import { createDiagnosticReport } from "./diagnostics.js";
import {
  createCatalogHandler,
  createDiagnosticsHandler,
  createInventoryHandler,
  createOperationsHandler,
  createUpdatesHandler,
} from "./http.js";
import { createPluginInventory, profileRoot } from "./inventory.js";
import { createDshPluginRunner, PluginOperationService } from "./operations.js";
import {
  CATALOG_PATH,
  DIAGNOSTICS_PATH,
  INVENTORY_PATH,
  OPERATIONS_PATH,
  UPDATES_PATH,
} from "./shared.js";
import {
  createNpmLatestVersionProvider,
  createPluginUpdates,
} from "./updates.js";
export const name = "dsh-plugin-manager";
export const inject = ["webServer", "loader"];
export interface Config {
  readonly profileName?: string;
  readonly catalogUrl?: string;
}
function profile(v: unknown) {
  return typeof v === "string" && /^[a-zA-Z0-9._-]+$/.test(v) ? v : "web";
}
function catalogUrl(v: unknown) {
  return typeof v === "string" &&
    /^https:\/\/raw\.githubusercontent\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+\/[a-z0-9._/-]+\.json$/i.test(
      v,
    )
    ? v
    : undefined;
}
export function apply(ctx: DshHostContext, config: Config = {}): void {
  const profileName = profile(config.profileName),
    dshHome = process.env.DSH_HOME ?? join(homedir(), ".dsh"),
    root = profileRoot(dshHome, profileName);
  const inventory = () => createPluginInventory({ dshHome, profileName }),
    latest = createNpmLatestVersionProvider(),
    updates = async () =>
      createPluginUpdates((await inventory()).plugins, latest);
  const customCatalogUrl = catalogUrl(config.catalogUrl),
    catalog = customCatalogUrl
      ? createCatalogProvider({ dshHome, remoteUrl: customCatalogUrl })
      : createCatalogProvider({ dshHome });
  const diagnostics = createDiagnosticsHandler(async () =>
    createDiagnosticReport({
      dshHome,
      profileName,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      webServer: { host: ctx.webServer.host, port: ctx.webServer.port },
      loaderEntries: [...ctx.loader.entries()],
    }),
  );
  const service = new PluginOperationService(
    createDshPluginRunner({
      dshCliPath: process.argv[1] ?? "",
      profileName,
      profileRoot: root,
      cwd: process.cwd(),
    }),
    async () => new Set((await inventory()).plugins.map((p) => p.name)),
    profileName,
  );
  for (const [path, handler, label] of [
    [DIAGNOSTICS_PATH, diagnostics, "diagnostics"],
    [INVENTORY_PATH, createInventoryHandler(inventory), "inventory"],
    [UPDATES_PATH, createUpdatesHandler(updates), "updates"],
    [CATALOG_PATH, createCatalogHandler(catalog), "catalog"],
    [OPERATIONS_PATH, createOperationsHandler(service), "operations"],
  ] as const)
    ctx.effect(
      () => ctx.webServer.register({ kind: "exact", path, handler }),
      `dsh-plugin-manager: ${label} route`,
    );
}
export default { name, inject, apply };
