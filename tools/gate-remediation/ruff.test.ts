import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "./block.js";

function ruff(id: string, args: string[]) {
  return spawnSync(
    "node",
    [
      path.resolve("tools/gate-remediation/run.mjs"),
      "--id",
      id,
      "--cwd",
      path.resolve("workers/parser"),
      "--",
      "uv",
      "run",
      "ruff",
      ...args,
    ],
    { encoding: "utf8" },
  );
}

it("prints G2 remediation when ruff complexity is too high", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-ruff-"));
  const source = path.join(root, "too_complex.py");
  try {
    const lines = ["def too_complex(n: int) -> int:"];
    for (let index = 0; index < 16; index += 1) {
      lines.push(`    if n == ${String(index)}:`);
      lines.push(`        return ${String(index)}`);
    }
    lines.push("    return -1");
    writeFileSync(source, `${lines.join("\n")}\n`);
    const result = ruff("G2", ["check", "--config", "pyproject.toml", source]);
    expect(result.status).not.toBe(0);
    const output = commandOutput(result);
    expect(output).toContain("C901");
    expect(output).toContain(remediationBlock("G2"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("prints G1 remediation when ruff format finds a diff", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-fmt-"));
  const source = path.join(root, "compact.py");
  try {
    writeFileSync(source, "def label(count:int)->int:\n    return count+1\n");
    const result = ruff("G1", ["format", "--check", "--config", "pyproject.toml", source]);
    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain(remediationBlock("G1"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
