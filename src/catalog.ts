import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isInstallSpec } from "./operations.js";
import type {
  CatalogSource,
  PluginCatalog,
  PluginCatalogEntry,
  PluginRegistryDocument,
} from "./shared.js";
export const DEFAULT_CATALOG_URL =
  "https://raw.githubusercontent.com/onlyforchris/dsh-plugin-manager/main/registry/plugins.json";
const MAX_BYTES = 262144,
  MAX_ENTRIES = 200,
  CACHE_MAX_AGE = 604800000;
interface CacheRecord {
  readonly schemaVersion: 1;
  readonly etag: string | null;
  readonly fetchedAt: string;
  readonly document: PluginRegistryDocument;
}
function str(v: unknown, max = 500): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}
function entry(v: unknown): v is PluginCatalogEntry {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const x = v as Record<string, unknown>,
    s = x.verificationStatus;
  return (
    str(x.id, 100) &&
    /^[a-z0-9][a-z0-9._-]*$/i.test(x.id) &&
    str(x.name, 100) &&
    str(x.packageName, 214) &&
    str(x.summary) &&
    str(x.category, 60) &&
    str(x.repository) &&
    /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?$/i.test(
      x.repository,
    ) &&
    str(x.installSpec) &&
    isInstallSpec(x.installSpec) &&
    str(x.version, 60) &&
    str(x.dshCompatibility, 100) &&
    (s === "verified" || s === "community" || s === "experimental") &&
    (x.verifiedWithDsh === null || str(x.verifiedWithDsh, 60)) &&
    (x.verifiedAt === null ||
      (str(x.verifiedAt, 30) && /^\d{4}-\d{2}-\d{2}$/.test(x.verifiedAt))) &&
    str(x.maintainer, 100) &&
    str(x.license, 60) &&
    str(x.recommendation) &&
    Array.isArray(x.permissions) &&
    x.permissions.length <= 20 &&
    x.permissions.every((p) => str(p, 100))
  );
}
export function parseRegistryDocument(v: unknown): PluginRegistryDocument {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("catalog_invalid");
  const x = v as Record<string, unknown>;
  if (
    x.schemaVersion !== 1 ||
    !str(x.updatedAt, 40) ||
    !Array.isArray(x.entries) ||
    x.entries.length > MAX_ENTRIES ||
    !x.entries.every(entry)
  )
    throw Error("catalog_invalid");
  const ids = new Set<string>();
  for (const e of x.entries as PluginCatalogEntry[]) {
    if (ids.has(e.id)) throw Error("catalog_duplicate_id");
    ids.add(e.id);
  }
  return x as unknown as PluginRegistryDocument;
}
async function json(p: string): Promise<unknown> {
  return JSON.parse(await readFile(p, "utf8"));
}
async function builtin(p?: string) {
  return parseRegistryDocument(
    await json(
      p ?? fileURLToPath(new URL("../registry/plugins.json", import.meta.url)),
    ),
  );
}
async function cache(p: string): Promise<CacheRecord | null> {
  try {
    const v = (await json(p)) as CacheRecord;
    if (v.schemaVersion !== 1 || !str(v.fetchedAt, 40)) return null;
    return { ...v, document: parseRegistryDocument(v.document) };
  } catch {
    return null;
  }
}
function out(
  d: PluginRegistryDocument,
  source: CatalogSource,
  x: {
    sourceUrl?: string | null;
    fetchedAt?: string | null;
    stale?: boolean;
    message: string;
  },
): PluginCatalog {
  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    source,
    sourceUrl: x.sourceUrl ?? null,
    fetchedAt: x.fetchedAt ?? null,
    stale: x.stale ?? false,
    message: x.message,
    entries: d.entries,
  };
}
export function createCatalogProvider(input: {
  readonly dshHome: string;
  readonly remoteUrl?: string;
  readonly timeoutMs?: number;
  readonly fetcher?: typeof fetch;
  readonly builtinPath?: string;
}): () => Promise<PluginCatalog> {
  const url = input.remoteUrl ?? DEFAULT_CATALOG_URL,
    fetcher = input.fetcher ?? fetch,
    dir = join(input.dshHome, "cache", "dsh-plugin-manager"),
    path = join(dir, "registry.json");
  let running: Promise<PluginCatalog> | null = null;
  return async () => {
    if (running) return running;
    running = (async () => {
      const base = await builtin(input.builtinPath),
        saved = await cache(path),
        controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 4000);
      try {
        const headers: Record<string, string> = {
          accept: "application/json",
          "user-agent": "dsh-plugin-manager",
        };
        if (saved?.etag) headers["if-none-match"] = saved.etag;
        const r = await fetcher(url, { headers, signal: controller.signal });
        if (r.status === 304 && saved)
          return out(saved.document, "cache", {
            sourceUrl: url,
            fetchedAt: saved.fetchedAt,
            message: "远程目录未变化，已使用本地缓存",
          });
        if (!r.ok) throw Error("catalog_http");
        const text = await r.text();
        if (text.length > MAX_BYTES) throw Error("catalog_too_large");
        const document = parseRegistryDocument(JSON.parse(text)),
          record: CacheRecord = {
            schemaVersion: 1,
            etag: r.headers.get("etag"),
            fetchedAt: new Date().toISOString(),
            document,
          };
        await mkdir(dir, { recursive: true });
        await writeFile(path + ".tmp", JSON.stringify(record, null, 2), "utf8");
        await rename(path + ".tmp", path);
        return out(document, "remote", {
          sourceUrl: url,
          fetchedAt: record.fetchedAt,
          message: "已加载远程推荐目录",
        });
      } catch {
        if (saved) {
          const stale =
            Date.now() - Date.parse(saved.fetchedAt) > CACHE_MAX_AGE;
          return out(saved.document, "cache", {
            sourceUrl: url,
            fetchedAt: saved.fetchedAt,
            stale,
            message: stale
              ? "远程目录不可用，当前缓存已超过 7 天"
              : "远程目录不可用，已使用本地缓存",
          });
        }
        return out(base, "builtin", {
          message: "远程目录不可用，已使用安装包内置目录",
        });
      } finally {
        clearTimeout(timer);
      }
    })();
    try {
      return await running;
    } finally {
      running = null;
    }
  };
}
