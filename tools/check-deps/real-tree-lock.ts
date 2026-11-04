import { mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const lockDir = path.join(tmpdir(), "oi-real-tree-lock");
const staleMs = 10 * 60 * 1000;

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function errorCode(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    return String(error.code);
  }
  return "";
}

function lockIsStale(): boolean {
  try {
    return Date.now() - statSync(lockDir).mtimeMs > staleMs;
  } catch (error) {
    return errorCode(error) === "ENOENT";
  }
}

function acquireLock(): void {
  const deadline = Date.now() + 120_000;
  for (;;) {
    try {
      mkdirSync(lockDir);
      return;
    } catch (error) {
      if (errorCode(error) !== "EEXIST") {
        throw error;
      }
      if (lockIsStale()) {
        rmSync(lockDir, { recursive: true, force: true });
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error("real-tree lock timed out", { cause: error });
      }
      sleep(50);
    }
  }
}

/** Serializes temp worktree add and remove on this repo. */
export function withRealTreeLock(run: () => void): void {
  acquireLock();
  try {
    run();
  } finally {
    rmSync(lockDir, { recursive: true, force: true });
  }
}
