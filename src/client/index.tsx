import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  type PluginCatalogEntry,
  type PluginInventory,
  type PluginOperationResult,
  type PluginUpdateInfo,
  type PluginUpdatesReport,
} from "../shared.js";
import { CLIENT_STYLES } from "./styles.js";
interface Slots {
  inject(n: string, p: () => unknown): unknown;
  register(o: Record<string, unknown>, c: () => ReactNode): unknown;
}
interface Context {
  readonly slots: Slots;
  effect(s: () => void | (() => void), l?: string): void;
}
interface Ready {
  readonly status: "ready";
  readonly report: DiagnosticReport;
  readonly inventory: PluginInventory;
  readonly updates: PluginUpdatesReport;
  readonly catalog: PluginCatalog;
}
type Page =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | Ready;
type Op =
  | { readonly status: "idle" }
  | { readonly status: "running"; readonly label: string }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "done"; readonly result: PluginOperationResult };
async function get<T>(p: string, s: AbortSignal) {
  const r = await fetch(p, {
    cache: "no-store",
    credentials: "same-origin",
    signal: s,
  });
  if (!r.ok) throw Error(String(r.status));
  return (await r.json()) as T;
}
async function load(s: AbortSignal) {
  const [report, inventory, updates, catalog] = await Promise.all([
    get<DiagnosticReport>(DIAGNOSTICS_PATH, s),
    get<PluginInventory>(INVENTORY_PATH, s),
    get<PluginUpdatesReport>(UPDATES_PATH, s),
    get<PluginCatalog>(CATALOG_PATH, s),
  ]);
  return { report, inventory, updates, catalog };
}
async function operation(action: PluginAction, target: string) {
  const r = await fetch(OPERATIONS_PATH, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        "x-dsh-plugin-manager": "1",
      },
      body: JSON.stringify({ action, target }),
    }),
    p = (await r.json()) as PluginOperationResult | { message?: string };
  if (!r.ok) throw Error("message" in p && p.message ? p.message : "操作失败");
  return p as PluginOperationResult;
}
const trust = (s: PluginCatalogEntry["verificationStatus"]) =>
  s === "verified" ? "已验证" : s === "community" ? "社区插件" : "实验性";
