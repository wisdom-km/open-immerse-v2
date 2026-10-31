import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function pipCheck(file: string) {
  return spawnSync("node", [path.resolve("tools/check-license/check-pip.mjs"), "--from-json", file], {
    encoding: "utf8",
  });
}

it("allows PSF-2.0 only for the named dev package (G10, RULES §1.5)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-psf-"));
  try {
    const allowed = path.join(root, "dev.json");
    writeFileSync(allowed, JSON.stringify([{ Name: "typing_extensions", License: "PSF-2.0" }]));
    const allowedResult = pipCheck(allowed);
    expect(allowedResult.status).toBe(0);
    expect(commandOutput(allowedResult)).not.toContain("gate-remediation:");

    const shipped = path.join(root, "runtime.json");
    writeFileSync(shipped, JSON.stringify([{ Name: "oi-worker", License: "PSF-2.0" }]));
    const shippedResult = pipCheck(shipped);
    expect(shippedResult.status).not.toBe(0);
    expect(commandOutput(shippedResult)).toContain(remediationBlock("G10"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
