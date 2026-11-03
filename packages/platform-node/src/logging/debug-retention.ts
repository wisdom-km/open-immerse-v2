import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";

import { DEBUG_LOG_MAX_AGE_MS, DEBUG_LOG_MAX_BYTES } from "@oi/kernel";

type DebugFile = {
  readonly name: string;
  readonly fullPath: string;
  readonly mtimeMs: number;
  readonly size: number;
};

/** 年龄和删除顺序看 mtime。写入方把 mtime 设成注入时钟的 nowMs。 */
export function enforceDebugRetention(directory: string, nowMs: number): void {
  const staleBefore = nowMs - DEBUG_LOG_MAX_AGE_MS;
  for (const file of listDebugFiles(directory)) {
    if (file.mtimeMs < staleBefore) {
      unlinkSync(file.fullPath);
    }
  }
  deleteOldestUntilWithinCap(listDebugFiles(directory));
}

export function clearDebugDirectory(directory: string): void {
  for (const file of listDebugFiles(directory)) {
    unlinkSync(file.fullPath);
  }
}

function deleteOldestUntilWithinCap(files: readonly DebugFile[]): void {
  const ordered = [...files].sort(oldestFirst);
  let total = 0;
  for (const file of ordered) {
    total += file.size;
  }
  for (const file of ordered) {
    if (total <= DEBUG_LOG_MAX_BYTES) {
      return;
    }
    unlinkSync(file.fullPath);
    total -= file.size;
  }
}

function oldestFirst(left: DebugFile, right: DebugFile): number {
  if (left.mtimeMs !== right.mtimeMs) {
    return left.mtimeMs - right.mtimeMs;
  }
  return left.name.localeCompare(right.name);
}

function listDebugFiles(directory: string): readonly DebugFile[] {
  if (!existsSync(directory)) {
    return [];
  }
  const files: DebugFile[] = [];
  for (const name of readdirSync(directory)) {
    const fullPath = path.join(directory, name);
    const stat = statSync(fullPath);
    if (!stat.isFile()) {
      continue;
    }
    files.push({ name, fullPath, mtimeMs: stat.mtimeMs, size: stat.size });
  }
  return files;
}
