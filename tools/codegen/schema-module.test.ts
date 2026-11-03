import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { loadProtocolSchemas } from "./schema-module.mjs";

function write(root: string, rel: string, text: string) {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
}

it("loads the entry schema when another file shares its basename", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-schema-base-"));
  try {
    write(
      root,
      "left/item.ts",
      'import { title } from "../right/item.js";\nexport const protocolSchemas = [{ name: "alpha", schema: { type: "string", title } }];\n',
    );
    write(root, "right/item.ts", 'export const title = "from-right";\n');
    const schemas = await loadProtocolSchemas(path.join(root, "left/item.ts"));
    expect(schemas).toEqual([{ name: "alpha", schema: { type: "string", title: "from-right" } }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("loads schemas re-exported with export star", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-schema-star-"));
  try {
    write(root, "entry.ts", 'export * from "./leaf.js";\n');
    write(
      root,
      "leaf.ts",
      'export const protocolSchemas = [{ name: "beta", schema: { type: "number" } }];\n',
    );
    const schemas = await loadProtocolSchemas(path.join(root, "entry.ts"));
    expect(schemas).toEqual([{ name: "beta", schema: { type: "number" } }]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects a dynamic import", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-schema-dyn-"));
  try {
    write(
      root,
      "entry.ts",
      'export const protocolSchemas = [];\nexport const pending = import("./leaf.js");\n',
    );
    write(root, "leaf.ts", "export const value = 1;\n");
    await expect(loadProtocolSchemas(path.join(root, "entry.ts"))).rejects.toThrow(
      /^dynamic import: /,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
