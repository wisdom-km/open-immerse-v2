import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

it("rejects a diff over 600 lines unless the commits include a G12 reason", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-pr-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    writeFileSync(path.join(root, "README.md"), "base\n");
    git(root, ["add", "README.md"]);
    git(root, ["commit", "-m", "chore: base"]);
    const base = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    writeFileSync(path.join(root, "wide.ts"), "export const n = 1;\n".repeat(601));
    git(root, ["add", "wide.ts"]);
    git(root, ["commit", "-m", "chore: widen"]);
    const script = path.resolve("tools/check-pr-size/check.mjs");
    const rejected = spawnSync("node", [script, "--base", base], { cwd: root, encoding: "utf8" });
    expect(rejected.status).not.toBe(0);
    expect(commandOutput(rejected)).toContain(remediationBlock("G12"));

    git(root, ["commit", "--allow-empty", "-m", "chore: explain\n\nG12: fixture stays together"]);
    const allowed = spawnSync("node", [script, "--base", base], { cwd: root, encoding: "utf8" });
    expect(allowed.status).toBe(0);
    expect(commandOutput(allowed)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
