import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";

function npmCheck(file: string) {
  return spawnSync("node", [path.resolve("tools/check-license/check-npm.mjs"), "--from-json", file], {
    encoding: "utf8",
  });
}

it("rejects GPL, AGPL, and LGPL npm licenses (G10)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-lic-"));
  try {
    const gpl = path.join(root, "gpl.json");
    writeFileSync(gpl, JSON.stringify({ "GPL-3.0-only": [{ name: "bad", license: "GPL-3.0-only" }] }));
    const gplResult = npmCheck(gpl);
    expect(gplResult.status).not.toBe(0);
    expect(commandOutput(gplResult)).toContain("GPL-3.0-only");
    expect(commandOutput(gplResult)).toContain(remediationBlock("G10"));

    const agpl = path.join(root, "agpl.json");
    writeFileSync(agpl, JSON.stringify({ "AGPL-3.0-only": [{ name: "bad", license: "AGPL-3.0-only" }] }));
    const agplResult = npmCheck(agpl);
    expect(agplResult.status).not.toBe(0);
    expect(commandOutput(agplResult)).toContain(remediationBlock("G10"));

    const lgpl = path.join(root, "lgpl.json");
    writeFileSync(lgpl, JSON.stringify({ "LGPL-3.0-only": [{ name: "bad", license: "LGPL-3.0-only" }] }));
    const lgplResult = npmCheck(lgpl);
    expect(lgplResult.status).not.toBe(0);
    expect(commandOutput(lgplResult)).toContain(remediationBlock("G10"));

    const ok = path.join(root, "ok.json");
    writeFileSync(ok, JSON.stringify({ MIT: [{ name: "fine", license: "MIT OR Apache-2.0" }] }));
    const okResult = npmCheck(ok);
    expect(okResult.status).toBe(0);
    expect(commandOutput(okResult)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects a lockfile that pins PyMuPDF (G10)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-lock-"));
  try {
    const lock = path.join(root, "uv.lock");
    const report = path.join(root, "ok.json");
    writeFileSync(lock, 'name = "pypdfium2"\nname = "pymupdf"\n');
    writeFileSync(report, "[]");
    const result = spawnSync(
      "node",
      [path.resolve("tools/check-license/check-pip.mjs"), "--from-json", report, "--lockfile", lock],
      { encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain("PyMuPDF");
    expect(commandOutput(result)).toContain(remediationBlock("G10"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
