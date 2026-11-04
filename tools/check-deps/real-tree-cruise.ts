import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { commandOutput } from "../gate-remediation/block.js";

export type CruiseResult = {
  readonly status: number;
  readonly output: string;
};

export function cruiseRepo(): CruiseResult {
  const result = spawnSync(
    "node",
    [path.resolve("tools/check-deps/check.mjs")],
    { cwd: path.resolve("."), encoding: "utf8" },
  );
  return { status: result.status ?? 1, output: commandOutput(result) };
}

export function writeProbe(relativePath: string, text: string): void {
  const full = path.resolve(relativePath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
}

export function removeProbe(relativePath: string): void {
  rmSync(path.resolve(relativePath), { force: true });
}

export function removeEmptyDir(relativePath: string): void {
  try {
    rmdirSync(path.resolve(relativePath));
  } catch (error) {
    const code =
      error instanceof Error && "code" in error ? String(error.code) : "";
    if (code !== "ENOENT" && code !== "ENOTEMPTY") {
      throw error;
    }
  }
}
