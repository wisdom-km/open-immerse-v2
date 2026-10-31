import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

function run(root: string) {
  try {
    execFileSync("node", [path.resolve("tools/check-file-size/check.mjs"), "--root", root], {
      encoding: "utf8",
    });
    return 0;
  } catch (error) {
    const failed = error as { status?: number };
    return failed.status ?? 1;
  }
}

it("rejects a source file over 600 lines (G4)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-size-"));
  try {
    const line = "export const n = 1;\n";
    writeFileSync(path.join(root, "big.ts"), line.repeat(601));
    expect(run(root)).not.toBe(0);
    writeFileSync(path.join(root, "big.ts"), line.repeat(600));
    expect(run(root)).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
