import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import type { Dirent } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

const repo = path.resolve(".");
const schema = path.resolve("packages/contracts/src/worker/schemas.ts");
const parser = path.resolve("workers/parser");
const codegen = path.resolve("tools/codegen/run.mjs");

function git(cwd: string, args: string[]): void {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

function generate(root: string, output: string): void {
  execFileSync(
    "node",
    [
      codegen,
      "--root",
      root,
      "--manifest",
      path.join(root, "manifest.json"),
      "--protocol-schema",
      schema,
      "--protocol-output",
      output,
      "--parser-root",
      parser,
    ],
    { cwd: repo, stdio: "pipe" },
  );
}

function snapshot(dir: string): readonly (readonly [string, string])[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".py"))
    .sort()
    .map((name) => [name, readFileSync(path.join(dir, name), "utf8")] as const);
}

function prepare(root: string): string {
  writeFileSync(
    path.join(root, "manifest.json"),
    JSON.stringify({ generators: [] }),
  );
  const left = path.join(root, "left");
  const right = path.join(root, "right");
  generate(root, left);
  generate(root, right);
  expect(snapshot(left)).toEqual(snapshot(right));
  const output = path.join(root, "protocol");
  generate(root, output);
  assertNoSchemaLoaderInContracts();
  return output;
}

function assertNoSchemaLoaderInContracts(): void {
  const pending = [path.resolve("packages/contracts")];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) {
      return;
    }
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      visitContractsEntry(pending, current, entry);
    }
  }
}

function visitContractsEntry(
  pending: string[],
  current: string,
  entry: Dirent,
): void {
  if (entry.isDirectory()) {
    if (entry.name !== "node_modules") {
      pending.push(path.join(current, entry.name));
    }
    return;
  }
  expect(entry.name.endsWith(".codegen.mjs")).toBe(false);
}

it(
  "codegen leaves a diff when a generated protocol model is hand edited (G7)",
  { timeout: 180_000 },
  () => {
    const root = mkdtempSync(path.join(tmpdir(), "oi-proto-"));
    try {
      const output = prepare(root);
      git(root, ["init"]);
      git(root, ["config", "user.email", "gate@example.com"]);
      git(root, ["config", "user.name", "gate"]);
      git(root, ["add", "."]);
      git(root, ["commit", "-m", "chore: generated"]);
      const health = path.join(output, "health.py");
      writeFileSync(health, `${readFileSync(health, "utf8")}\n# hand edit\n`);
      git(root, ["add", "."]);
      git(root, ["commit", "-m", "chore: hand edit"]);
      generate(root, output);
      const drifted = spawnSync(
        "node",
        [
          path.resolve("tools/gate-remediation/run.mjs"),
          "--id",
          "G7",
          "--cwd",
          root,
          "--",
          "git",
          "diff",
          "--exit-code",
        ],
        { encoding: "utf8" },
      );
      expect(drifted.status).not.toBe(0);
      expect(commandOutput(drifted)).toContain(remediationBlock("G7"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
