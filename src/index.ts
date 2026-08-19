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
  createOperationsProgressHandler,
  createRestartHandler,
  createUpdatesHandler,
} from "./http.js";
import { createPluginInventory, profileRoot } from "./inventory.js";
import {
  createDshPluginRunner,
  OperationProgressTracker,
  PluginOperationService,
} from "./operations.js";
import { createRestartHelper, DshRestartService } from "./restart.js";
import {
  CATALOG_PATH,
  DIAGNOSTICS_PATH,
  INVENTORY_PATH,
  OPERATIONS_PATH,
  OPERATIONS_PROGRESS_PATH,
  RESTART_PATH,
  UPDATES_PATH,
} from "./shared.js";
import {
  createNpmLatestVersionProvider,
  createPluginUpdates,
} from "./updates.js";
export const name = "dsh-plugin-manager";
export const inject = ["webServer", "loader", "appExit", "cmdlineArgs"];
export interface Config {
  readonly profileName?: string;
  readonly catalogUrl?: string;
}
function profile(v: unknown) {
  return typeof v === "string" && /^[a-zA-Z0-9._-]+$/.test(v) ? v : "web";
}
function catalogUrl(v: unknown) {
  return typeof v === "string" &&
    (/^https:\/\/raw\.githubusercontent\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+\/[a-z0-9._/-]+\.json$/i.test(
      v,
    ) ||
      /^https:\/\/cdn\.jsdelivr\.net\/gh\/[a-z0-9_.-]+\/[a-z0-9_.-]+@[a-z0-9._/-]+\/[a-z0-9._/-]+\.json$/i.test(
        v,
      ))
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
      ? createCatalogProvider({
          dshHome,
          remoteUrl: customCatalogUrl,
          mirrorUrl: null,
        })
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
  const dshCliPath = process.argv[1] ?? "";
  const progress = new OperationProgressTracker();
  const service = new PluginOperationService(
    createDshPluginRunner({
      profileRoot: root,
      cwd: process.cwd(),
      onOutput: (chunk) => progress.append(chunk),
    }),
    async () => new Set((await inventory()).plugins.map((p) => p.name)),
    profileName,
    progress,
  );
  const appArgs = ctx.get("cmdlineArgs")?.get();
  const restart = new DshRestartService(
    createRestartHelper({
      dshCliPath,
      profileName,
      cwd: process.cwd(),
      dshHome,
      host: ctx.webServer.host,
      port: ctx.webServer.port,
      ...(appArgs ? { appArgs } : {}),
    }),
    ctx.get("appExit"),
  );
  for (const [path, handler, label] of [
    [DIAGNOSTICS_PATH, diagnostics, "diagnostics"],
    [INVENTORY_PATH, createInventoryHandler(inventory), "inventory"],
    [UPDATES_PATH, createUpdatesHandler(updates), "updates"],
    [CATALOG_PATH, createCatalogHandler(catalog), "catalog"],
    [OPERATIONS_PATH, createOperationsHandler(service), "operations"],
    [
      OPERATIONS_PROGRESS_PATH,
      createOperationsProgressHandler(service),
      "operations-progress",
    ],
    [RESTART_PATH, createRestartHandler(restart), "restart"],
  ] as const)
    ctx.effect(
      () => ctx.webServer.register({ kind: "exact", path, handler }),
      `dsh-plugin-manager: ${label} route`,
    );
}
export default { name, inject, apply };