function Installed({
  p,
  u,
  busy,
  run,
}: {
  p: ManagedPlugin;
  u: PluginUpdateInfo | undefined;
  busy: boolean;
  run: (a: PluginAction, t: string) => void;
}) {
  return (
    <li className="dpm-plugin" data-health={p.health}>
      <div className="dpm-plugin-main">
        <span className="dpm-health-dot" data-health={p.health} />
        <div className="dpm-plugin-copy">
          <div className="dpm-plugin-title">
            <strong>{p.name}</strong>
            {p.version ? (
              <span className="dpm-version">v{p.version}</span>
            ) : null}
            {p.bundle ? <span className="dpm-kind">Bundle</span> : null}
            {p.client ? <span className="dpm-kind">Client</span> : null}
            {u?.state === "available" ? (
              <span className="dpm-update-badge">
                可升级至 {u.latestVersion}
              </span>
            ) : null}
          </div>
          <code className="dpm-spec">{p.spec}</code>
          {u ? (
            <span className="dpm-update-copy" data-state={u.state}>
              {u.message}
            </span>
          ) : null}
        </div>
        <span className="dpm-health-label" data-health={p.health}>
          {p.health === "healthy"
            ? "正常"
            : p.health === "warning"
              ? "提醒"
              : "异常"}
        </span>
      </div>
      {p.issues.length ? (
        <ul className="dpm-issues">
          {p.issues.map((i) => (
            <li key={i.code}>{i.message}</li>
          ))}
        </ul>
      ) : (
        <p className="dpm-healthy-copy">结构检查通过。</p>
      )}
      <div className="dpm-plugin-actions">
        <button
          disabled={busy || !p.canUpdate}
          onClick={() => run("update", p.name)}
        >
          升级
        </button>
        <button
          className="dpm-danger"
          disabled={busy || !p.canRemove}
          onClick={() => run("remove", p.name)}
        >
          卸载
        </button>
      </div>
    </li>
  );
}
function Recommended({
  e,
  installed,
  busy,
  install,
}: {
  e: PluginCatalogEntry;
  installed: boolean;
  busy: boolean;
  install: (s: string) => void;
}) {
  return (
    <li className="dpm-recommend">
      <div className="dpm-recommend-head">
        <div>
          <span className="dpm-category">{e.category}</span>
          <h5>{e.name}</h5>
        </div>
        <span className="dpm-trust" data-status={e.verificationStatus}>
          {trust(e.verificationStatus)}
        </span>
      </div>
      <p>{e.summary}</p>
      <div className="dpm-why">
        <strong>为什么推荐</strong>
        <span>{e.recommendation}</span>
      </div>
      <dl>
        <div>
          <dt>版本</dt>
          <dd>{e.version}</dd>
        </div>
        <div>
          <dt>DSH</dt>
          <dd>{e.dshCompatibility}</dd>
        </div>
        <div>
          <dt>验证</dt>
          <dd>{e.verifiedAt ?? "尚未验证"}</dd>
        </div>
      </dl>
      <div className="dpm-recommend-actions">
        <a href={e.repository} target="_blank" rel="noreferrer">
          查看源码
        </a>
        <button
          className="dpm-primary"
          disabled={busy || installed}
          onClick={() => install(e.installSpec)}
        >
          {installed ? "已安装" : "安装"}
        </button>
      </div>
    </li>
  );
}
export function PluginManagerTab(): ReactNode {
  const [rev, setRev] = useState(0),
    [page, setPage] = useState<Page>({ status: "loading" }),
    [target, setTarget] = useState(""),
    [op, setOp] = useState<Op>({ status: "idle" });
  useEffect(() => {
    const c = new AbortController();
    setPage({ status: "loading" });
    void load(c.signal).then(
      (v) => {
        if (!c.signal.aborted) setPage({ status: "ready", ...v });
      },
      () => {
        if (!c.signal.aborted)
          setPage({
            status: "error",
            message: "无法读取插件目录或 Profile 状态。",
          });
      },
    );
    return () => c.abort();
  }, [rev]);
  const refresh = useCallback(() => setRev((v) => v + 1), []),
    busy = op.status === "running";
  const run = useCallback(
    async (action: PluginAction, raw: string) => {
      const t = raw.trim();
      if (!t) {
        setOp({ status: "error", message: "请输入 DSH 兼容插件地址。" });
        return;
      }
      const label =
        action === "add"
          ? "安装 " + t
          : action === "update"
            ? "升级 " + t
            : "卸载 " + t;
      if (
        !window.confirm(
          "确认" +
            label +
            "？\n\n将执行标准 dsh plugin 命令并修改 web Profile。",
        )
      )
        return;
      setOp({ status: "running", label });
      try {
        const result = await operation(action, t);
        setOp({ status: "done", result });
        if (result.success) {
          setTarget("");
          refresh();
        }
      } catch (e) {
        setOp({
          status: "error",
          message: e instanceof Error ? e.message : "操作失败",
        });
      }
    },
    [refresh],
  );
  const installed =
      page.status === "ready"
        ? new Set(page.inventory.plugins.map((p) => p.name))
        : new Set<string>(),
    updates =
      page.status === "ready"
        ? new Map(page.updates.updates.map((u) => [u.name, u]))
        : new Map<string, PluginUpdateInfo>(),
    plugins =
      page.status === "ready"
        ? page.inventory.plugins.filter((p) => !p.manager)
        : [],
    manager =
      page.status === "ready"
        ? page.inventory.plugins.find((p) => p.manager)
        : undefined;
  const summary = useMemo(
    () =>
      plugins.reduce((s, p) => ({ ...s, [p.health]: s[p.health] + 1 }), {
        healthy: 0,
        warning: 0,
        error: 0,
      }),
    [plugins],
  );
  return (
    <section className="dpm-root" aria-busy={page.status === "loading" || busy}>
      <header className="dpm-heading">
        <div>
          <h3>插件推荐</h3>
          <p>发现经过准入与兼容性标注的 DSH 插件，然后安装、升级和体检。</p>
        </div>
        <button onClick={refresh} disabled={busy}>
          刷新目录
        </button>
      </header>
      {page.status === "loading" ? (
        <p className="dpm-state">正在加载推荐目录…</p>
      ) : null}
      {page.status === "error" ? (
        <p className="dpm-error">{page.message}</p>
      ) : null}
      {page.status === "ready" ? (
        <>
          <section className="dpm-panel">
            <div className="dpm-section-heading">
              <div>
                <h4>推荐插件</h4>
                <p>
                  {page.catalog.message} · 来源：
                  {page.catalog.source === "remote"
                    ? "远程目录"
                    : page.catalog.source === "cache"
                      ? "本地缓存"
                      : "内置目录"}
                  {page.catalog.stale ? "（已过期）" : ""}
                </p>
              </div>
            </div>
            {page.catalog.entries.length ? (
              <ul className="dpm-recommend-grid">
                {page.catalog.entries.map((e) => (
                  <Recommended
                    key={e.id}
                    e={e}
                    installed={installed.has(e.packageName)}
                    busy={busy}
                    install={(s) => void run("add", s)}
                  />
                ))}
              </ul>
            ) : (
              <div className="dpm-empty">
                <strong>首批推荐插件正在验证</strong>
                <p>
                  目录不会用普通 npm 包凑数。完成标准 CLI 安装、DSH
                  启动和结构体检后才会出现在这里。
                </p>
              </div>
            )}
          </section>
          <section className="dpm-panel">
            <div className="dpm-section-heading">
              <div>
                <h4>已安装插件</h4>
                <p>Profile：{page.inventory.profileName}</p>
              </div>
              <div className="dpm-health-summary">
                <span data-health="healthy">正常 {summary.healthy}</span>
                <span data-health="warning">提醒 {summary.warning}</span>
                <span data-health="error">异常 {summary.error}</span>
              </div>
            </div>
            {plugins.length ? (
              <ul className="dpm-plugin-list">
                {plugins.map((p) => (
                  <Installed
                    key={p.name}
                    p={p}
                    u={updates.get(p.name)}
                    busy={busy}
                    run={(a, t) => void run(a, t)}
                  />
                ))}
              </ul>
            ) : (
              <div className="dpm-empty">
                <strong>还没有业务插件</strong>
                <p>从上方推荐中心安装插件后，会在这里进行升级、卸载和体检。</p>
              </div>
            )}
          </section>
          <details className="dpm-advanced">
            <summary>高级安装</summary>
            <p>
              仅安装你信任的 DSH 兼容插件。支持 npm 固定版本、GitHub 仓库或本地
              .tgz。
            </p>
            <div className="dpm-install-row">
              <input
                aria-label="DSH 兼容插件安装地址"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="例如 @scope/plugin@1.2.3 或 D:\plugins\plugin.tgz"
              />
              <button
                className="dpm-primary"
                disabled={busy || !target.trim()}
                onClick={() => void run("add", target)}
              >
                安装
              </button>
            </div>
          </details>
          {manager ? (
            <details className="dpm-about">
              <summary>关于插件管家</summary>
              <p>
                {manager.name} v{manager.version} ·{" "}
                {manager.health === "healthy" ? "运行正常" : "需要检查"}
              </p>
            </details>
          ) : null}
          <details className="dpm-diagnostics">
            <summary>
              <span>运行环境自检</span>
              <span>
                通过 {page.report.summary.pass} · 提醒{" "}
                {page.report.summary.warning} · 失败 {page.report.summary.fail}
              </span>
            </summary>
            <ul className="dpm-check-list">
              {page.report.checks.map((i) => (
                <li className="dpm-check" key={i.id}>
                  <span className="dpm-label">{i.label}</span>
                  <span className="dpm-message">{i.message}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
      ) : null}
      {op.status === "running" ? (
        <section className="dpm-operation" data-status="running">
          正在{op.label}
        </section>
      ) : null}
      {op.status === "error" ? (
        <section className="dpm-operation" data-status="error">
          {op.message}
        </section>
      ) : null}
      {op.status === "done" ? (
        <section
          className="dpm-operation"
          data-status={op.result.success ? "success" : "error"}
        >
          <strong>{op.result.success ? "Profile 已更新" : "命令失败"}</strong>
          <code>{op.result.command}</code>
          {op.result.restartRequired ? (
            <p>
              请重启 <code>dsh web</code> 加载变更。
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
export const name = "dsh-plugin-manager-client",
  inject = ["slots"];
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const s = document.createElement("style");
    s.dataset.plugin = "dsh-plugin-manager";
    s.textContent = CLIENT_STYLES;
    document.head.append(s);
    return () => s.remove();
  }, "dsh-plugin-manager: styles");
  ctx.slots.inject("settings.plugins.tab", () =>
    ctx.slots.register(
      {
        name: "settings.plugins.tab",
        id: "manager",
        order: 20,
        label: "插件推荐",
      },
      PluginManagerTab,
    ),
  );
}
export default { name, inject, apply };
