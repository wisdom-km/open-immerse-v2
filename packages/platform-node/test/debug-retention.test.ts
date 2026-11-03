import {
  existsSync,
  mkdtempSync,
  statSync,
  truncateSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { DEBUG_LOG_MAX_AGE_MS, DEBUG_LOG_MAX_BYTES } from "@oi/kernel";
import { expect, it } from "vitest";

import { enforceDebugRetention } from "../src/logging/debug-retention.js";

const now = Date.parse("2026-11-03T00:00:00.000Z");

function directory(): string {
  return mkdtempSync(path.join(tmpdir(), "oi-debug-"));
}

function plant(
  dir: string,
  name: string,
  size: number,
  mtimeMs: number,
): string {
  const fullPath = path.join(dir, name);
  writeFileSync(fullPath, "");
  truncateSync(fullPath, size);
  const seconds = mtimeMs / 1000;
  utimesSync(fullPath, seconds, seconds);
  return fullPath;
}

it("AC-101 deletes files older than 7 days when retention runs", () => {
  const dir = directory();
  const stale = plant(dir, "old.jsonl", 10, now - DEBUG_LOG_MAX_AGE_MS - 1000);
  const fresh = plant(dir, "new.jsonl", 10, now - DEBUG_LOG_MAX_AGE_MS);
  enforceDebugRetention(dir, now);
  expect(statOrMissing(stale)).toBeUndefined();
  expect(statSync(fresh).isFile()).toBe(true);
});

it("AC-101 deletes the oldest files first when the total exceeds 50 MB", () => {
  const dir = directory();
  const chunk = 20 * 1024 * 1024;
  const oldest = plant(dir, "a.jsonl", chunk, now - 3000);
  const middle = plant(dir, "b.jsonl", chunk, now - 2000);
  const newest = plant(dir, "c.jsonl", chunk, now - 1000);
  enforceDebugRetention(dir, now);
  expect(statOrMissing(oldest)).toBeUndefined();
  expect(statSync(middle).size + statSync(newest).size).toBeLessThanOrEqual(
    DEBUG_LOG_MAX_BYTES,
  );
});

it("AC-101 deletes one file when that file alone exceeds 50 MB", () => {
  const dir = directory();
  const huge = plant(dir, "huge.jsonl", DEBUG_LOG_MAX_BYTES + 1, now);
  enforceDebugRetention(dir, now);
  expect(statOrMissing(huge)).toBeUndefined();
});

it("AC-101 keeps a file when its size is exactly 50 MB", () => {
  const dir = directory();
  const exact = plant(dir, "exact.jsonl", DEBUG_LOG_MAX_BYTES, now);
  enforceDebugRetention(dir, now);
  expect(statSync(exact).size).toBe(DEBUG_LOG_MAX_BYTES);
});

function statOrMissing(fullPath: string): number | undefined {
  if (!existsSync(fullPath)) {
    return undefined;
  }
  return statSync(fullPath).size;
}
