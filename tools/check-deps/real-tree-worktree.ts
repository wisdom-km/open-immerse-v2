import { spawnSync } from "node:child_process";
import { realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { withRealTreeLock } from "./real-tree-lock.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const commitConfig = [
  "-c",
  "user.name=oi-gate",
  "-c",
  "user.email=oi-gate@example.com",
  "-c",
  "commit.gpgsign=false",
];

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    const detail = `${result.stderr}${result.stdout}`.trim();
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
  return result.stdout;
}

function gitOk(cwd: string, args: string[]): boolean {
  return spawnSync("git", args, { cwd, encoding: "utf8" }).status === 0;
}

function nextId(): string {
  const rand = Math.random().toString(16).slice(2);
  return `${String(process.pid)}-${String(Date.now())}-${rand}`;
}

function canonical(filePath: string): string {
  const trimmed = filePath.trim().replace(/[\\/]+$/, "");
  const resolved = path.resolve(trimmed);
  let absolute = resolved;
  try {
    absolute = realpathSync(resolved);
  } catch (error) {
    const code =
      error instanceof Error && "code" in error ? String(error.code) : "";
    if (code !== "ENOENT") {
      throw error;
    }
  }
  return absolute.replaceAll("\\", "/").toLowerCase();
}

function listedWorktrees(): string[] {
  const listed = git(repoRoot, ["worktree", "list", "--porcelain"]);
  return listed
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length));
}

function removeByListedPath(root: string): void {
  const wanted = canonical(root);
  const match = listedWorktrees().find((item) => canonical(item) === wanted);
  if (
    match !== undefined &&
    gitOk(repoRoot, ["worktree", "remove", "--force", match])
  ) {
    return;
  }
  rmSync(root, { recursive: true, force: true });
  gitOk(repoRoot, ["worktree", "prune"]);
}

/** Removes a temp worktree. Direct path first; realpath match covers Windows. */
export function removeWorktree(root: string, branch: string): void {
  if (!gitOk(repoRoot, ["worktree", "remove", "--force", root])) {
    removeByListedPath(root);
  }
  const listed = git(repoRoot, ["branch", "--list", branch]);
  const present = listed
    .split("\n")
    .some((line) => line.trim().replace(/^\* /, "") === branch);
  if (present) {
    git(repoRoot, ["branch", "-D", branch]);
  }
}

function assertCheckoutUntouched(): void {
  const status = git(repoRoot, [
    "status",
    "--porcelain",
    "--",
    "packages/features",
  ]);
  const dirty = status.split("\n").filter((line) => {
    return (
      line.includes("_gate-") ||
      line.includes("packages/features/jobs/src/pure.ts")
    );
  });
  if (dirty.length > 0) {
    throw new Error(`probe touched the checkout:\n${dirty.join("\n")}`);
  }
}

function finishWorktree(root: string, branch: string): void {
  try {
    assertCheckoutUntouched();
  } finally {
    removeWorktree(root, branch);
  }
}

export function commitWorktree(root: string, message: string): void {
  git(root, ["add", "packages/features"]);
  git(root, [...commitConfig, "commit", "-m", message]);
}

/** Runs against a temp worktree of HEAD. The real checkout is not written. */
export function withWorktree(run: (root: string, base: string) => void): void {
  withRealTreeLock(() => {
    const id = nextId();
    const branch = `tmp-real-tree-${id}`;
    const root = path.join(tmpdir(), `oi-real-tree-${id}`);
    const base = git(repoRoot, ["rev-parse", "HEAD"]).trim();
    try {
      git(repoRoot, ["worktree", "add", "-b", branch, root, "HEAD"]);
      run(root, base);
    } finally {
      finishWorktree(root, branch);
    }
  });
}
