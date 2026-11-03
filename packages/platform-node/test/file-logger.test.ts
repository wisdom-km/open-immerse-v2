import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  truncateSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { DiagEvent } from "@oi/contracts";
import { DEBUG_LOG_MAX_BYTES } from "@oi/kernel";
import { expect, expectTypeOf, it } from "vitest";

import { createFileLogger } from "../src/logging/file-logger.js";
import { REDACTED } from "../src/logging/value-guard.js";

const DAY = 24 * 60 * 60 * 1000;

type PipelineOverrides = {
  readonly ts?: string;
  readonly level?: string;
  readonly feature?: string;
  readonly run_id?: string;
  readonly route?: string;
  readonly step?: string;
  readonly status?: string;
  readonly error_class?: string;
  readonly duration_ms?: number;
};

function pipeline(overrides: PipelineOverrides = {}): DiagEvent {
  return {
    ts: overrides.ts ?? "2026-11-02T00:00:00.000Z",
    level: overrides.level ?? "info",
    feature: overrides.feature ?? "pipeline",
    event: "pipeline.run",
    run_id: overrides.run_id ?? "run-1",
    route: overrides.route ?? "multimodal-layout",
    step: overrides.step ?? "parse",
    status: overrides.status ?? "done",
    error_class: overrides.error_class ?? "",
    duration_ms: overrides.duration_ms ?? 12,
  };
}

function openLogger(nowMs: number) {
  const root = mkdtempSync(path.join(tmpdir(), "oi-log-"));
  let now = nowMs;
  const clock = {
    nowMs: () => now,
    advance(ms: number) {
      now += ms;
    },
  };
  const logger = createFileLogger({ appDataDirectory: root, clock });
  return { root, clock, logger };
}

function debugFiles(root: string): string[] {
  const directory = path.join(root, "debug");
  if (!existsSync(directory)) {
    return [];
  }
  return readdirSync(directory);
}

it("AC-101 writes no debug file when debug mode was never enabled", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.log(pipeline());
  expectTypeOf<ReturnType<(typeof logger)["log"]>>().toBeVoid();
  expect(debugFiles(root)).toEqual([]);
  expect(existsSync(path.join(root, "debug"))).toBe(false);
  expect(readdirSync(path.join(root, "diagnostics"))).toEqual(["2026-11-03.jsonl"]);
});

it("AC-101 writes a debug line when debug mode is enabled", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.setDebugMode({ enabled: true });
  logger.log(pipeline());
  expect(debugFiles(root)).toEqual(["2026-11-03.jsonl"]);
  const repoDiagnostics = path.resolve("packages/features/diagnostics");
  expect(path.resolve(root, "diagnostics").startsWith(repoDiagnostics)).toBe(false);
  expect(path.resolve(root, "debug").startsWith(repoDiagnostics)).toBe(false);
});

it("AC-101 drops debug files older than 7 days when a later line is written", () => {
  const start = Date.parse("2026-11-01T00:00:00.000Z");
  const { root, clock, logger } = openLogger(start);
  logger.setDebugMode({ enabled: true });
  logger.log(pipeline());
  clock.advance(8 * DAY);
  logger.log(pipeline({ run_id: "run-2" }));
  expect(debugFiles(root)).toEqual(["2026-11-09.jsonl"]);
  const text = readFileSync(path.join(root, "debug", "2026-11-09.jsonl"), "utf8");
  expect(text).toContain("run-2");
});

it("AC-101 recreates the daily file when retention deleted the file being written", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.setDebugMode({ enabled: true });
  logger.log(pipeline());
  const file = path.join(root, "debug", "2026-11-03.jsonl");
  truncateSync(file, DEBUG_LOG_MAX_BYTES + 1);
  logger.log(pipeline({ run_id: "run-2" }));
  expect(existsSync(file)).toBe(false);
  logger.log(pipeline({ run_id: "run-3" }));
  const text = readFileSync(file, "utf8");
  expect(text).toContain("run-3");
  expect(text).not.toContain("run-2");
  expect(statSync(file).size).toBeLessThan(DEBUG_LOG_MAX_BYTES);
});

it("AC-101 leaves zero debug files when clearDebugLogs runs", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.setDebugMode({ enabled: true });
  logger.log(pipeline());
  logger.clearDebugLogs();
  expect(debugFiles(root)).toEqual([]);
});

