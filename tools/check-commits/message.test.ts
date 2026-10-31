import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function git(cwd: string, args: string[]) {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

it("rejects a subject outside Conventional Commits", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-commit-"));
  try {
    git(root, ["init"]);
    git(root, ["config", "user.email", "gate@example.com"]);
    git(root, ["config", "user.name", "gate"]);
    writeFileSync(path.join(root, "README.md"), "base\n");
    git(root, ["add", "README.md"]);
    git(root, ["commit", "-m", "chore: base"]);
    writeFileSync(path.join(root, "README.md"), "next\n");
    git(root, ["add", "README.md"]);
    git(root, ["commit", "-m", "update stuff"]);
    const rejected = spawnSync(
      "node",
      [path.resolve("tools/check-commits/check.mjs"), "--base", "HEAD~1"],
      { cwd: root, encoding: "utf8" },
    );
    expect(rejected.status).not.toBe(0);
    expect(commandOutput(rejected)).toContain(remediationBlock("E-P1-5"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
