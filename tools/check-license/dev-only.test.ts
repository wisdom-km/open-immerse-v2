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

it("accepts typing_extensions when the license is PSF-2.0", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-psf-"));
  try {
    const allowed = path.join(root, "typing-extensions.json");
    writeFileSync(allowed, JSON.stringify([{ Name: "typing_extensions", License: "PSF-2.0" }]));
    const allowedResult = pipCheck(allowed);
    expect(allowedResult.status).toBe(0);
    expect(commandOutput(allowedResult)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects an unlisted package with G10 when the license is PSF-2.0", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-psf-"));
  try {
    const shipped = path.join(root, "unlisted.json");
    writeFileSync(shipped, JSON.stringify([{ Name: "oi-worker", License: "PSF-2.0" }]));
    const shippedResult = pipCheck(shipped);
    expect(shippedResult.status).not.toBe(0);
    expect(commandOutput(shippedResult)).toContain(remediationBlock("G10"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
