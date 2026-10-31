import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function scan(root: string) {
  return spawnSync("node", [path.resolve("tools/check-core-tests/check.mjs"), "--root", root], {
    encoding: "utf8",
  });
}

it("rejects a vitest environment directive in a core test (G16)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-core-"));
  const file = path.join(root, "packages/features/document/test/core/renders.ts");
  try {
    mkdirSync(path.dirname(file), { recursive: true });
    const marker = ["@", "vitest-environment"].join("");
    writeFileSync(file, `// ${marker} jsdom\nexport const n = 1;\n`);
    const rejected = scan(root);
    expect(rejected.status).not.toBe(0);
    expect(commandOutput(rejected)).toContain(remediationBlock("G16"));
    writeFileSync(file, "export const n = 1;\n");
    const accepted = scan(root);
    expect(accepted.status).toBe(0);
    expect(commandOutput(accepted)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
