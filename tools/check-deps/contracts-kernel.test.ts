import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

const config = path.resolve("dependency-cruiser.config.mjs");

function write(root: string, rel: string, text: string) {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
}

function cruise(root: string) {
  const result = spawnSync(
    "node",
    [path.resolve("tools/check-deps/check.mjs"), "--config", config],
    { cwd: root, encoding: "utf8" },
  );
  return { status: result.status ?? 1, output: commandOutput(result) };
}

function seedTypeOnly(root: string) {
  write(
    root,
    "packages/kernel/src/result.ts",
    "export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };\n",
  );
  write(
    root,
    "packages/contracts/src/result.ts",
    'export type { Result } from "../../kernel/src/result.ts";\n',
  );
  write(
    root,
    "packages/contracts/src/from-package.ts",
    'export type { Result } from "@oi/kernel";\n',
  );
  write(
    root,
    "packages/contracts/src/import-type.ts",
    'import type { Result } from "@oi/kernel";\nexport type Again = Result;\n',
  );
}

it("allows a type-only kernel re-export and rejects a value import", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-kernel-edge-"));
  try {
    seedTypeOnly(root);
    const legal = cruise(root);
    expect(legal.status).toBe(0);
    expect(legal.output).not.toContain("contracts-kernel-type-only");

    write(
      root,
      "packages/contracts/src/value-relative.ts",
      'export { Result } from "../../kernel/src/result.ts";\n',
    );
    write(
      root,
      "packages/contracts/src/value-package.ts",
      'import { Result } from "@oi/kernel";\nexport const leak: unknown = Result;\n',
    );
    const rejected = cruise(root);
    expect(rejected.status).not.toBe(0);
    expect(rejected.output).toContain("contracts-kernel-type-only");
    expect(rejected.output).toContain("value-relative.ts");
    expect(rejected.output).toContain("value-package.ts");
    expect(rejected.output).toContain(remediationBlock("G5"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 30_000);
