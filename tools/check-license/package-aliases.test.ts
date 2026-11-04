import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { commandOutput, remediationBlock } from "../gate-remediation/block.js";
import { licenseAllowed, reportedLicense } from "./policy.mjs";

function pipCheck(file: string) {
  return spawnSync(
    "node",
    [path.resolve("tools/check-license/check-pip.mjs"), "--from-json", file],
    { encoding: "utf8" },
  );
}

function pipReport(name: string, license: string) {
  const root = mkdtempSync(path.join(tmpdir(), "oi-alias-"));
  const file = path.join(root, "report.json");
  writeFileSync(file, JSON.stringify([{ Name: name, License: license }]));
  return { root, result: pipCheck(file) };
}

it("maps colorama to BSD-3-Clause when pip reports BSD License", () => {
  expect(reportedLicense("colorama", "BSD License")).toBe("BSD-3-Clause");
  expect(licenseAllowed("colorama", "BSD License")).toBe(true);
  const { root, result } = pipReport("colorama", "BSD License");
  try {
    expect(result.status).toBe(0);
    expect(commandOutput(result)).not.toContain("gate-remediation:");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("rejects an unlisted package when pip reports BSD License", () => {
  expect(reportedLicense("not-colorama", "BSD License")).toBe("BSD License");
  expect(licenseAllowed("not-colorama", "BSD License")).toBe(false);
  const { root, result } = pipReport("not-colorama", "BSD License");
  try {
    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain("not-colorama: BSD License");
    expect(commandOutput(result)).toContain(remediationBlock("G10"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it("keeps grimp on BSD-2-Clause when pip reports BSD License", () => {
  expect(reportedLicense("grimp", "BSD License")).toBe("BSD-2-Clause");
  expect(licenseAllowed("grimp", "BSD License")).toBe(true);
});
