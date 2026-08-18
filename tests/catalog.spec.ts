import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createCatalogProvider,
  parseRegistryDocument,
} from "../src/catalog.js";
const item = {
  id: "demo-plugin",
  name: "Demo Plugin",
  packageName: "demo-plugin",
  summary: "A verified DSH plugin",
  category: "productivity",
  repository: "https://github.com/example/demo-plugin",
  installSpec: "demo-plugin@1.0.0",
  version: "1.0.0",
  dshCompatibility: ">=0.1.0-rc.6",
  verificationStatus: "verified" as const,
  verifiedWithDsh: "0.1.0-rc.6",
  verifiedAt: "2026-08-18",
  maintainer: "example",
  license: "MIT",
  recommendation: "Useful verified workflow",
  permissions: [],
};
const document = {
  schemaVersion: 1 as const,
  updatedAt: "2026-08-18T00:00:00.000Z",
  entries: [item],
};
describe("recommendation catalog", () => {
  it("validates entries and rejects unsafe install sources", () => {
    expect(parseRegistryDocument(document).entries[0]?.id).toBe("demo-plugin");
    expect(() =>
      parseRegistryDocument({
        ...document,
        entries: [{ ...item, installSpec: "demo;calc" }],
      }),
    ).toThrow();
  });
  it("loads remote catalog and sends ETag on the next request", async () => {
    const home = await mkdtemp(join(tmpdir(), "dpm-catalog-")),
      builtin = join(home, "builtin.json");
    await writeFile(builtin, JSON.stringify({ ...document, entries: [] }));
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(document), {
          status: 200,
          headers: { etag: "v1" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 304 }));
    try {
      const get = createCatalogProvider({
        dshHome: home,
        builtinPath: builtin,
        fetcher,
      });
      expect((await get()).source).toBe("remote");
      expect((await get()).source).toBe("cache");
      expect(fetcher.mock.calls[1]?.[1]?.headers).toMatchObject({
        "if-none-match": "v1",
      });
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });
  it("falls back to builtin when remote and cache are unavailable", async () => {
    const home = await mkdtemp(join(tmpdir(), "dpm-catalog-")),
      builtin = join(home, "builtin.json");
    await writeFile(builtin, JSON.stringify(document));
    try {
      const get = createCatalogProvider({
        dshHome: home,
        builtinPath: builtin,
        fetcher: async () => {
          throw Error("offline");
        },
      });
      const result = await get();
      expect(result.source).toBe("builtin");
      expect(result.entries).toHaveLength(1);
    } finally {
      await rm(home, { recursive: true, force: true });
    }
  });
});
