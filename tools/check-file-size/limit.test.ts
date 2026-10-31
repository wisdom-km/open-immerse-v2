import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function run(root: string) {
  return spawnSync("node", [path.resolve("tools/check-file-size/check.mjs"), "--root", root], {
    encoding: "utf8",
  });
}

it("rejects a source file over 600 lines (G4)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-size-"));
  try {
    const line = "export const n = 1;\n";
    writeFileSync(path.join(root, "big.ts"), line.repeat(601));
    const rejected = run(root);
    expect(rejected.status).not.toBe(0);
    expect(commandOutput(rejected)).toContain(remediationBlock("G4"));
    writeFileSync(path.join(root, "big.ts"), line.repeat(600));
    const accepted = run(root);
    expect(accepted.status).toBe(0);
    expect(commandOutput(accepted)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
