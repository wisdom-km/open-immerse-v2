import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

it("rejects a composition-root diff over 30 lines (G11)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-hot-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    writeFileSync(path.join(root, "composition-root.ts"), "export const n = 1;\n");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "chore: base"]);
    writeFileSync(path.join(root, "composition-root.ts"), "export const n = 1;\n".repeat(40));
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "chore: widen root"]);
    const rejected = spawnSync(
      "node",
      [path.resolve("tools/check-hotspots/check.mjs"), "--base", "HEAD~1"],
      { cwd: root, encoding: "utf8" },
    );
    expect(rejected.status).not.toBe(0);
    expect(commandOutput(rejected)).toContain(remediationBlock("G11"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
