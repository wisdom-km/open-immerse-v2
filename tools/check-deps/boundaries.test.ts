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

function stubReact(root: string) {
  write(
    root,
    "node_modules/react/package.json",
    '{"name":"react","version":"0.0.0","main":"index.js","types":"index.d.ts"}\n',
  );
  write(root, "node_modules/react/index.js", "export function createElement() { return null; }\n");
  write(root, "node_modules/react/index.d.ts", "export type FC = () => void;\n");
}

function cruise(root: string) {
  const result = spawnSync(
    "node",
    [path.resolve("tools/check-deps/check.mjs"), "--config", config],
    { cwd: root, encoding: "utf8" },
  );
  return { status: result.status ?? 1, output: commandOutput(result) };
}

function withRoot(runCase: (root: string) => void) {
  const root = mkdtempSync(path.join(tmpdir(), "oi-deps-"));
  try {
    stubReact(root);
    runCase(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

it("allows a matrix edge and rejects the other four M1 examples", () => {
  withRoot((root) => {
    write(root, "packages/features/document/src/index.ts", "export const id = 1;\n");
    write(
      root,
      "packages/features/library/src/index.ts",
      'import { id } from "../../document/src/index.ts";\nexport const used = id;\n',
    );
    const legal = cruise(root);
    expect(legal.status).toBe(0);
    expect(legal.output).not.toContain("gate-remediation:");

    write(
      root,
      "packages/features/library/src/domain/calls-ingest.ts",
      'import { id } from "../../../ingest/src/index.ts";\nexport const used = id;\n',
    );
    write(root, "packages/features/ingest/src/index.ts", "export const id = 1;\n");
    const ingest = cruise(root);
    expect(ingest.status).not.toBe(0);
    expect(ingest.output).toContain("feature-dependency-matrix");
    expect(ingest.output).toContain(remediationBlock("G5"));

    write(
      root,
      "packages/features/document/src/domain/view.ts",
      'import type { FC } from "react";\nexport type View = FC;\n',
    );
    const reactType = cruise(root);
    expect(reactType.status).not.toBe(0);
    expect(reactType.output).toContain("core-no-ui");
    expect(reactType.output).toContain(remediationBlock("G13"));

    write(root, "packages/features/notes/src/application/use.ts", "export const id = 1;\n");
    write(
      root,
      "packages/features/reader/src/ui/pane.ts",
      'import { id } from "../../../notes/src/application/use.ts";\nexport const used = id;\n',
    );
    const ui = cruise(root);
    expect(ui.status).not.toBe(0);
    expect(ui.output).toContain("ui-through-seam");
    expect(ui.output).toContain(remediationBlock("G15"));

    write(
      root,
      "packages/features/document/test/core/renders.ts",
      'import { createElement } from "react";\nexport const node = createElement();\n',
    );
    const coreTest = cruise(root);
    expect(coreTest.status).not.toBe(0);
    expect(coreTest.output).toContain("core-test-through-seam");
    expect(coreTest.output).toContain(remediationBlock("G16"));
  });
}, 30_000);
