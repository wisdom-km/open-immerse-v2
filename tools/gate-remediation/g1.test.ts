import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "./block.js";

it(
  "prints G1 remediation for a prettier violation that stays outside the required check",
  { timeout: 20_000 },
  () => {
    const root = mkdtempSync(path.join(tmpdir(), "oi-prettier-"));
    const source = path.join(root, "unformatted.mjs");
    try {
      writeFileSync(
        source,
        readFileSync("tools/gate-fixtures/g1/unformatted.mjs"),
      );
      const result = spawnSync(
        "node",
        [
          path.resolve("tools/gate-remediation/run.mjs"),
          "--id",
          "G1",
          "--",
          "prettier",
          "--check",
          source,
        ],
        { encoding: "utf8" },
      );
      expect(result.status).not.toBe(0);
      const output = commandOutput(result);
      expect(output).toContain("Code style issues");
      expect(output).toContain(remediationBlock("G1"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }

    const ignore = readFileSync(".prettierignore", "utf8");
    expect(ignore).toContain("tools/gate-fixtures");
    expect(ignore).toContain(".github");
    expect(ignore).toContain("**/*.md");
    const pkg = readFileSync("package.json", "utf8");
    expect(pkg).toContain('"check:format"');
    expect(pkg).toContain("--id G1");
    expect(readFileSync(".github/workflows/ci.yml", "utf8")).not.toContain(
      "prettier",
    );

    const required = spawnSync("node", ["tools/check-format/check.mjs"], {
      encoding: "utf8",
    });
    expect(required.status).toBe(0);
    expect(commandOutput(required)).not.toContain("gate-fixtures/g1");
    expect(commandOutput(required)).not.toContain("gate-remediation:");
  },
);