it("AC-101 deletes debug files when debug mode turns off with deleteFiles true", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.setDebugMode({ enabled: true });
  logger.log(pipeline());
  logger.setDebugMode({ enabled: false, deleteFiles: true });
  expect(debugFiles(root)).toEqual([]);
});

it("AC-101 keeps recent debug files when debug mode turns off with deleteFiles false", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.setDebugMode({ enabled: true });
  logger.log(pipeline());
  const before = readFileSync(path.join(root, "debug", "2026-11-03.jsonl"), "utf8");
  logger.setDebugMode({ enabled: false, deleteFiles: false });
  logger.log(pipeline({ run_id: "run-2" }));
  expect(debugFiles(root)).toEqual(["2026-11-03.jsonl"]);
  expect(readFileSync(path.join(root, "debug", "2026-11-03.jsonl"), "utf8")).toBe(before);
  expect(readFileSync(path.join(root, "diagnostics", "2026-11-03.jsonl"), "utf8")).toContain("run-2");
});

it("AC-101 removes expired debug files when the logger is constructed", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-log-"));
  const now = Date.parse("2026-11-03T00:00:00.000Z");
  const debug = path.join(root, "debug");
  const product = path.join(root, "diagnostics");
  mkdirSync(debug);
  mkdirSync(product);
  const stale = path.join(debug, "stale.jsonl");
  const kept = path.join(product, "kept.jsonl");
  writeFileSync(stale, "old\n");
  writeFileSync(kept, "product\n");
  utimesSync(stale, (now - 8 * DAY) / 1000, (now - 8 * DAY) / 1000);
  createFileLogger({ appDataDirectory: root, clock: { nowMs: () => now } });
  expect(existsSync(stale)).toBe(false);
  expect(readFileSync(kept, "utf8")).toBe("product\n");
});

it("AC-101 writes a redacted debug line when a charset-valid key is logged", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.setDebugMode({ enabled: true });
  logger.log(
    pipeline({
      step: "sk-oitest_abc",
      route: "oitest_fixturekey",
      error_class: `fixture-paper-body ${"x".repeat(80)}`,
    }),
  );
  const text = readFileSync(path.join(root, "debug", "2026-11-03.jsonl"), "utf8");
  expect(text).toContain(REDACTED);
  expect(text).toContain("\"status\":\"done\"");
  expect(text).not.toContain("sk-oitest_abc");
  expect(text).not.toContain("oitest_fixturekey");
  expect(text).not.toContain("fixture-paper-body");
});

it("AC-101 keeps api-key-missing when that error class is logged", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.log(pipeline({ error_class: "api-key-missing" }));
  const text = readFileSync(path.join(root, "diagnostics", "2026-11-03.jsonl"), "utf8");
  expect(text).toContain("api-key-missing");
});

it("AC-101 writes nothing when the record fails readDiagEvent", () => {
  const { root, logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  logger.setDebugMode({ enabled: true });
  logger.log({ ts: "", level: "info", feature: "pipeline", event: "egress.ask" });
  expect(existsSync(path.join(root, "diagnostics"))).toBe(false);
  expect(existsSync(path.join(root, "debug"))).toBe(false);
});

it("throws when the diagnostic directory cannot be created", () => {
  const root = mkdtempSync(path.join(tmpdir(), "oi-log-"));
  const blocker = path.join(root, "not-a-directory");
  writeFileSync(blocker, "x");
  const logger = createFileLogger({
    appDataDirectory: blocker,
    clock: { nowMs: () => Date.parse("2026-11-03T00:00:00.000Z") },
  });
  expect(() => {
    logger.log(pipeline());
  }).toThrow();
});

it("AC-101 does not call fetch when a diagnostic line is written", () => {
  const { logger } = openLogger(Date.parse("2026-11-03T00:00:00.000Z"));
  let fetches = 0;
  const previous = globalThis.fetch;
  const rejectFetch: typeof fetch = () => {
    fetches += 1;
    throw new Error("http_rejected");
  };
  globalThis.fetch = rejectFetch;
  try {
    logger.log(pipeline());
    expect(fetches).toBe(0);
  } finally {
    globalThis.fetch = previous;
  }
});

it("AC-101 allows only kernel and contracts when the package manifest is read", () => {
  const parsed: unknown = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  const manifest = parsed as {
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(["@oi/contracts", "@oi/kernel"]);
  expect(manifest.optionalDependencies).toBeUndefined();
  expect(manifest.peerDependencies).toBeUndefined();
});
