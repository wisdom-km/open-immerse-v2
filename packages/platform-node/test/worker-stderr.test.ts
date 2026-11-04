import { Buffer } from "node:buffer";

import { expect, it } from "vitest";

import { REDACTED } from "../src/logging/value-guard.js";
import {
  readWorkerStderrLine,
  WORKER_STDERR_MAX_BYTES,
} from "../src/logging/worker-stderr.js";

const envelope = {
  ts: "2026-11-04T00:00:00.000Z",
  level: "info",
  feature: "pipeline",
};

function pipeline(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ...envelope,
    event: "pipeline.run",
    run_id: "run-1",
    route: "multimodal-layout",
    step: "parse",
    status: "done",
    error_class: "",
    duration_ms: 12,
    ...overrides,
  };
}

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

it("AC-101 adds source worker when a whitelist line omits it", () => {
  expect(readWorkerStderrLine(line(pipeline()))).toEqual({
    ...pipeline(),
    source: "worker",
  });
});

it("keeps source worker when the line already has that literal", () => {
  const value = { ...pipeline(), source: "worker" };
  expect(readWorkerStderrLine(line(value))).toEqual(value);
});

it("returns undefined when source is not the worker literal", () => {
  expect(
    readWorkerStderrLine(line({ ...pipeline(), source: "main" })),
  ).toBeUndefined();
  expect(
    readWorkerStderrLine(line({ ...pipeline(), source: "" })),
  ).toBeUndefined();
  expect(
    readWorkerStderrLine(line({ ...pipeline(), source: 1 })),
  ).toBeUndefined();
});

it("returns undefined when the line is not one json object", () => {
  expect(readWorkerStderrLine("not-json\n")).toBeUndefined();
  expect(readWorkerStderrLine("[]\n")).toBeUndefined();
  expect(readWorkerStderrLine("null\n")).toBeUndefined();
  expect(readWorkerStderrLine("1\n")).toBeUndefined();
  expect(readWorkerStderrLine('"egress.ask"\n')).toBeUndefined();
  expect(readWorkerStderrLine("{}\n")).toBeUndefined();
  expect(
    readWorkerStderrLine(line({ ...pipeline(), event: "langsmith.trace" })),
  ).toBeUndefined();
});

it("drops an extra key when the line still passes the whitelist", () => {
  const guarded = readWorkerStderrLine(
    line({ ...pipeline(), body: `fixture-paper-body ${"x".repeat(40)}` }),
  );
  expect(JSON.stringify(guarded)).not.toContain("fixture-paper-body");
  expect(guarded).not.toHaveProperty("body");
  expect(guarded).toMatchObject({ source: "worker", event: "pipeline.run" });
});

it("returns undefined when the payload is longer than 8192 bytes", () => {
  const payload = `${"x".repeat(WORKER_STDERR_MAX_BYTES + 1)}\n`;
  expect(Buffer.byteLength(payload, "utf8")).toBeGreaterThan(
    WORKER_STDERR_MAX_BYTES,
  );
  expect(readWorkerStderrLine(payload)).toBeUndefined();
});

it("reads a line when the payload is exactly 8192 bytes", () => {
  const prefix =
    '{"ts":"2026-11-04T00:00:00.000Z","level":"info","feature":"egress","event":"egress.ask","requestId":"';
  const suffix = '"}';
  const filler = "a".repeat(
    WORKER_STDERR_MAX_BYTES - Buffer.byteLength(prefix + suffix, "utf8"),
  );
  const payload = `${prefix}${filler}${suffix}`;
  expect(Buffer.byteLength(payload, "utf8")).toBe(WORKER_STDERR_MAX_BYTES);
  expect(readWorkerStderrLine(payload)).toMatchObject({
    event: "egress.ask",
    source: "worker",
    requestId: REDACTED,
  });
  expect(readWorkerStderrLine(`${payload}\n`)).toMatchObject({
    source: "worker",
  });
  expect(readWorkerStderrLine(`${payload}\r\n`)).toMatchObject({
    source: "worker",
  });
  expect(readWorkerStderrLine(`${payload}a`)).toBeUndefined();
});

it("AC-101 replaces a fake key, a path, and an overlong body when they are in fields", () => {
  const secret = "sk-oitest_abc";
  const path = "/tmp/fixture/paper.pdf";
  const body = `fixture-paper-body ${"x".repeat(80)}`;
  const guarded = readWorkerStderrLine(
    line(pipeline({ step: secret, route: path, error_class: body })),
  );
  const encoded = JSON.stringify(guarded);
  expect(guarded).toMatchObject({
    source: "worker",
    step: REDACTED,
    route: REDACTED,
    error_class: REDACTED,
  });
  expect(encoded).not.toContain(secret);
  expect(encoded).not.toContain(path);
  expect(encoded).not.toContain("fixture-paper-body");
  expect(encoded).not.toContain("Bearer oitest_header");
});

it("AC-101 replaces bearer and github tokens when a worker line carries them", () => {
  const bearer = "BeArEr oitest_header";
  const github = "ghp_oitestfake";
  const guarded = readWorkerStderrLine(
    line(pipeline({ level: bearer, run_id: github })),
  );
  const encoded = JSON.stringify(guarded);
  expect(guarded).toMatchObject({
    source: "worker",
    level: REDACTED,
    run_id: REDACTED,
  });
  expect(encoded).not.toContain("oitest_header");
  expect(encoded).not.toContain(github);
});

it("reads each whitelist event when the line has the required fields", () => {
  const events = [
    { event: "egress.ask" },
    { event: "budget.refused", requestId: "req-1" },
    { event: "scoring.unavailable" },
    { event: "upstream.server_error", requestId: "req-1" },
    { event: "ipc.oversize", channel: "document.open", bytes: 4 },
    pipeline(),
  ];
  for (const event of events) {
    const record = { ...envelope, feature: "worker", ...event };
    expect(readWorkerStderrLine(line(record))).toMatchObject({
      ...record,
      source: "worker",
    });
  }
});
