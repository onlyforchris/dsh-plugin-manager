import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  CATALOG_PATH,
  DIAGNOSTICS_PATH,
  INVENTORY_PATH,
  OPERATIONS_PATH,
  RESTART_PATH,
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
  | {
      readonly status: "success" | "warning" | "error";
      readonly message: string;
      readonly actionLabel?: string;
      readonly actionTarget?: string;
    }
  | null;
type CatalogCardState =
  | "available"
  | "installing"
  | "installed"
  | "unavailable"
  | "pending"
  | "error";
interface Confirmation {
  readonly action: PluginAction;
  readonly target: string;
  readonly displayName: string;
  readonly entry?: PluginCatalogEntry;
  readonly returnFocusKey?: string;
}
type RestartState =
  | { readonly status: "idle" }
  | { readonly status: "restarting"; readonly action: PluginAction }
  | { readonly status: "failed"; readonly message: string };

async function get<T>(path: string, signal: AbortSignal) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) throw Error(String(response.status));
  return (await response.json()) as T;
}
async function load(signal: AbortSignal) {
  const [report, inventory, updates, catalog] = await Promise.all([
    get<DiagnosticReport>(DIAGNOSTICS_PATH, signal),
    get<PluginInventory>(INVENTORY_PATH, signal),
    get<PluginUpdatesReport>(UPDATES_PATH, signal),
    get<PluginCatalog>(CATALOG_PATH, signal),
  ]);
  return { report, inventory, updates, catalog };
}
async function operation(action: PluginAction, target: string) {
  const response = await fetch(OPERATIONS_PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      "x-dsh-plugin-manager": "1",
    },
    body: JSON.stringify({ action, target }),
  });
  const payload = (await response.json()) as
    | PluginOperationResult
    | { message?: string };
  if (!response.ok)
    throw Error(
      "message" in payload && payload.message ? payload.message : "操作失败",
    );
  return payload as PluginOperationResult;
}
async function restartDsh() {
  const response = await fetch(RESTART_PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: { "x-dsh-plugin-manager": "1" },
  });
  const payload = (await response.json()) as {
    accepted?: boolean;
    message?: string;
  };
  if (!response.ok || payload.accepted !== true)
    throw Error(payload.message ?? "无法安排 DSH 自动重启");
}
const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
async function waitForRestart() {
  let sawOffline = false;
  const deadline = Date.now() + 45_000;
  await delay(250);
  while (Date.now() < deadline) {
    try {
      const response = await fetch(DIAGNOSTICS_PATH, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (response.ok && sawOffline) {
        window.location.reload();
        return;
      }
    } catch {
      sawOffline = true;
    }
    await delay(250);
  }
  throw Error("DSH 重启超时，请检查重启日志后重试");
}
async function copyText(value: string) {
  if (!navigator.clipboard) throw Error("clipboard_unavailable");
  await navigator.clipboard.writeText(value);
}
function findControl(label: string) {
  const normalized = label.trim();
  return [
    ...document.querySelectorAll<HTMLElement>(
      "button, [role='button'], [role='tab']",
    ),
  ].find(
    (item) =>
      item.textContent?.trim() === normalized ||
      item.getAttribute("aria-label")?.trim() === normalized,
  );
}
function openControl(label: string) {
  const control = findControl(label);
  if (!control) return false;
  control.click();
  return true;
}
function launchTargetAvailable(entry: PluginCatalogEntry) {
  return entry.launch?.kind !== "settings" || Boolean(findControl(entry.launch.target));
}
const trust = (status: PluginCatalogEntry["verificationStatus"]) =>
  status === "verified"
    ? "已验证"
    : status === "community"
      ? "社区插件"
      : "实验性";
const actionVerb = (action: PluginAction) =>
  action === "add" ? "安装" : action === "update" ? "升级" : "卸载";
function cardState(
  entry: PluginCatalogEntry,
  installed: boolean,
  op: Op,
  launchReady = true,
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
  if (installed && !launchReady) return "unavailable";
  return installed ? "installed" : "available";
}

function ConfirmationDialog({
  confirmation,
  profileName,
  onCancel,
  onConfirm,
}: {
  confirmation: Confirmation;
  profileName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const returnFocusKey = confirmation.returnFocusKey;
    const frame = requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<HTMLButtonElement>("[data-confirm]")
        ?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      requestAnimationFrame(() => {
        const target = returnFocusKey
          ? [...document.querySelectorAll<HTMLElement>("[data-dpm-focus]")].find(
              (element) => element.dataset.dpmFocus === returnFocusKey,
            )
          : previous;
        target?.focus();
      });
    };
  }, []);
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], summary, input:not([disabled])",
      ) ?? []),
    ];
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const destructive = confirmation.action === "remove";
  return (
    <div
      className="dpm-dialog-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="dpm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dpm-dialog-title"
        onKeyDown={handleKeyDown}
      >
        <div className="dpm-dialog-head">
          <div>
            <span className="dpm-dialog-eyebrow">
              {actionVerb(confirmation.action)}到 Profile · {profileName}
            </span>
            <h4 id="dpm-dialog-title">
              {actionVerb(confirmation.action)} {confirmation.displayName}
            </h4>
          </div>
          <button
            className="dpm-dialog-close"
            aria-label="取消并关闭"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        <p className="dpm-dialog-intro">
          管家将执行标准 DSH 插件命令。成功后自动安全重启 DSH，页面会自行恢复。
        </p>
        {confirmation.entry ? (
          <div className="dpm-dialog-facts">
            <span>
              <small>版本</small>
              <strong>v{confirmation.entry.version}</strong>
            </span>
            <span>
              <small>可信状态</small>
              <strong>{trust(confirmation.entry.verificationStatus)}</strong>
            </span>
            <span>
              <small>兼容范围</small>
              <strong>{confirmation.entry.dshCompatibility}</strong>
            </span>
          </div>
        ) : null}
        <div className="dpm-command-preview">
          <span>安装来源</span>
          <code>{confirmation.target}</code>
        </div>
        {confirmation.entry?.permissions.length ? (
          <details className="dpm-dialog-impact">
            <summary>
              安装后可能使用的权限（{confirmation.entry.permissions.length}）
            </summary>
            <ul>
              {confirmation.entry.permissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </details>
        ) : null}
        {confirmation.entry?.verificationStatus === "experimental" ? (
          <p className="dpm-dialog-warning">
            这是实验性插件。建议先确认来源与影响范围，再安装到常用 Profile。
          </p>
        ) : null}
        <div className="dpm-dialog-actions">
          <button className="dpm-button" onClick={onCancel}>
            取消
          </button>
          <button
            data-confirm
            className={destructive ? "dpm-confirm-danger" : "dpm-primary"}
            onClick={onConfirm}
          >
            {destructive
              ? "确认卸载并重启"
              : actionVerb(confirmation.action) + "并重启"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RestartOverlay({ action }: { action: PluginAction }) {
  return (
    <div className="dpm-restarting-layer" role="status" aria-live="assertive">
      <div className="dpm-restarting-card">
        <span className="dpm-spinner" aria-hidden="true" />
        <div>
          <strong>{actionVerb(action)}已完成，正在重启 DSH</strong>
          <p>无需执行命令。服务恢复后本页面会自动刷新。</p>
        </div>
      </div>
    </div>
  );
}

function Installed({
  plugin,
  update,
  busy,
  run,
}: {
  plugin: ManagedPlugin;
  update: PluginUpdateInfo | undefined;
  busy: boolean;
  run: (action: PluginAction, target: string, displayName: string) => void;
}) {
  return (
    <li className="dpm-plugin" data-health={plugin.health}>
      <div className="dpm-plugin-main">
        <span className="dpm-health-dot" data-health={plugin.health} />
        <div className="dpm-plugin-copy">
          <div className="dpm-plugin-title">
            <strong>{plugin.name}</strong>
            {plugin.version ? (
              <span className="dpm-version">v{plugin.version}</span>
            ) : null}
            {plugin.bundle ? <span className="dpm-kind">Bundle</span> : null}
            {plugin.client ? <span className="dpm-kind">Client</span> : null}
            {update?.state === "available" ? (
              <span className="dpm-update-badge">
                可升级至 {update.latestVersion}
              </span>
            ) : null}
          </div>
          <code className="dpm-spec">{plugin.spec}</code>
          {update ? (
            <span className="dpm-update-copy" data-state={update.state}>
              {update.message}
            </span>
          ) : null}
        </div>
        <span className="dpm-health-label" data-health={plugin.health}>
          {plugin.health === "healthy"
            ? "正常"
            : plugin.health === "warning"
              ? "提醒"
              : "异常"}
        </span>
      </div>
      {plugin.issues.length ? (
        <ul className="dpm-issues">
          {plugin.issues.map((issue) => (
            <li key={issue.code} data-severity={issue.severity}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="dpm-healthy-copy">结构检查通过。</p>
      )}
      <div className="dpm-plugin-actions">
        <button
          data-dpm-focus={"update-" + plugin.name}
          disabled={busy || !plugin.canUpdate}
          onClick={() => run("update", plugin.name, plugin.name)}
        >
          升级
        </button>
        <button
          className="dpm-danger"
          data-dpm-focus={"remove-" + plugin.name}
          disabled={busy || !plugin.canRemove}
          onClick={() => run("remove", plugin.name, plugin.name)}
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
  install: (entry: PluginCatalogEntry) => void;
  launch: (entry: PluginCatalogEntry) => void;
}) {
  const stateLabel =
      state === "installing"
        ? "安装中"
        : state === "pending"
          ? "准备重启"
          : state === "installed"
            ? entry.launch
              ? "已启用"
              : "已安装"
            : state === "unavailable"
              ? "入口未加载"
              : state === "error"
                ? "安装失败"
                : "未安装",
    installed = state === "installed" || state === "unavailable",
    canLaunch = installed && entry.launch !== null,
    primaryLabel =
      state === "installing"
        ? "正在安装…"
        : state === "pending"
          ? "正在完成…"
          : state === "unavailable"
            ? "查看处理办法"
            : installed
              ? (entry.launch?.label ?? "已安装")
              : state === "error"
                ? "重试安装"
                : "安装并重启";
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
          data-dpm-focus={"catalog-" + entry.id}
          data-state={state}
          aria-describedby={"dpm-first-use-" + entry.id}
          disabled={
            busy ||
            state === "installing" ||
            state === "pending" ||
            (installed && !canLaunch)
          }
          onClick={() => (canLaunch ? launch(entry) : install(entry))}
        >
          {primaryLabel}
        </button>
      </div>
    </li>
  );
}

export function PluginManagerTab(): ReactNode {
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState<Page>({ status: "loading" });
  const [target, setTarget] = useState("");
  const [op, setOp] = useState<Op>({ status: "idle" });
  const [guide, setGuide] = useState<GuideNotice>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [restart, setRestart] = useState<RestartState>({ status: "idle" });

  useEffect(() => {
    const controller = new AbortController();
    setPage({ status: "loading" });
    void load(controller.signal).then(
      (value) => {
        if (!controller.signal.aborted) setPage({ status: "ready", ...value });
      },
      () => {
        if (!controller.signal.aborted)
          setPage({
            status: "error",
            message: "无法读取插件目录或 Profile 状态。",
          });
      },
    );
    return () => controller.abort();
  }, [revision]);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const busy =
    op.status === "running" || restart.status === "restarting";

  const requestOperation = useCallback(
    (
      action: PluginAction,
      raw: string,
      displayName?: string,
      entry?: PluginCatalogEntry,
    ) => {
      const value = raw.trim();
      if (!value) {
        setOp({
          status: "error",
          action,
          target: raw,
          message: "请输入 DSH 兼容插件地址。",
        });
        return;
      }
      setConfirmation({
        action,
        target: value,
        displayName: displayName ?? value,
        ...(entry ? { entry } : {}),
        returnFocusKey: entry
          ? "catalog-" + entry.id
          : action === "add"
            ? "advanced-add"
            : action + "-" + value,
      });
    },
    [],
  );

  const execute = useCallback(
    async (request: Confirmation) => {
      setConfirmation(null);
      setGuide(null);
      const label = actionVerb(request.action) + " " + request.displayName;
      setOp({
        status: "running",
        action: request.action,
        target: request.target,
        label,
      });
      try {
        const result = await operation(request.action, request.target);
        setOp({ status: "done", result });
        if (!result.success) return;
        setTarget("");
        if (!result.restartRequired) {
          refresh();
          return;
        }
        setRestart({ status: "restarting", action: request.action });
        try {
          await restartDsh();
          await waitForRestart();
        } catch (error) {
          setRestart({
            status: "failed",
            message:
              error instanceof Error ? error.message : "DSH 自动重启失败",
          });
          refresh();
        }
      } catch (error) {
        setOp({
          status: "error",
          action: request.action,
          target: request.target,
          message: error instanceof Error ? error.message : "操作失败",
        });
      }
    },
    [refresh],
  );

  const launch = useCallback(async (entry: PluginCatalogEntry) => {
    const action = entry.launch;
    if (!action) {
      setGuide({
        status: "warning",
        message: "该插件没有快捷入口，请按“第一次怎么用”操作。",
      });
      return;
    }
    if (action.kind === "settings") {
      if (!openControl(action.target))
        setGuide({
          status: "warning",
          message:
            entry.name +
            "已经安装，但当前 DSH 没有注册“" +
            action.target +
            "”入口。它可能尚未兼容当前 DSH 版本，或客户端部分加载失败。",
          actionLabel: "打开插件列表",
          actionTarget: "插件列表",
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
        ? new Set(page.inventory.plugins.map((plugin) => plugin.name))
        : new Set<string>(),
    updates =
      page.status === "ready"
        ? new Map(page.updates.updates.map((update) => [update.name, update]))
        : new Map<string, PluginUpdateInfo>(),
    plugins =
      page.status === "ready"
        ? page.inventory.plugins.filter((plugin) => !plugin.manager)
        : [],
    manager =
      page.status === "ready"
        ? page.inventory.plugins.find((plugin) => plugin.manager)
        : undefined;
  const summary = useMemo(
    () =>
      plugins.reduce(
        (current, plugin) => ({
          ...current,
          [plugin.health]: current[plugin.health] + 1,
        }),
        { healthy: 0, warning: 0, error: 0 },
      ),
    [plugins],
  );

  return (
    <section className="dpm-root" aria-busy={page.status === "loading" || busy}>
      {confirmation && page.status === "ready" ? (
        <ConfirmationDialog
          confirmation={confirmation}
          profileName={page.inventory.profileName}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void execute(confirmation)}
        />
      ) : null}
      {restart.status === "restarting" ? (
        <RestartOverlay action={restart.action} />
      ) : null}
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
          role={guide.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span>{guide.message}</span>
          {guide.actionLabel && guide.actionTarget ? (
            <button
              className="dpm-button"
              onClick={() => openControl(guide.actionTarget ?? "")}
            >
              {guide.actionLabel}
            </button>
          ) : null}
        </section>
      ) : null}
      {restart.status === "failed" ? (
        <section className="dpm-operation" data-status="error" role="alert">
          <strong>插件已更新，但自动重启没有完成</strong>
          <span>{restart.message}</span>
          <button className="dpm-button" onClick={() => void copyRestart()}>
            复制备用重启命令
          </button>
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
      {op.status === "done" &&
      (!op.result.success || restart.status === "failed") ? (
        <section
          className="dpm-operation"
          data-status={op.result.success ? "success" : "error"}
          role={op.result.success ? "status" : "alert"}
          aria-live="polite"
        >
          <strong>{op.result.success ? "Profile 已更新" : "命令失败"}</strong>
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
                      launchTargetAvailable(entry),
                    )}
                    busy={busy}
                    install={(item) =>
                      requestOperation(
                        "add",
                        item.installSpec,
                        item.name,
                        item,
                      )
                    }
                    launch={(item) => void launch(item)}
                  />
                ))}
              </ul>
            ) : (
              <div className="dpm-empty">
                <strong>首批推荐插件正在验证</strong>
                <p>
                  目录不会使用普通 npm 包凑数。完成标准 CLI 安装、DSH
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
                  {plugins.map((plugin) => (
                    <Installed
                      key={plugin.name}
                      plugin={plugin}
                      update={updates.get(plugin.name)}
                      busy={busy}
                      run={(action, value, displayName) =>
                        requestOperation(action, value, displayName)
                      }
                    />
                  ))}
                </ul>
              ) : (
                <div className="dpm-empty">
                  <strong>还没有业务插件</strong>
                  <p>
                    从上方推荐中心安装后，会在这里进行升级、卸载和体检。
                  </p>
                </div>
              )}
            </div>
          </details>
          <details className="dpm-advanced">
            <summary>高级安装</summary>
            <p>
              仅安装你信任的 DSH 兼容插件。支持 npm 固定版本、GitHub
              仓库或本地 .tgz。
            </p>
            <div className="dpm-install-row">
              <label htmlFor="dpm-install-target">插件安装地址</label>
              <div>
                <input
                  id="dpm-install-target"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder="例如 @scope/plugin@1.2.3 或 D:\plugins\plugin.tgz"
                />
                <button
                  className="dpm-primary"
                  data-dpm-focus="advanced-add"
                  disabled={busy || !target.trim()}
                  onClick={() => requestOperation("add", target)}
                >
                  安装并重启
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
              {page.report.checks.map((check) => (
                <li className="dpm-check" key={check.id}>
                  <span className="dpm-dot" data-status={check.status} />
                  <span className="dpm-label">{check.label}</span>
                  <span className="dpm-message">{check.message}</span>
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
    const style = document.createElement("style");
    style.dataset.plugin = "dsh-plugin-manager";
    style.textContent = CLIENT_STYLES;
    document.head.append(style);
    return () => style.remove();
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
