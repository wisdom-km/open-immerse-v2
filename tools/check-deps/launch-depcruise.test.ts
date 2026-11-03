import { existsSync, readFileSync } from "node:fs";
import { findPackageJSON } from "node:module";
import path from "node:path";
import process from "node:process";
import { expect, it } from "vitest";

import { launchDepcruise } from "./launch-depcruise.mjs";

interface SpawnOptions {
  readonly encoding: "utf8";
  readonly shell?: boolean;
}

interface SpawnCall {
  readonly command: string;
  readonly args: readonly string[];
  readonly options: SpawnOptions;
}

function depcruiseBinRelative(pkg: unknown): string {
  if (pkg === null || typeof pkg !== "object" || Array.isArray(pkg) || !("bin" in pkg)) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  const binField = pkg.bin;
  if (
    binField === null ||
    typeof binField !== "object" ||
    Array.isArray(binField) ||
    !("depcruise" in binField)
  ) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  const relative = binField.depcruise;
  if (typeof relative !== "string" || relative.length === 0) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  return relative;
}

function resolvedDepcruiseEntry(): string {
  const pkgPath = findPackageJSON("dependency-cruiser", import.meta.url);
  if (pkgPath === undefined) {
    throw new Error("dependency-cruiser bin.depcruise was not found");
  }
  const parsed: unknown = JSON.parse(readFileSync(pkgPath, "utf8"));
  return path.resolve(path.dirname(pkgPath), depcruiseBinRelative(parsed));
}

function recordSpawn(calls: SpawnCall[]) {
  return (command: string, args: readonly string[], options: SpawnOptions) => {
    calls.push({ command, args, options });
    return { status: 0, stdout: "", stderr: "" };
  };
}

it("passes process.execPath and the dependency-cruiser JS entry to spawn when cruising", () => {
  const calls: SpawnCall[] = [];
  const entry = resolvedDepcruiseEntry();
  launchDepcruise(recordSpawn(calls), ["--output-type", "err"]);
  expect(calls).toEqual([
    {
      command: process.execPath,
      args: [entry, "--output-type", "err"],
      options: { encoding: "utf8" },
    },
  ]);
  expect(path.isAbsolute(entry)).toBe(true);
  expect(entry).not.toMatch(/[/\\]\.bin[/\\]/);
  expect(path.extname(entry)).toMatch(/^\.(?:js|mjs|cjs)$/);
  expect(existsSync(entry)).toBe(true);
});
