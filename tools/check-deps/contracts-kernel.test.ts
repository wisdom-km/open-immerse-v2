import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function write(root: string, rel: string, text: string) {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
}

function writeClosedConfig(root: string): string {
  const tsconfig = path.join(root, "tsconfig.paths.json");
  write(
    root,
    "tsconfig.paths.json",
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: ".",
          paths: { "@oi/kernel": ["packages/kernel/src/index.ts"] },
        },
      },
      null,
      2,
    )}\n`,
  );
  const rules = pathToFileURL(path.resolve("tools/check-deps/build-rules.mjs")).href;
  write(
    root,
    "dependency-cruiser.config.mjs",
    [
      `import { forbiddenRules } from ${JSON.stringify(rules)};`,
      "export default {",
      "  forbidden: forbiddenRules(),",
      "  options: {",
      "    tsPreCompilationDeps: true,",
      `    tsConfig: { fileName: ${JSON.stringify(tsconfig)} },`,
      '    doNotFollow: { path: "node_modules" },',
      "    enhancedResolveOptions: {",
      '      exportsFields: ["exports"],',
      '      conditionNames: ["import", "require", "node", "default"],',
      "    },",
      "  },",
      "};",
      "",
    ].join("\n"),
  );
  return path.join(root, "dependency-cruiser.config.mjs");
}

function cruise(root: string, config: string) {
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
  write(root, "packages/kernel/src/index.ts", 'export type { Result } from "./result.ts";\n');
  write(
    root,
    "packages/contracts/src/result.ts",
    'export type { Result } from "../../kernel/src/result.ts";\n',
  );
  write(root, "packages/contracts/src/from-package.ts", 'export type { Result } from "@oi/kernel";\n');
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
    const config = writeClosedConfig(root);
    const legal = cruise(root, config);
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
    const rejected = cruise(root, config);
    expect(rejected.status).not.toBe(0);
    expect(rejected.output).toContain("contracts-kernel-type-only");
    expect(rejected.output).toContain("value-relative.ts");
    expect(rejected.output).toContain("value-package.ts");
    expect(rejected.output).toContain("→ packages/kernel/src/index.ts");
    expect(rejected.output).not.toContain(path.resolve("packages/kernel/src/index.ts"));
    expect(rejected.output).toContain(remediationBlock("G5"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 30_000);
