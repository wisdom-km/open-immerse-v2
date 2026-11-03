import { tmpdir } from "node:os";
import path from "node:path";

import { expect, it } from "vitest";

import { diagnosticFileName, logDirectories } from "../src/logging/log-paths.js";

it("AC-101 joins diagnostics and debug under the injected directory when paths are requested", () => {
  const root = path.join(tmpdir(), "oitest_appdata");
  const directories = logDirectories(root);
  expect(directories.diagnostics).toBe(path.join(root, "diagnostics"));
  expect(directories.debug).toBe(path.join(root, "debug"));
  const repoDiagnostics = path.resolve("packages/features/diagnostics");
  expect(path.resolve(directories.diagnostics).startsWith(repoDiagnostics)).toBe(false);
  expect(path.resolve(directories.debug).startsWith(repoDiagnostics)).toBe(false);
});

it("names the daily file from the injected clock when the stamp is UTC", () => {
  expect(diagnosticFileName(Date.parse("2026-11-03T23:30:00.000Z"))).toBe("2026-11-03.jsonl");
});
