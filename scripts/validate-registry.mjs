// registry/plugins.json 结构校验（CI 用）
// 镜像 src/catalog.ts parseRegistryDocument 的核心约束，独立可运行。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const registryPath = fileURLToPath(
  new URL("../registry/plugins.json", import.meta.url),
);
const doc = JSON.parse(readFileSync(registryPath, "utf8"));
const MAX_BYTES = 262144, MAX_ENTRIES = 200;
const IS_SPEC = [
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:@[a-z0-9._*^~+-]+)?$/i,
  /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?(?:#[a-z0-9._/-]+)?$/i,
  /^github:[a-z0-9_.-]+\/[a-z0-9_.-]+(?:#[a-z0-9._/-]+)?$/i,
  /^(?:file:)?[a-z]:[\\/][a-z0-9._\\/-]+\.tgz$/i,
  /^(?:file:)?\/[a-z0-9._/-]+\.tgz$/i,
];
const REPO = /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?$/i;
const ID = /^[a-z0-9][a-z0-9._-]*$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isInstallSpec = (v) =>
  typeof v === "string" && IS_SPEC.some((r) => r.test(v));
const str = (v, max = 500) =>
  typeof v === "string" && v.length > 0 && v.length <= max;
const launchOk = (v) => {
  if (v === null) return true;
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  return (
    (v.kind === "settings" || v.kind === "copy-prompt") &&
    str(v.label, 60) &&
    str(v.target, 500)
  );
};
const entryOk = (x) => {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  return (
    str(x.id, 100) &&
    ID.test(x.id) &&
    str(x.name, 100) &&
    str(x.packageName, 214) &&
    str(x.summary) &&
    str(x.category, 60) &&
    str(x.repository) &&
    REPO.test(x.repository) &&
    str(x.installSpec) &&
    isInstallSpec(x.installSpec) &&
    str(x.version, 60) &&
    str(x.dshCompatibility, 100) &&
    ["verified", "community", "experimental"].includes(x.verificationStatus) &&
    (x.verifiedWithDsh === null || str(x.verifiedWithDsh, 60)) &&
    (x.verifiedAt === null || (str(x.verifiedAt, 30) && DATE.test(x.verifiedAt))) &&
    str(x.maintainer, 100) &&
    str(x.license, 60) &&
    str(x.recommendation) &&
    Array.isArray(x.permissions) &&
    x.permissions.length <= 20 &&
    x.permissions.every((p) => str(p, 100)) &&
    Array.isArray(x.firstUse) &&
    x.firstUse.length > 0 &&
    x.firstUse.length <= 5 &&
    x.firstUse.every((s) => str(s, 200)) &&
    launchOk(x.launch)
  );
};

const errors = [];
if (doc.schemaVersion !== 1) errors.push("schemaVersion must be 1");
if (!str(doc.updatedAt, 40)) errors.push("updatedAt missing or invalid");
if (!Array.isArray(doc.entries) || doc.entries.length > MAX_ENTRIES)
  errors.push("entries must be an array with at most 200 items");
if (JSON.stringify(doc).length > MAX_BYTES)
  errors.push(`document exceeds ${MAX_BYTES} bytes`);
const ids = new Set();
for (const [i, e] of (doc.entries ?? []).entries()) {
  if (!entryOk(e)) errors.push(`entry[${i}] (${e?.id ?? "?"}) failed schema`);
  if (ids.has(e?.id)) errors.push(`duplicate entry id: ${e.id}`);
  ids.add(e?.id);
}
if (errors.length > 0) {
  console.error("registry validation FAILED:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(
  `registry OK: ${doc.entries.length} entries (${[...ids].join(", ")})`,
);
