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
  | {
      readonly status: "running";
      readonly action: PluginAction;
      readonly target: string;
      readonly label: string;
    }
  | {
      readonly status: "error";
      readonly action: PluginAction;
      readonly target: string;
      readonly message: string;
    }
  | { readonly status: "done"; readonly result: PluginOperationResult };
type GuideNotice =
  | { readonly status: "success"; readonly message: string }
  | { readonly status: "error"; readonly message: string }
  | null;
type CatalogCardState =
  | "available"
  | "installing"
  | "installed"
  | "pending"
  | "error";

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
async function copyText(value: string) {
  if (!navigator.clipboard) throw Error("clipboard_unavailable");
  await navigator.clipboard.writeText(value);
}
function openSettings(label: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!button) return false;
  button.click();
  return true;
}
const trust = (s: PluginCatalogEntry["verificationStatus"]) =>
  s === "verified" ? "已验证" : s === "community" ? "社区插件" : "实验性";
function cardState(
  entry: PluginCatalogEntry,
  installed: boolean,
  op: Op,
): CatalogCardState {
  const matches =
    op.status === "running"
      ? op.target === entry.installSpec || op.target === entry.packageName
      : op.status === "error"
        ? op.target === entry.installSpec || op.target === entry.packageName
        : op.status === "done"
          ? op.result.target === entry.installSpec ||
            op.result.target === entry.packageName
          : false;
  if (op.status === "running" && op.action === "add" && matches)
    return "installing";
  if (
    op.status === "done" &&
    matches &&
    op.result.success &&
    op.result.restartRequired
  )
    return "pending";
  if (
    (op.status === "error" && op.action === "add" && matches) ||
    (op.status === "done" &&
      op.result.action === "add" &&
      matches &&
      !op.result.success)
  )
    return "error";
  return installed ? "installed" : "available";
}
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
            <li key={i.code} data-severity={i.severity}>
              {i.message}
            </li>
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
  entry,
  state,
  busy,
  install,
  launch,
}: {
  entry: PluginCatalogEntry;
  state: CatalogCardState;
  busy: boolean;
  install: (s: string) => void;
  launch: (e: PluginCatalogEntry) => void;
}) {
  const stateLabel =
      state === "installing"
        ? "安装中"
        : state === "pending"
          ? "待重启"
          : state === "installed"
            ? "已启用"
            : state === "error"
              ? "安装失败"
              : "未安装",
    installed = state === "installed",
    canLaunch = installed && entry.launch !== null,
    primaryLabel =
      state === "installing"
        ? "正在安装…"
        : state === "pending"
          ? "重启后生效"
          : installed
            ? (entry.launch?.label ?? "已安装")
            : state === "error"
              ? "重试安装"
              : "安装";
  return (
    <li className="dpm-recommend" data-state={state}>
      <div className="dpm-recommend-head">
        <div className="dpm-recommend-title">
          <span className="dpm-category">{entry.category}</span>
          <h5>{entry.name}</h5>
        </div>
        <div className="dpm-badges">
          <span className="dpm-trust" data-status={entry.verificationStatus}>
            {trust(entry.verificationStatus)}
          </span>
          <span className="dpm-install-status" data-state={state}>
            {stateLabel}
          </span>
        </div>
      </div>
      <p className="dpm-summary">{entry.summary}</p>
      <div className="dpm-why">
        <strong>为什么推荐</strong>
        <span>{entry.recommendation}</span>
      </div>
      <div className="dpm-first-use" id={"dpm-first-use-" + entry.id}>
        <strong>第一次怎么用</strong>
        <ol>
          {entry.firstUse.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="dpm-meta">
        <span>v{entry.version}</span>
        <span>DSH {entry.dshCompatibility}</span>
        <span>{entry.license}</span>
        <span>{entry.verifiedAt ? "验证 " + entry.verifiedAt : "尚未验证"}</span>
      </div>
      <details className="dpm-impact">
        <summary>权限与影响（{entry.permissions.length}）</summary>
        <ul>
          {entry.permissions.map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </details>
      <div className="dpm-recommend-actions">
        <a href={entry.repository} target="_blank" rel="noreferrer">
          查看源码
        </a>
        <button
          className="dpm-primary"
          data-state={state}
          aria-describedby={"dpm-first-use-" + entry.id}
          disabled={busy || state === "installing" || state === "pending" || (installed && !canLaunch)}
          onClick={() =>
            canLaunch ? launch(entry) : install(entry.installSpec)
          }
        >
          {primaryLabel}
        </button>
      </div>
    </li>
  );
}
export function PluginManagerTab(): ReactNode {
  const [rev, setRev] = useState(0),
    [page, setPage] = useState<Page>({ status: "loading" }),
    [target, setTarget] = useState(""),
    [op, setOp] = useState<Op>({ status: "idle" }),
    [guide, setGuide] = useState<GuideNotice>(null);
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
        setOp({
          status: "error",
          action,
          target: raw,
          message: "请输入 DSH 兼容插件地址。",
        });
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
      setGuide(null);
      setOp({ status: "running", action, target: t, label });
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
          action,
          target: t,
          message: e instanceof Error ? e.message : "操作失败",
        });
      }
    },
    [refresh],
  );
  const launch = useCallback(async (entry: PluginCatalogEntry) => {
    const action = entry.launch;
    if (!action) {
      setGuide({
        status: "error",
        message: "该插件没有快捷入口，请按“第一次怎么用”操作。",
      });
      return;
    }
    if (action.kind === "settings") {
      if (!openSettings(action.target))
        setGuide({
          status: "error",
          message:
            "没有找到“" + action.target + "”入口。请确认已重启 DSH 后再试。",
        });
      return;
    }
    try {
      await copyText(action.target);
      setGuide({
        status: "success",
        message: "示例提示已复制。关闭设置后粘贴到新会话即可试用。",
      });
    } catch {
      setGuide({
        status: "error",
        message: "浏览器不允许写入剪贴板，请按“第一次怎么用”手动输入。",
      });
    }
  }, []);
  const copyRestart = useCallback(async () => {
    try {
      await copyText("dsh web");
      setGuide({
        status: "success",
        message: "已复制 dsh web。请在命令行停止旧进程后重新运行。",
      });
    } catch {
      setGuide({
        status: "error",
        message: "请在命令行停止旧进程后运行：dsh web",
      });
    }
  }, []);
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
      plugins.reduce(
        (s, p) => ({ ...s, [p.health]: s[p.health] + 1 }),
        {
          healthy: 0,
          warning: 0,
          error: 0,
        },
      ),
    [plugins],
  );
  return (
    <section className="dpm-root" aria-busy={page.status === "loading" || busy}>
      <header className="dpm-heading">
        <div>
          <h3>插件推荐</h3>
          <p>从发现到第一次成功使用，再管理升级、卸载和结构健康。</p>
        </div>
        <button className="dpm-button" onClick={refresh} disabled={busy}>
          刷新目录
        </button>
      </header>
      {guide ? (
        <section
          className="dpm-notice"
          data-status={guide.status}
          role="status"
          aria-live="polite"
        >
          {guide.message}
        </section>
      ) : null}
      {op.status === "running" ? (
        <section
          className="dpm-operation"
          data-status="running"
          role="status"
          aria-live="polite"
        >
          正在{op.label}
        </section>
      ) : null}
      {op.status === "error" ? (
        <section className="dpm-operation" data-status="error" role="alert">
          <strong>操作失败</strong>
          <span>{op.message}</span>
        </section>
      ) : null}
      {op.status === "done" ? (
        <section
          className="dpm-operation"
          data-status={op.result.success ? "success" : "error"}
          role={op.result.success ? "status" : "alert"}
          aria-live="polite"
        >
          <strong>{op.result.success ? "Profile 已更新，等待重启" : "命令失败"}</strong>
          <code>{op.result.command}</code>
          {op.result.restartRequired ? (
            <div className="dpm-restart">
              <span>请在命令行重启 DSH，让插件真正加载。</span>
              <button className="dpm-button" onClick={() => void copyRestart()}>
                复制 dsh web
              </button>
            </div>
          ) : null}
          {!op.result.success && op.result.output ? (
            <details>
              <summary>查看命令输出</summary>
              <pre>{op.result.output}</pre>
            </details>
          ) : null}
        </section>
      ) : null}
      {page.status === "loading" ? (
        <p className="dpm-state">正在加载推荐目录…</p>
      ) : null}
      {page.status === "error" ? (
        <p className="dpm-error" role="alert">
          {page.message}
        </p>
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
              <ul className="dpm-recommend-list">
                {page.catalog.entries.map((entry) => (
                  <Recommended
                    key={entry.id}
                    entry={entry}
                    state={cardState(
                      entry,
                      installed.has(entry.packageName),
                      op,
                    )}
                    busy={busy}
                    install={(spec) => void run("add", spec)}
                    launch={(item) => void launch(item)}
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
          <details
            className="dpm-panel dpm-installed-section"
            open={summary.error > 0 || summary.warning > 0 ? true : undefined}
          >
            <summary className="dpm-installed-summary">
              <span>
                <strong>已安装插件</strong>
                <small>Profile：{page.inventory.profileName}</small>
              </span>
              <span className="dpm-health-summary">
                <span data-health="healthy">正常 {summary.healthy}</span>
                <span data-health="warning">提醒 {summary.warning}</span>
                <span data-health="error">异常 {summary.error}</span>
              </span>
            </summary>
            <div className="dpm-installed-body">
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
                  <p>从上方推荐中心安装后，会在这里进行升级、卸载和体检。</p>
                </div>
              )}
            </div>
          </details>
          <details className="dpm-advanced">
            <summary>高级安装</summary>
            <p>
              仅安装你信任的 DSH 兼容插件。支持 npm 固定版本、GitHub 仓库或本地
              .tgz。
            </p>
            <div className="dpm-install-row">
              <label htmlFor="dpm-install-target">插件安装地址</label>
              <div>
                <input
                  id="dpm-install-target"
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
                  <span className="dpm-dot" data-status={i.status} />
                  <span className="dpm-label">{i.label}</span>
                  <span className="dpm-message">{i.message}</span>
                </li>
              ))}
            </ul>
          </details>
        </>
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
