import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

function pipCheck(file: string) {
  try {
    execFileSync("node", [path.resolve("tools/check-license/check-pip.mjs"), "--from-json", file], {
      encoding: "utf8",
    });
    return 0;
  } catch (error) {
    const failed = error as { status?: number };
    return failed.status ?? 1;
  }
}

it("allows PSF-2.0 only for the named dev package (G10, RULES §1.5)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-psf-"));
  try {
    const allowed = path.join(root, "dev.json");
    writeFileSync(allowed, JSON.stringify([{ Name: "typing_extensions", License: "PSF-2.0" }]));
    expect(pipCheck(allowed)).toBe(0);

    const shipped = path.join(root, "runtime.json");
    writeFileSync(shipped, JSON.stringify([{ Name: "oi-worker", License: "PSF-2.0" }]));
    expect(pipCheck(shipped)).not.toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
