import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "./block.js";

it("prints G6 remediation when import-linter rejects pymupdf", () => {
  const target = path.resolve("workers/parser/oi_worker/preprocess/_gate_pymupdf.py");
  writeFileSync(target, "import pymupdf\n");
  try {
    const result = spawnSync(
      "node",
      [
        path.resolve("tools/gate-remediation/run.mjs"),
        "--id",
        "G6",
        "--cwd",
        path.resolve("workers/parser"),
        "--",
        "uv",
        "run",
        "lint-imports",
      ],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    const output = commandOutput(result);
    expect(output.toLowerCase()).toContain("pymupdf");
    expect(output).toContain(remediationBlock("G6"));
  } finally {
    rmSync(target, { force: true });
  }
});
