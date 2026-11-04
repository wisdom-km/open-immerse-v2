import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { commandOutput } from "../gate-remediation/block.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const cruiseScript = path.join(repoRoot, "tools/check-deps/check.mjs");

export type CruiseResult = {
  readonly status: number;
  readonly output: string;
};

export function cruiseRoot(root: string): CruiseResult {
  const result = spawnSync(process.execPath, [cruiseScript], {
    cwd: root,
    encoding: "utf8",
  });
  return { status: result.status ?? 1, output: commandOutput(result) };
}

export function writeProbe(
  root: string,
  relativePath: string,
  text: string,
): void {
  const full = path.join(root, relativePath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, text);
}

export function removeProbe(root: string, relativePath: string): void {
  rmSync(path.join(root, relativePath), { force: true });
}

export function removeEmptyDir(root: string, relativePath: string): void {
  try {
    rmdirSync(path.join(root, relativePath));
  } catch (error) {
    const code =
      error instanceof Error && "code" in error ? String(error.code) : "";
    if (code !== "ENOENT" && code !== "ENOTEMPTY") {
      throw error;
    }
  }
}
