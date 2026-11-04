import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";
import {
  commitWorktree,
  withWorktree,
} from "../check-deps/real-tree-worktree.js";

const script = path.resolve("tools/check-one-slice/check.mjs");

function check(root: string, base: string) {
  return spawnSync(process.execPath, [script, "--base", base], {
    cwd: root,
    encoding: "utf8",
  });
}

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    const detail = `${result.stderr}${result.stdout}`.trim();
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
  return result.stdout;
}

function write(root: string, relativePath: string, text: string): void {
  const full = path.join(root, relativePath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
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
  commitWorktree(root, "test(jobs): temporary same-slice ui and domain");
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
  commitWorktree(root, "test(markdown): temporary second slice");
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

it("rejects a second real feature slice and passes after that commit is removed (G18)", () => {
  withWorktree((root, base) => {
    proveOneSlice(root, base);
    proveTwoSlices(root, base);
  });
}, 120_000);
