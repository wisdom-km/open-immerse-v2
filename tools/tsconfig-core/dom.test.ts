import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

const tsc = path.resolve("node_modules/.bin/tsc");
const runner = path.resolve("tools/gate-remediation/run.mjs");

function typecheck(root: string, fileName: string) {
  writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      extends: path.resolve("tsconfig.core.json"),
      files: [fileName],
      include: [],
    }),
  );
  return spawnSync(
    "node",
    [runner, "--id", "G14", "--", tsc, "-p", path.join(root, "tsconfig.json"), "--pretty", "false"],
    { encoding: "utf8" },
  );
}

it("rejects DOM and process globals in the core compile environment (G14)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-dom-"));
  try {
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}\n');
    writeFileSync(
      path.join(root, "bad.ts"),
      [
        "export const view = document;",
        "export const host = window;",
        "export const el: HTMLElement | null = null;",
        "export const key: KeyboardEvent | null = null;",
        "export const pid = process.pid;",
        "",
      ].join("\n"),
    );
    const bad = typecheck(root, "bad.ts");
    expect(bad.status).not.toBe(0);
    const output = commandOutput(bad);
    expect(output).toContain("document");
    expect(output).toContain("HTMLElement");
    expect(output).toContain("process");
    expect(output).toContain(remediationBlock("G14"));
    writeFileSync(path.join(root, "ok.ts"), "export const n = 1;\n");
    const ok = typecheck(root, "ok.ts");
    expect(ok.status).toBe(0);
    expect(commandOutput(ok)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
