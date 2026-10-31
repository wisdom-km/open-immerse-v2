import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

it("rejects a model manifest whose license is GPL (G10)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-model-"));
  const manifest = path.join(root, "models.json");
  try {
    writeFileSync(
      manifest,
      JSON.stringify([
        {
          name: "example",
          version: "0",
          sha256: "abc",
          license: "GPL-3.0-only",
          source: "https://example.invalid/model",
        },
      ]),
    );
    const result = spawnSync(
      "node",
      [path.resolve("tools/check-license/check-models.mjs"), "--manifest", manifest],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain("GPL-3.0-only");
    expect(commandOutput(result)).toContain(remediationBlock("G10"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
