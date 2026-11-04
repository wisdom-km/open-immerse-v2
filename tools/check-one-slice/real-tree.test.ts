import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

const script = path.resolve("tools/check-one-slice/check.mjs");

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function write(root: string, relativePath: string, text: string): void {
  const full = path.join(root, relativePath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
}

function check(root: string, base: string) {
  return spawnSync("node", [script, "--base", base], {
    cwd: root,
    encoding: "utf8",
  });
}

function commit(root: string, message: string): void {
  git(root, ["add", "packages/features"]);
  git(root, ["-c", "commit.gpgsign=false", "commit", "-m", message]);
}

function proveOneSlice(root: string, base: string): void {
  write(
    root,
    "packages/features/jobs/src/ui/_gate-pane.ts",
    "export const n = 1;\n",
  );
  write(
    root,
    "packages/features/jobs/src/domain/_gate-sync.ts",
    "export const n = 1;\n",
  );
  commit(root, "test(jobs): temporary same-slice ui and domain");
  const one = check(root, base);
  expect(one.status).toBe(0);
  expect(commandOutput(one)).not.toContain("gate-remediation:");
}

function proveTwoSlices(root: string, base: string): void {
  write(
    root,
    "packages/features/markdown/src/domain/_gate-extra.ts",
    "export const n = 1;\n",
  );
  commit(root, "test(markdown): temporary second slice");
  const two = check(root, base);
  const output = commandOutput(two);
  expect(two.status).not.toBe(0);
  expect(output).toContain("more than one feature slice");
  expect(output).toContain(remediationBlock("G18"));
  git(root, ["reset", "--hard", base]);
  const gone = check(root, base);
  expect(gone.status).toBe(0);
  expect(commandOutput(gone)).not.toContain("gate-remediation:");
}

function removeWorktree(root: string, branch: string): void {
  const listed = git(process.cwd(), ["worktree", "list", "--porcelain"]);
  if (listed.includes(root)) {
    git(process.cwd(), ["worktree", "remove", "--force", root]);
  } else {
    rmSync(root, { recursive: true, force: true });
  }
  const branches = git(process.cwd(), ["branch", "--list", branch]);
  if (branches.includes(branch)) {
    git(process.cwd(), ["branch", "-D", branch]);
  }
}

it("rejects a second real feature slice and passes after that commit is removed (G18)", () => {
  const base = git(process.cwd(), ["rev-parse", "HEAD"]).trim();
  const branch = `tmp-g18-${String(process.pid)}`;
  const root = path.join(tmpdir(), `oi-g18-${String(process.pid)}`);
  try {
    git(process.cwd(), ["worktree", "add", "-b", branch, root, "HEAD"]);
    proveOneSlice(root, base);
    proveTwoSlices(root, base);
  } finally {
    removeWorktree(root, branch);
  }
}, 120_000);
