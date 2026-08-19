export const PACKAGE_NAME = "dsh-plugin-manager";
export const MANAGER_VERSION = "0.9.0";
export const DIAGNOSTICS_PATH = "/dsh-plugin-manager/api/diagnostics";
export const INVENTORY_PATH = "/dsh-plugin-manager/api/plugins";
export const OPERATIONS_PATH = "/dsh-plugin-manager/api/operations";
export const OPERATIONS_PROGRESS_PATH =
  "/dsh-plugin-manager/api/operations/progress";
export const RESTART_PATH = "/dsh-plugin-manager/api/restart";
export const UPDATES_PATH = "/dsh-plugin-manager/api/updates";
export const CATALOG_PATH = "/dsh-plugin-manager/api/catalog";
/** 操作进行中的实时输出快照（供页面轮询渲染进度）。 */
export interface OperationProgress {
  readonly running: boolean;
  readonly action: PluginAction | null;
  readonly target: string | null;
  readonly output: string;
  readonly finishedAt: string | null;
}
export type DiagnosticStatus = "pass" | "warning" | "fail";
export interface DiagnosticCheck {
  readonly id: string;
  readonly label: string;
  readonly status: DiagnosticStatus;
  readonly message: string;
}
export interface DiagnosticSummary {
  readonly pass: number;
  readonly warning: number;
  readonly fail: number;
}
export interface DiagnosticReport {
  readonly schemaVersion: 1;
  readonly managerVersion: string;
  readonly generatedAt: string;
  readonly profileName: string;
  readonly summary: DiagnosticSummary;
  readonly checks: readonly DiagnosticCheck[];
}
export type PluginHealthStatus = "healthy" | "warning" | "error";
export interface PluginHealthIssue {
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly message: string;
}
export interface ManagedPlugin {
  readonly name: string;
  readonly spec: string;
  readonly version: string | null;
  readonly bundle: boolean;
  readonly client: boolean;
  readonly manager: boolean;
  readonly health: PluginHealthStatus;
  readonly issues: readonly PluginHealthIssue[];
  readonly canUpdate: boolean;
  readonly canRemove: boolean;
}
export interface PluginInventory {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly profileName: string;
  readonly plugins: readonly ManagedPlugin[];
}
export type PluginUpdateState = "available" | "current" | "unavailable";
export interface PluginUpdateInfo {
  readonly name: string;
  readonly installedVersion: string | null;
  readonly latestVersion: string | null;
  readonly state: PluginUpdateState;
  readonly message: string;
}
export interface PluginUpdatesReport {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly registry: "https://registry.npmjs.org";
  readonly updates: readonly PluginUpdateInfo[];
}
export type CatalogVerificationStatus =
  | "verified"
  | "community"
  | "experimental";
export type CatalogSource = "remote" | "cache" | "builtin";
export type CatalogLaunchKind = "settings" | "copy-prompt";
export interface CatalogLaunchAction {
  readonly kind: CatalogLaunchKind;
  readonly label: string;
  readonly target: string;
}
export interface PluginCatalogEntry {
  readonly id: string;
  readonly name: string;
  readonly packageName: string;
  readonly summary: string;
  readonly category: string;
  readonly repository: string;
  readonly installSpec: string;
  readonly version: string;
  readonly dshCompatibility: string;
  readonly verificationStatus: CatalogVerificationStatus;
  readonly verifiedWithDsh: string | null;
  readonly verifiedAt: string | null;
  readonly maintainer: string;
  readonly license: string;
  readonly recommendation: string;
  readonly permissions: readonly string[];
  readonly firstUse: readonly string[];
  readonly launch: CatalogLaunchAction | null;
}
export interface PluginRegistryDocument {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly entries: readonly PluginCatalogEntry[];
}
export interface PluginCatalog {
  readonly schemaVersion: 2;
  readonly generatedAt: string;
  readonly source: CatalogSource;
  readonly sourceUrl: string | null;
  readonly fetchedAt: string | null;
  readonly stale: boolean;
  readonly message: string;
  readonly entries: readonly PluginCatalogEntry[];
}
export type PluginAction = "add" | "update" | "remove";
export interface PluginOperationRequest {
  readonly action: PluginAction;
  readonly target: string;
}
export interface PluginOperationResult {
  readonly schemaVersion: 1;
  readonly action: PluginAction;
  readonly target: string;
  readonly success: boolean;
  readonly exitCode: number;
  readonly command: string;
  readonly output: string;
  readonly restartRequired: boolean;
  readonly finishedAt: string;
}
