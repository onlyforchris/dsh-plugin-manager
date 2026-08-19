import { createRequire } from "node:module";
import { homedir } from "node:os";
import { delimiter, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

//#region src/shared.ts
const PACKAGE_NAME = "dsh-plugin-manager";
const MANAGER_VERSION = "0.8.0";
const DIAGNOSTICS_PATH = "/dsh-plugin-manager/api/diagnostics";
const INVENTORY_PATH = "/dsh-plugin-manager/api/plugins";
const OPERATIONS_PATH = "/dsh-plugin-manager/api/operations";
const OPERATIONS_PROGRESS_PATH = "/dsh-plugin-manager/api/operations/progress";
const RESTART_PATH = "/dsh-plugin-manager/api/restart";
const UPDATES_PATH = "/dsh-plugin-manager/api/updates";
const CATALOG_PATH = "/dsh-plugin-manager/api/catalog";

//#endregion
//#region src/operations.ts
const require = createRequire(import.meta.url);
const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;
const NPM_SPEC_PATTERN = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:@[a-z0-9._*^~+-]+)?$/i;
const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?(?:#[a-z0-9._/-]+)?$/i;
const GITHUB_SPEC_PATTERN = /^github:[a-z0-9_.-]+\/[a-z0-9_.-]+(?:#[a-z0-9._/-]+)?$/i;
const WINDOWS_TARBALL_PATTERN = /^(?:file:)?[a-z]:[\\/][a-z0-9._\\/-]+\.tgz$/i;
const POSIX_TARBALL_PATTERN = /^(?:file:)?\/[a-z0-9._/-]+\.tgz$/i;
const MAX_OUTPUT = 32e3;
const PNPM_STORE_MISMATCH = /ERR_PNPM_UNEXPECTED_STORE|ERR_PNPM_ABORTED_REMOVE_MODULES_DIR|different major version of pnpm|wants to use the store at/;
var PluginOperationError = class extends Error {
	constructor(message, code) {
		super(message);
		this.code = code;
	}
};
/** 操作实时输出追踪：页面通过 /operations/progress 轮询它渲染进度条。 */
var OperationProgressTracker = class {
	running = false;
	action = null;
	target = null;
	output = "";
	finishedAt = null;
	start(action, target) {
		this.running = true;
		this.action = action;
		this.target = target;
		this.output = "";
		this.finishedAt = null;
	}
	append(chunk) {
		if (!this.running) return;
		this.output = appendOutput(this.output, chunk);
	}
	finish() {
		if (!this.running) return;
		this.running = false;
		this.finishedAt = (/* @__PURE__ */ new Date()).toISOString();
	}
	snapshot() {
		return {
			running: this.running,
			action: this.action,
			target: this.target,
			output: this.output,
			finishedAt: this.finishedAt
		};
	}
};
function appendOutput(current, chunk) {
	const combined = current + chunk.toString();
	return combined.length <= MAX_OUTPUT ? combined : combined.slice(combined.length - MAX_OUTPUT);
}
/**
* Directories whose `.bin` shims must win over the ambient PATH when the
* plugin command spawns `pnpm`: the profile's own installation (the pinned
* pnpm 10.34.5 the manager depends on is hoisted there) and the manager's
* own dependency tree as a fallback. A PATH pnpm of a different major would
* refuse to touch a store created by another major
* (`ERR_PNPM_UNEXPECTED_STORE`), so the operation must resolve pnpm
* deterministically instead of trusting the environment.
*/
function resolvePnpmBins(profileRoot$1) {
	const candidates = [join(profileRoot$1, "node_modules", ".bin")];
	try {
		const pnpmPackage = require.resolve("pnpm/package.json");
		candidates.push(join(dirname(pnpmPackage), "..", ".bin"));
	} catch {}
	return [...new Set(candidates)].filter((dir) => existsSync(dir));
}
/** 中文指引：pnpm 版本与 Profile 的 store 不匹配时如何修复。 */
function pnpmStoreHint(profileRoot$1) {
	const profilePnpmBin = join(profileRoot$1, "node_modules", ".bin");
	return `检测到 pnpm 版本与 Profile 不匹配：Profile 的依赖由 pnpm 10.x（store v10）安装，而本次命令使用的 pnpm 是 11.x（store v11），pnpm 拒绝继续。插件管家会优先使用 Profile 内置的 pnpm 10.34.5（${profilePnpmBin}）；若你在终端手动执行 dsh plugin 命令，请先执行：set PATH=${profilePnpmBin};%PATH%（PowerShell：$env:PATH="${profilePnpmBin};$env:PATH"），然后重试。`;
}
/**
* 解析 pnpm 的 bin 脚本绝对路径（`<node_modules>/pnpm/bin/pnpm.cjs`）。
* Windows 上 `.cmd` shim 无法被 `spawn({shell:false})` 直接执行（EINVAL），
* 而 `spawn("pnpm")` 又不做扩展名解析（ENOENT）——最可靠的方式是用
* `node <pnpm.cjs>` 直接运行，且配合 `windowsHide` 完全无窗口。
*/
function resolvePnpmBinScript(bins) {
	for (const bin of bins) {
		const candidate = join(bin, "..", "pnpm", "bin", "pnpm.cjs");
		if (existsSync(candidate)) return candidate;
	}
	try {
		return require.resolve("pnpm/bin/pnpm.cjs");
	} catch {
		return null;
	}
}
function isInstallSpec(value) {
	return NPM_SPEC_PATTERN.test(value) || GITHUB_URL_PATTERN.test(value) || GITHUB_SPEC_PATTERN.test(value) || WINDOWS_TARBALL_PATTERN.test(value) || POSIX_TARBALL_PATTERN.test(value);
}
const RELATIVE_SPEC = /^(?<prefix>(?:file|link):)?(?<path>\.{1,2}(?:[/\\].*)?)$/;
const GIT_SPEC = /^git\+|^github:|\.git(?:#|$)/;
/**
* 与 `dsh plugin` 的 CLI 行为一致：把相对路径规格（`.`、`../x`、`file:./x`）
* 锚定到调用方目录而不是 Profile 目录；绝对路径和其他规格原样透传。
*/
function anchorPathSpec(argument, cwd) {
	const match = RELATIVE_SPEC.exec(argument);
	if (!match?.groups?.path) return argument;
	return `${match.groups.prefix ?? ""}${resolve(cwd, match.groups.path)}`;
}
/**
* 判断 Profile 中已安装的某个依赖是否声明了 `dsh.bundle.patch`
* （即是否属于 profile layer bundle）。先查 hoisted 顶层，再兜底扫 .pnpm 虚拟 store。
*/
async function declaresBundle(profileRoot$1, packageName) {
	const candidates = [join(profileRoot$1, "node_modules", packageName, "package.json")];
	try {
		const scoped = packageName.startsWith("@") ? packageName.replace("/", "+") : packageName;
		const entries = await readdir(join(profileRoot$1, "node_modules", ".pnpm"));
		for (const entry$1 of entries) if (entry$1.startsWith(`${scoped}@`)) candidates.push(join(profileRoot$1, "node_modules", ".pnpm", entry$1, "node_modules", packageName, "package.json"));
	} catch {}
	for (const candidate of candidates) try {
		return JSON.parse(await readFile(candidate, "utf8")).dsh?.bundle?.patch !== void 0;
	} catch {}
	return false;
}
async function readDependencyNames(profileRoot$1) {
	try {
		const manifest = JSON.parse(await readFile(join(profileRoot$1, "package.json"), "utf8"));
		return new Set(Object.keys(manifest.dependencies ?? {}));
	} catch {
		throw new PluginOperationError("Profile 状态异常：缺少可读的 package.json", "invalid_request");
	}
}
/**
* 镜像 `dsh plugin` 命令的 bundles 对账：依赖中声明 `dsh.bundle` 的包进入
* `dsh.profile.bundles` 层栈（按依赖顺序追加）；被移除或不再声明 bundle 的
* 依赖从层栈退出；模板自带的 in-box bundles（非依赖）永不触碰。
*/
async function reconcileBundles(profileRoot$1, beforeDeps) {
	const manifestPath = join(profileRoot$1, "package.json");
	let manifest;
	try {
		manifest = JSON.parse(await readFile(manifestPath, "utf8"));
	} catch {
		throw new PluginOperationError("Profile 状态异常：缺少可读的 package.json", "invalid_request");
	}
	const dependencyNames = Object.keys(manifest.dependencies ?? {});
	const plugins = manifest.dsh?.profile?.bundles ?? [];
	let changed = false;
	for (const packageName of dependencyNames) if (!plugins.includes(packageName) && await declaresBundle(profileRoot$1, packageName)) {
		plugins.push(packageName);
		changed = true;
	}
	const dependencySet = new Set(dependencyNames);
	for (const packageName of [...plugins]) {
		const wasDependency = beforeDeps.has(packageName) || dependencySet.has(packageName);
		const stillBundle = dependencySet.has(packageName) && await declaresBundle(profileRoot$1, packageName);
		if (wasDependency && !stillBundle) {
			plugins.splice(plugins.indexOf(packageName), 1);
			changed = true;
		}
	}
	if (!changed) return;
	await writeFile(manifestPath, JSON.stringify({
		...manifest,
		dsh: {
			...manifest.dsh,
			profile: {
				...manifest.dsh?.profile,
				bundles: plugins
			}
		}
	}, null, 2) + "\n", "utf8");
}
function runPnpm(args, input) {
	return new Promise((resolve$1, reject) => {
		const bins = resolvePnpmBins(input.profileRoot);
		const pnpmBin = resolvePnpmBinScript(bins);
		if (pnpmBin === null) {
			reject(new PluginOperationError("Profile 中找不到 pnpm（node_modules/pnpm 缺失），请先在终端执行 dsh plugin --profile web install 修复依赖", "invalid_request"));
			return;
		}
		const env = { ...process.env };
		const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
		env[pathKey] = [...bins, env[pathKey] ?? ""].join(delimiter);
		const child = spawn(process.execPath, [pnpmBin, ...args], {
			cwd: input.profileRoot,
			env,
			shell: false,
			windowsHide: true,
			stdio: [
				"ignore",
				"pipe",
				"pipe"
			]
		});
		let output = "";
		child.stdout.on("data", (chunk) => {
			output = appendOutput(output, chunk);
			input.onOutput?.(chunk.toString());
		});
		child.stderr.on("data", (chunk) => {
			output = appendOutput(output, chunk);
			input.onOutput?.(chunk.toString());
		});
		child.once("error", reject);
		const timeout = setTimeout(() => child.kill(), input.timeoutMs ?? 12e4);
		child.once("close", (code) => {
			clearTimeout(timeout);
			const exitCode = code ?? 1;
			const trimmed = output.trim();
			resolve$1({
				exitCode,
				output: exitCode !== 0 && PNPM_STORE_MISMATCH.test(trimmed) ? `${pnpmStoreHint(input.profileRoot)}\n\n${trimmed}` : trimmed
			});
		});
	});
}
/**
* 组装实际传给 pnpm 的参数。update 必须带 --latest：Profile 中插件常以
* 精确版本（如 "0.1.31"）或 Git 源声明，裸 `pnpm update <name>` 只会在
* 既有 semver 范围内更新，精确版本会被判定为 "Already up to date" 而不升级。
*/
function buildPnpmArgs(action, target, cwd) {
	return action === "add" ? ["add", anchorPathSpec(target, cwd)] : action === "update" ? [
		"update",
		"--latest",
		target
	] : [action, target];
}
function createDshPluginRunner(input) {
	return async (action, target) => {
		const beforeDeps = await readDependencyNames(input.profileRoot);
		const result = await runPnpm(buildPnpmArgs(action, target, input.cwd), {
			profileRoot: input.profileRoot,
			...input.timeoutMs !== void 0 ? { timeoutMs: input.timeoutMs } : {},
			...input.onOutput !== void 0 ? { onOutput: input.onOutput } : {}
		});
		if (result.exitCode !== 0) {
			if (action === "add" && GIT_SPEC.test(target)) return {
				...result,
				output: `${result.output}\n\n提示：git 仓库插件在安装时通过 prepare 脚本构建，pnpm 默认阻止——请把 pnpm 输出中列出的 key 加入 ${join(input.profileRoot, "pnpm-workspace.yaml")} 的 allowBuilds 后重试。`
			};
			return result;
		}
		try {
			await reconcileBundles(input.profileRoot, beforeDeps);
		} catch (error) {
			return {
				...result,
				output: `${result.output}\n\n警告：pnpm 执行成功，但 bundles 对账失败：${error instanceof Error ? error.message : String(error)}`
			};
		}
		return result;
	};
}
function validateRequest(request, installedNames) {
	if (![
		"add",
		"update",
		"remove"
	].includes(request.action)) throw new PluginOperationError("不支持的插件操作", "invalid_request");
	if (request.target.length === 0 || request.target.length > 512) throw new PluginOperationError("插件目标不能为空或超过 512 个字符", "invalid_request");
	if (request.action === "add") {
		if (!isInstallSpec(request.target)) throw new PluginOperationError("仅支持 npm 包、GitHub 仓库或无空格的本地 .tgz 绝对路径", "invalid_request");
		if (request.target === PACKAGE_NAME) throw new PluginOperationError("插件管家自身请通过外部 CLI 升级", "manager_protected");
		return;
	}
	if (!PACKAGE_NAME_PATTERN.test(request.target)) throw new PluginOperationError("升级和卸载只接受已安装的包名", "invalid_request");
	if (request.target === PACKAGE_NAME) throw new PluginOperationError("不能从运行中的插件管家卸载或升级自身", "manager_protected");
	if (!installedNames.has(request.target)) throw new PluginOperationError("目标插件不在当前 Profile 依赖中", "not_installed");
}
/**
* pnpm 无实际变更时的输出特征：只出现 "Already up to date"，没有
* "Packages: +N" 变更行。此类结果不应视为需要重启的成功变更——
* 否则点一次"升级"（实际没升）也会触发一次 DSH 重启。
*/
function unchangedOutput(output) {
	return /already up to date/i.test(output) && !/Packages:\s*\+/i.test(output);
}
var PluginOperationService = class {
	running = false;
	progress;
	constructor(runner, getInstalledNames, profileName, progress) {
		this.runner = runner;
		this.getInstalledNames = getInstalledNames;
		this.profileName = profileName;
		this.progress = progress ?? new OperationProgressTracker();
	}
	/** 页面轮询用的实时输出快照。 */
	progressSnapshot() {
		return this.progress.snapshot();
	}
	async run(request) {
		if (this.running) throw new PluginOperationError("已有插件操作正在执行", "busy");
		this.running = true;
		this.progress.start(request.action, request.target);
		try {
			validateRequest(request, await this.getInstalledNames());
			const result = await this.runner(request.action, request.target);
			return {
				schemaVersion: 1,
				action: request.action,
				target: request.target,
				success: result.exitCode === 0,
				exitCode: result.exitCode,
				command: `dsh plugin --profile ${this.profileName} ${request.action} ${request.target}`,
				output: result.output,
				restartRequired: result.exitCode === 0 && !unchangedOutput(result.output),
				finishedAt: (/* @__PURE__ */ new Date()).toISOString()
			};
		} finally {
			this.running = false;
			this.progress.finish();
		}
	}
};

//#endregion
//#region src/catalog.ts
const DEFAULT_CATALOG_URL = "https://raw.githubusercontent.com/onlyforchris/dsh-plugin-manager/main/registry/plugins.json";
/** jsDelivr CDN 镜像：raw.githubusercontent.com 在部分地区不可达时回退，内容与主源一致。 */
const MIRROR_CATALOG_URL = "https://cdn.jsdelivr.net/gh/onlyforchris/dsh-plugin-manager@main/registry/plugins.json";
const MAX_BYTES = 262144, MAX_ENTRIES = 200, CACHE_MAX_AGE = 6048e5;
function str(v, max = 500) {
	return typeof v === "string" && v.length > 0 && v.length <= max;
}
function launch(v) {
	if (v === null) return true;
	if (!v || typeof v !== "object" || Array.isArray(v)) return false;
	const x = v;
	return (x.kind === "settings" || x.kind === "copy-prompt") && str(x.label, 60) && str(x.target, 500);
}
function entry(v) {
	if (!v || typeof v !== "object" || Array.isArray(v)) return false;
	const x = v, s = x.verificationStatus;
	return str(x.id, 100) && /^[a-z0-9][a-z0-9._-]*$/i.test(x.id) && str(x.name, 100) && str(x.packageName, 214) && str(x.summary) && str(x.category, 60) && str(x.repository) && /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?$/i.test(x.repository) && str(x.installSpec) && isInstallSpec(x.installSpec) && str(x.version, 60) && str(x.dshCompatibility, 100) && (s === "verified" || s === "community" || s === "experimental") && (x.verifiedWithDsh === null || str(x.verifiedWithDsh, 60)) && (x.verifiedAt === null || str(x.verifiedAt, 30) && /^\d{4}-\d{2}-\d{2}$/.test(x.verifiedAt)) && str(x.maintainer, 100) && str(x.license, 60) && str(x.recommendation) && Array.isArray(x.permissions) && x.permissions.length <= 20 && x.permissions.every((p) => str(p, 100)) && Array.isArray(x.firstUse) && x.firstUse.length > 0 && x.firstUse.length <= 5 && x.firstUse.every((step) => str(step, 200)) && launch(x.launch);
}
function parseRegistryDocument(v) {
	if (!v || typeof v !== "object" || Array.isArray(v)) throw Error("catalog_invalid");
	const x = v;
	if (x.schemaVersion !== 1 || !str(x.updatedAt, 40) || !Array.isArray(x.entries) || x.entries.length > MAX_ENTRIES || !x.entries.every(entry)) throw Error("catalog_invalid");
	const ids = /* @__PURE__ */ new Set();
	for (const e of x.entries) {
		if (ids.has(e.id)) throw Error("catalog_duplicate_id");
		ids.add(e.id);
	}
	return x;
}
async function json(p) {
	return JSON.parse(await readFile(p, "utf8"));
}
async function builtin(p) {
	return parseRegistryDocument(await json(p ?? fileURLToPath(new URL("../registry/plugins.json", import.meta.url))));
}
async function cache(p) {
	try {
		const v = await json(p);
		if (v.schemaVersion !== 1 || !str(v.fetchedAt, 40)) return null;
		return {
			...v,
			document: parseRegistryDocument(v.document)
		};
	} catch {
		return null;
	}
}
function out(d, source, x) {
	return {
		schemaVersion: 2,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		source,
		sourceUrl: x.sourceUrl ?? null,
		fetchedAt: x.fetchedAt ?? null,
		stale: x.stale ?? false,
		message: x.message,
		entries: d.entries
	};
}
function createCatalogProvider(input) {
	const url = input.remoteUrl ?? DEFAULT_CATALOG_URL, fetcher = input.fetcher ?? fetch, dir = join(input.dshHome, "cache", "dsh-plugin-manager"), path = join(dir, "registry.json"), mirror = input.mirrorUrl !== null && input.mirrorUrl !== void 0 ? input.mirrorUrl : input.mirrorUrl === null ? null : MIRROR_CATALOG_URL;
	const sources = [{
		url,
		useEtag: true
	}, ...mirror && mirror !== url ? [{
		url: mirror,
		useEtag: false
	}] : []];
	let running = null;
	return async () => {
		if (running) return running;
		running = (async () => {
			const base = await builtin(input.builtinPath), saved = await cache(path);
			for (const source of sources) {
				const controller = new AbortController(), timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 4e3);
				try {
					const headers = {
						accept: "application/json",
						"user-agent": "dsh-plugin-manager"
					};
					if (saved?.etag && source.useEtag) headers["if-none-match"] = saved.etag;
					const r = await fetcher(source.url, {
						headers,
						signal: controller.signal
					});
					if (r.status === 304 && saved && source.useEtag) return out(saved.document, "cache", {
						sourceUrl: source.url,
						fetchedAt: saved.fetchedAt,
						message: "远程目录未变化，已使用本地缓存"
					});
					if (!r.ok) throw Error("catalog_http");
					const text = await r.text();
					if (text.length > MAX_BYTES) throw Error("catalog_too_large");
					const document = parseRegistryDocument(JSON.parse(text)), record = {
						schemaVersion: 1,
						etag: r.headers.get("etag"),
						fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
						document
					};
					await mkdir(dir, { recursive: true });
					await writeFile(path + ".tmp", JSON.stringify(record, null, 2), "utf8");
					await rename(path + ".tmp", path);
					return out(document, "remote", {
						sourceUrl: source.url,
						fetchedAt: record.fetchedAt,
						message: source.useEtag ? "已加载远程推荐目录" : "已加载镜像推荐目录"
					});
				} catch {} finally {
					clearTimeout(timer);
				}
			}
			if (saved) {
				const stale = Date.now() - Date.parse(saved.fetchedAt) > CACHE_MAX_AGE;
				return out(saved.document, "cache", {
					sourceUrl: url,
					fetchedAt: saved.fetchedAt,
					stale,
					message: stale ? "远程目录不可用，当前缓存已超过 7 天" : "远程目录不可用，已使用本地缓存"
				});
			}
			return out(base, "builtin", { message: "远程目录不可用，已使用安装包内置目录" });
		})();
		try {
			return await running;
		} finally {
			running = null;
		}
	};
}

//#endregion
//#region src/diagnostics.ts
function check(id, label, status, message) {
	return {
		id,
		label,
		status,
		message
	};
}
function nodeVersionSupported(version) {
	const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
	if (match === null) return false;
	const major = Number(match[1]);
	const minor = Number(match[2]);
	return major > 22 || major === 22 && minor >= 19;
}
async function canAccess$1(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
async function readProfileManifest(path) {
	try {
		const parsed = JSON.parse(await readFile(path, "utf8"));
		return parsed !== null && typeof parsed === "object" ? parsed : null;
	} catch {
		return null;
	}
}
function summarize(checks) {
	return checks.reduce((summary, item) => ({
		...summary,
		[item.status]: summary[item.status] + 1
	}), {
		pass: 0,
		warning: 0,
		fail: 0
	});
}
async function createDiagnosticReport(input) {
	const profileRoot$1 = join(input.dshHome, "profiles", input.profileName);
	const manifestPath = join(profileRoot$1, "package.json");
	const lockPath = join(profileRoot$1, "pnpm-lock.yaml");
	const homeAvailable = await canAccess$1(input.dshHome);
	const manifest = await readProfileManifest(manifestPath);
	const lockAvailable = await canAccess$1(lockPath);
	const dependencies = manifest?.dependencies ?? {};
	const bundles = manifest?.dsh?.profile?.bundles ?? [];
	const managerEntries = input.loaderEntries.filter((entry$1) => entry$1.options.name === PACKAGE_NAME);
	const checks = [
		check("node-version", "Node.js 版本", nodeVersionSupported(input.nodeVersion) ? "pass" : "fail", nodeVersionSupported(input.nodeVersion) ? `Node.js ${input.nodeVersion} 满足 DSH 要求` : `Node.js ${input.nodeVersion} 低于 22.19`),
		check("runtime-platform", "运行平台", "pass", `${input.platform}/${input.arch}`),
		check("dsh-home", "DSH Home", homeAvailable ? "pass" : "fail", homeAvailable ? "DSH Home 可访问" : "DSH Home 不存在或不可访问"),
		check("profile-manifest", "Profile 清单", manifest === null ? "fail" : "pass", manifest === null ? `Profile ${input.profileName} 清单缺失或格式错误` : `Profile ${input.profileName} 清单有效`),
		check("profile-lock", "Profile 依赖锁", lockAvailable ? "pass" : "warning", lockAvailable ? "pnpm-lock.yaml 已存在" : "未发现 pnpm-lock.yaml，依赖版本可能未锁定"),
		check("manager-dependency", "管家依赖", Object.hasOwn(dependencies, PACKAGE_NAME) ? "pass" : "fail", Object.hasOwn(dependencies, PACKAGE_NAME) ? "Profile 已声明插件管家依赖" : "Profile 未声明插件管家依赖"),
		check("manager-bundle", "Bundle 注册", bundles.includes(PACKAGE_NAME) ? "pass" : "fail", bundles.includes(PACKAGE_NAME) ? "Bundle 已加入 Profile 层顺序" : "Bundle 未加入 Profile 层顺序"),
		check("manager-loader-entry", "Loader 实例", managerEntries.length === 1 ? "pass" : managerEntries.length === 0 ? "fail" : "warning", managerEntries.length === 1 ? "插件管家已加载且只有一个实例" : managerEntries.length === 0 ? "当前 Loader 中未发现插件管家" : `当前 Loader 中发现 ${managerEntries.length} 个插件管家实例`),
		check("web-runtime", "DSH Web", input.webServer.port > 0 ? "pass" : "fail", input.webServer.port > 0 ? `Web 服务已监听 ${input.webServer.host}:${input.webServer.port}` : "Web 服务尚未完成监听")
	];
	return {
		schemaVersion: 1,
		managerVersion: MANAGER_VERSION,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		profileName: input.profileName,
		summary: summarize(checks),
		checks
	};
}

//#endregion
//#region src/restart.ts
const HELPER_SOURCE = String.raw`
const { spawn } = require("node:child_process");
const { openSync, closeSync } = require("node:fs");
const net = require("node:net");
const [cli, profile, cwd, host, portText, logPath, ...appArgs] = process.argv.slice(1);
const port = Number(portText);
const MAX_STARTS = 3;
let attempts = 0;
let starting = false;
let starts = 0;
function start() {
  if (starting || starts >= MAX_STARTS) return;
  starting = true;
  starts += 1;
  const output = openSync(logPath, "a");
  const child = spawn(process.execPath, [cli, "--profile", profile, ...appArgs], {
    cwd,
    env: process.env,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", output, output],
  });
  closeSync(output);
  let done = false;
  const settle = () => {
    if (done) return;
    done = true;
    child.unref();
    process.exit(0);
  };
  // 启动后立刻崩溃（如依赖尚未就绪）：短暂等待后重新探测并再次拉起。
  child.once("exit", () => {
    if (done) return;
    starting = false;
    setTimeout(probe, 500);
  });
  // 存活 20 秒即视为启动成功，助手退出，不再干预。
  setTimeout(settle, 20000);
}
function probe() {
  const socket = net.connect({ host, port });
  let settled = false;
  function finish(available) {
    if (settled) return;
    settled = true;
    socket.destroy();
    if (available) {
      start();
      return;
    }
    attempts += 1;
    if (attempts >= 480) process.exit(1);
    setTimeout(probe, 250);
  }
  socket.once("connect", () => finish(false));
  socket.once("error", () => finish(true));
  socket.setTimeout(200, () => finish(false));
}
setTimeout(probe, 250);
`;
var RestartError = class extends Error {
	constructor(code) {
		super(code);
		this.code = code;
	}
};
function createRestartHelper(input) {
	const directory = join(input.dshHome, "cache", "dsh-plugin-manager");
	const logPath = join(directory, "restart.log");
	return async () => {
		await mkdir(directory, { recursive: true });
		await new Promise((resolve$1, reject) => {
			const helper = spawn(process.execPath, [
				"-e",
				HELPER_SOURCE,
				input.dshCliPath,
				input.profileName,
				input.cwd,
				input.host,
				String(input.port),
				logPath,
				...input.appArgs ?? []
			], {
				cwd: input.cwd,
				env: process.env,
				detached: true,
				shell: false,
				stdio: "ignore",
				windowsHide: true
			});
			helper.once("spawn", () => {
				helper.unref();
				resolve$1();
			});
			helper.once("error", reject);
		});
	};
}
var DshRestartService = class {
	scheduled = false;
	constructor(launchHelper, appExit) {
		this.launchHelper = launchHelper;
		this.appExit = appExit;
	}
	async schedule() {
		if (this.scheduled) throw new RestartError("busy");
		if (!this.appExit) throw new RestartError("unavailable");
		this.scheduled = true;
		try {
			await this.launchHelper();
		} catch (error) {
			this.scheduled = false;
			throw error;
		}
		setTimeout(() => this.appExit?.(0), 200);
		return { accepted: true };
	}
};

//#endregion
//#region src/http.ts
const JSON_HEADERS = {
	"cache-control": "no-store",
	"content-type": "application/json; charset=utf-8",
	"x-content-type-options": "nosniff"
};
function sendJson(res, status, body, extraHeaders = {}) {
	res.writeHead(status, {
		...JSON_HEADERS,
		...extraHeaders
	});
	res.end(JSON.stringify(body));
}
async function readJsonBody(req) {
	let body = "";
	for await (const chunk of req) {
		body += chunk.toString();
		if (body.length > 8192) throw new Error("request_too_large");
	}
	return JSON.parse(body);
}
function createDiagnosticsHandler(getReport) {
	return async (req, res) => {
		if (req.method !== "GET") {
			sendJson(res, 405, { error: "method_not_allowed" }, { allow: "GET" });
			return;
		}
		try {
			sendJson(res, 200, await getReport());
		} catch {
			sendJson(res, 500, { error: "diagnostics_failed" });
		}
	};
}
function createInventoryHandler(getInventory) {
	return async (req, res) => {
		if (req.method !== "GET") {
			sendJson(res, 405, { error: "method_not_allowed" }, { allow: "GET" });
			return;
		}
		try {
			sendJson(res, 200, await getInventory());
		} catch {
			sendJson(res, 500, { error: "inventory_failed" });
		}
	};
}
function createUpdatesHandler(getUpdates) {
	return async (req, res) => {
		if (req.method !== "GET") {
			sendJson(res, 405, { error: "method_not_allowed" }, { allow: "GET" });
			return;
		}
		try {
			sendJson(res, 200, await getUpdates());
		} catch {
			sendJson(res, 500, { error: "updates_failed" });
		}
	};
}
function createCatalogHandler(getCatalog) {
	return async (req, res) => {
		if (req.method !== "GET") {
			sendJson(res, 405, { error: "method_not_allowed" }, { allow: "GET" });
			return;
		}
		try {
			sendJson(res, 200, await getCatalog());
		} catch {
			sendJson(res, 500, { error: "catalog_failed" });
		}
	};
}
function createOperationsProgressHandler(service) {
	return async (req, res) => {
		if (req.method !== "GET") {
			sendJson(res, 405, { error: "method_not_allowed" }, { allow: "GET" });
			return;
		}
		sendJson(res, 200, service.progressSnapshot());
	};
}
function createRestartHandler(service) {
	return async (req, res) => {
		if (req.method !== "POST") {
			sendJson(res, 405, { error: "method_not_allowed" }, { allow: "POST" });
			return;
		}
		if (req.headers["x-dsh-plugin-manager"] !== "1") {
			sendJson(res, 403, { error: "request_guard_required" });
			return;
		}
		try {
			sendJson(res, 202, await service.schedule());
		} catch (error) {
			if (error instanceof RestartError) {
				sendJson(res, error.code === "busy" ? 409 : 503, {
					error: error.code,
					message: error.code === "busy" ? "DSH 已在准备重启" : "当前 DSH 启动器不支持自动重启"
				});
				return;
			}
			sendJson(res, 500, {
				error: "restart_failed",
				message: "无法启动 DSH 重启助手"
			});
		}
	};
}
function createOperationsHandler(service) {
	return async (req, res) => {
		if (req.method !== "POST") {
			sendJson(res, 405, { error: "method_not_allowed" }, { allow: "POST" });
			return;
		}
		if (req.headers["x-dsh-plugin-manager"] !== "1") {
			sendJson(res, 403, { error: "request_guard_required" });
			return;
		}
		let parsed;
		try {
			parsed = await readJsonBody(req);
		} catch {
			sendJson(res, 400, {
				error: "invalid_request",
				message: "请求格式无效"
			});
			return;
		}
		if (parsed === null || typeof parsed !== "object") {
			sendJson(res, 400, {
				error: "invalid_request",
				message: "请求格式无效"
			});
			return;
		}
		const request = parsed;
		if (typeof request.action !== "string" || typeof request.target !== "string") {
			sendJson(res, 400, {
				error: "invalid_request",
				message: "请求格式无效"
			});
			return;
		}
		try {
			sendJson(res, 200, await service.run(request));
		} catch (error) {
			if (error instanceof PluginOperationError) {
				sendJson(res, error.code === "busy" ? 409 : 400, {
					error: error.code,
					message: error.message
				});
				return;
			}
			sendJson(res, 500, {
				error: "operation_failed",
				message: "DSH 插件命令执行失败"
			});
		}
	};
}

//#endregion
//#region src/inventory.ts
async function readJson(path) {
	try {
		return JSON.parse(await readFile(path, "utf8"));
	} catch {
		return null;
	}
}
async function canAccess(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
function safePackageFile(packageRoot, declaredPath) {
	if (!declaredPath.startsWith("./")) return null;
	const candidate = resolve(packageRoot, declaredPath);
	const inside = relative(packageRoot, candidate);
	return inside !== "" && !inside.startsWith("..") && !isAbsolute(inside) ? candidate : null;
}
function clientExport(exportsValue) {
	if (exportsValue === null || typeof exportsValue !== "object" || Array.isArray(exportsValue)) return null;
	const value = exportsValue["./client"];
	if (typeof value === "string") return value;
	if (value !== null && typeof value === "object" && !Array.isArray(value)) {
		const record = value;
		for (const key of [
			"browser",
			"import",
			"default"
		]) if (typeof record[key] === "string") return record[key];
	}
	return null;
}
function healthOf(issues) {
	if (issues.some((issue) => issue.severity === "error")) return "error";
	return issues.length > 0 ? "warning" : "healthy";
}
function profileRoot(dshHome, profileName) {
	return join(dshHome, "profiles", profileName);
}
async function createPluginInventory(input) {
	const root = profileRoot(input.dshHome, input.profileName);
	const manifest = await readJson(join(root, "package.json"));
	const dependencies = manifest?.dependencies ?? {};
	const bundles = new Set(manifest?.dsh?.profile?.bundles ?? []);
	const plugins = await Promise.all(Object.entries(dependencies).map(async ([name$1, spec]) => {
		const packageRoot = join(root, "node_modules", ...name$1.split("/"));
		const installed = await readJson(join(packageRoot, "package.json"));
		const issues = [];
		const manager = name$1 === PACKAGE_NAME;
		const patch = installed?.dsh?.bundle?.patch;
		const hasBundle = typeof patch === "string";
		const hasClient = installed?.dsh?.client !== void 0;
		if (installed === null) issues.push({
			code: "package_missing",
			severity: "error",
			message: "Profile 已声明依赖，但安装目录中没有有效的 package.json"
		});
		else if (!hasBundle) issues.push({
			code: "bundle_missing",
			severity: "warning",
			message: "该依赖没有声明 dsh.bundle，不会作为 DSH Bundle 加载"
		});
		else {
			if (!bundles.has(name$1)) issues.push({
				code: "bundle_unregistered",
				severity: "error",
				message: "包声明了 dsh.bundle，但没有加入当前 Profile 的 Bundle 顺序"
			});
			const patchFile = safePackageFile(packageRoot, patch);
			if (patchFile === null || !await canAccess(patchFile)) issues.push({
				code: "bundle_patch_missing",
				severity: "error",
				message: "dsh.bundle.patch 指向的配置文件不存在或路径无效"
			});
		}
		if (hasClient) {
			const exported = clientExport(installed?.exports);
			const clientFile = exported === null ? null : safePackageFile(packageRoot, exported);
			if (clientFile === null || !await canAccess(clientFile)) issues.push({
				code: "client_export_missing",
				severity: "error",
				message: "包声明了 dsh.client，但没有可访问的 ./client 导出"
			});
		}
		return {
			name: name$1,
			spec,
			version: typeof installed?.version === "string" ? installed.version : null,
			bundle: hasBundle && bundles.has(name$1),
			client: hasClient,
			manager,
			health: healthOf(issues),
			issues,
			canUpdate: !manager && !/^(?:file|link):/i.test(spec),
			canRemove: !manager
		};
	}));
	plugins.sort((left, right) => Number(right.manager) - Number(left.manager) || left.name.localeCompare(right.name));
	return {
		schemaVersion: 1,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		profileName: input.profileName,
		plugins
	};
}

//#endregion
//#region src/updates.ts
const REGISTRY = "https://registry.npmjs.org";
function numericVersion(value) {
	const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value);
	return match ? [
		Number(match[1]),
		Number(match[2]),
		Number(match[3])
	] : null;
}
function isNewerVersion(latest, installed) {
	const left = numericVersion(latest);
	const right = numericVersion(installed);
	if (left === null || right === null) return false;
	for (let index = 0; index < 3; index += 1) if (left[index] !== right[index]) return (left[index] ?? 0) > (right[index] ?? 0);
	return false;
}
function usesNpmRegistry(plugin) {
	return !/^(?:file|link|https?:|github:|git(?:\+|:))/i.test(plugin.spec);
}
function createNpmLatestVersionProvider(input = {}) {
	const cache$1 = /* @__PURE__ */ new Map();
	const fetcher = input.fetcher ?? fetch;
	return async (name$1) => {
		const now = Date.now();
		const hit = cache$1.get(name$1);
		if (hit && hit.expires > now) return hit.value;
		const value = (async () => {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 4e3);
			try {
				const response = await fetcher(`${REGISTRY}/${encodeURIComponent(name$1)}/latest`, {
					headers: {
						accept: "application/json",
						"user-agent": "dsh-plugin-manager"
					},
					signal: controller.signal
				});
				if (!response.ok) throw new Error(`registry_http_${response.status}`);
				const body = await response.json();
				if (typeof body.version !== "string") throw new Error("registry_invalid_response");
				return body.version;
			} finally {
				clearTimeout(timeout);
			}
		})();
		cache$1.set(name$1, {
			expires: now + (input.cacheMs ?? 10 * 6e4),
			value
		});
		value.catch(() => cache$1.delete(name$1));
		return value;
	};
}
async function createPluginUpdates(plugins, latestVersion) {
	const updates = await Promise.all(plugins.map(async (plugin) => {
		if (!usesNpmRegistry(plugin)) return {
			name: plugin.name,
			installedVersion: plugin.version,
			latestVersion: null,
			state: "unavailable",
			message: "本地包或 Git 源无法通过 npm Registry 判断新版本"
		};
		if (plugin.version === null) return {
			name: plugin.name,
			installedVersion: null,
			latestVersion: null,
			state: "unavailable",
			message: "未读取到已安装版本"
		};
		try {
			const latest = await latestVersion(plugin.name);
			const available = isNewerVersion(latest, plugin.version);
			return {
				name: plugin.name,
				installedVersion: plugin.version,
				latestVersion: latest,
				state: available ? "available" : "current",
				message: available ? `可升级到 ${latest}` : "已是 Registry 最新版本"
			};
		} catch {
			return {
				name: plugin.name,
				installedVersion: plugin.version,
				latestVersion: null,
				state: "unavailable",
				message: "npm Registry 暂时不可用或包未发布"
			};
		}
	}));
	return {
		schemaVersion: 1,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		registry: REGISTRY,
		updates
	};
}

//#endregion
//#region src/index.ts
const name = "dsh-plugin-manager";
const inject = [
	"webServer",
	"loader",
	"appExit",
	"cmdlineArgs"
];
function profile(v) {
	return typeof v === "string" && /^[a-zA-Z0-9._-]+$/.test(v) ? v : "web";
}
function catalogUrl(v) {
	return typeof v === "string" && (/^https:\/\/raw\.githubusercontent\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+\/[a-z0-9._/-]+\.json$/i.test(v) || /^https:\/\/cdn\.jsdelivr\.net\/gh\/[a-z0-9_.-]+\/[a-z0-9_.-]+@[a-z0-9._/-]+\/[a-z0-9._/-]+\.json$/i.test(v)) ? v : void 0;
}
function apply(ctx, config = {}) {
	const profileName = profile(config.profileName), dshHome = process.env.DSH_HOME ?? join(homedir(), ".dsh"), root = profileRoot(dshHome, profileName);
	const inventory = () => createPluginInventory({
		dshHome,
		profileName
	}), latest = createNpmLatestVersionProvider(), updates = async () => createPluginUpdates((await inventory()).plugins, latest);
	const customCatalogUrl = catalogUrl(config.catalogUrl), catalog = customCatalogUrl ? createCatalogProvider({
		dshHome,
		remoteUrl: customCatalogUrl,
		mirrorUrl: null
	}) : createCatalogProvider({ dshHome });
	const diagnostics = createDiagnosticsHandler(async () => createDiagnosticReport({
		dshHome,
		profileName,
		nodeVersion: process.versions.node,
		platform: process.platform,
		arch: process.arch,
		webServer: {
			host: ctx.webServer.host,
			port: ctx.webServer.port
		},
		loaderEntries: [...ctx.loader.entries()]
	}));
	const dshCliPath = process.argv[1] ?? "";
	const progress = new OperationProgressTracker();
	const service = new PluginOperationService(createDshPluginRunner({
		profileRoot: root,
		cwd: process.cwd(),
		onOutput: (chunk) => progress.append(chunk)
	}), async () => new Set((await inventory()).plugins.map((p) => p.name)), profileName, progress);
	const appArgs = ctx.get("cmdlineArgs")?.get();
	const restart = new DshRestartService(createRestartHelper({
		dshCliPath,
		profileName,
		cwd: process.cwd(),
		dshHome,
		host: ctx.webServer.host,
		port: ctx.webServer.port,
		...appArgs ? { appArgs } : {}
	}), ctx.get("appExit"));
	for (const [path, handler, label] of [
		[
			DIAGNOSTICS_PATH,
			diagnostics,
			"diagnostics"
		],
		[
			INVENTORY_PATH,
			createInventoryHandler(inventory),
			"inventory"
		],
		[
			UPDATES_PATH,
			createUpdatesHandler(updates),
			"updates"
		],
		[
			CATALOG_PATH,
			createCatalogHandler(catalog),
			"catalog"
		],
		[
			OPERATIONS_PATH,
			createOperationsHandler(service),
			"operations"
		],
		[
			OPERATIONS_PROGRESS_PATH,
			createOperationsProgressHandler(service),
			"operations-progress"
		],
		[
			RESTART_PATH,
			createRestartHandler(restart),
			"restart"
		]
	]) ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path,
		handler
	}), `dsh-plugin-manager: ${label} route`);
}
var src_default = {
	name,
	inject,
	apply
};

//#endregion
export { apply, src_default as default, inject, name };