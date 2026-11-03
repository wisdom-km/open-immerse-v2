import { randomUUID } from "node:crypto";

import { expect, it } from "vitest";

import { guardDiagRecord, REDACTED } from "../src/logging/value-guard.js";

const fields = [
  "ts",
  "level",
  "feature",
  "run_id",
  "route",
  "step",
  "status",
  "error_class",
  "requestId",
  "channel",
] as const;

const charsetFields = [
  "level",
  "feature",
  "route",
  "step",
  "status",
  "error_class",
] as const;

function pipeline(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ts: "2026-11-02T00:00:00.000Z",
    level: "info",
    feature: "pipeline",
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

function record(field: string, secret: string): Record<string, unknown> {
  if (field === "channel") {
    return {
      ts: "2026-11-02T00:00:00.000Z",
      level: "info",
      feature: "ipc",
      event: "ipc.oversize",
      channel: secret,
      bytes: 1,
    };
  }
  return pipeline({ [field]: secret });
}

function expectRedacted(field: string, secret: string): void {
  const guarded = guardDiagRecord(record(field, secret));
  expect(guarded, field).toMatchObject({ [field]: REDACTED });
  expect(JSON.stringify(guarded), field).not.toContain(secret);
}

function awsKey(prefix: "AKIA" | "ASIA", tail: string): string {
  return [prefix, "OITEST", "FAKE", tail].join("");
}

function secretSamples(): ReadonlyArray<{
  readonly name: string;
  readonly value: string;
}> {
  return [
    { name: "ghp_", value: "ghp_oitestfake" },
    { name: "gho_", value: "gho_oitestfake" },
    { name: "ghu_", value: "ghu_oitestfake" },
    { name: "ghs_", value: "ghs_oitestfake" },
    { name: "ghr_", value: "ghr_oitestfake" },
    { name: "github_pat_", value: "github_pat_oitestfake" },
    { name: "AKIA", value: awsKey("AKIA", "123456") },
    { name: "ASIA", value: awsKey("ASIA", "123456") },
    { name: "hex40", value: "ab".repeat(20) },
    { name: "hex-digits-40", value: "0123456789".repeat(4) },
    { name: "hex-repeated-40", value: "a".repeat(40) },
  ];
}

it("AC-101 replaces provider tokens and long hex when any string field carries them", () => {
  for (const sample of secretSamples()) {
    for (const field of fields) {
      expectRedacted(field, sample.value);
    }
  }
});

it("AC-101 replaces a github token when the prefix casing varies", () => {
  const sample = "GHP_OitestFake";
  expectRedacted("run_id", sample);
  expectRedacted("requestId", sample);
});

it("AC-101 replaces a high-entropy token when the length reaches 20", () => {
  const sample = ["qm7w2e", "9r4t6y", "8u1i3o", "5p0a"].join("");
  for (const field of [...charsetFields, "run_id", "requestId"]) {
    expectRedacted(field, sample);
  }
  expectRedacted("step", ["qm7w2e", "9r4t6y", "8u1i3o", "5p"].join(""));
});

it("AC-101 keeps a high-entropy token when the length stays under 20", () => {
  const sample = ["qm7w2e", "9r4t6y", "8u1i3o", "5"].join("");
  expect(guardDiagRecord(pipeline({ step: sample }))).toMatchObject({
    step: sample,
  });
  expect(guardDiagRecord(pipeline({ run_id: sample }))).toMatchObject({
    run_id: sample,
  });
});

it("AC-101 keeps api-key-missing and a short prose token when entropy is not consulted", () => {
  expect(
    guardDiagRecord(pipeline({ error_class: "api-key-missing" })),
  ).toMatchObject({
    error_class: "api-key-missing",
  });
  expect(
    guardDiagRecord(pipeline({ feature: "fixture-paper-body" })),
  ).toMatchObject({
    feature: "fixture-paper-body",
  });
});

it("AC-101 keeps a uuid run_id when the characters are evenly mixed", () => {
  const ids = [
    "550e8400-e29b-41d4-a716-446655440000",
    "123e4567-e89b-12d3-a456-426614174000",
    "01234567-89ab-cdef-0123-456789abcdef",
  ];
  for (const runId of ids) {
    expect(guardDiagRecord(pipeline({ run_id: runId }))).toMatchObject({
      run_id: runId,
    });
    expect(guardDiagRecord(pipeline({ requestId: runId }))).toMatchObject({
      requestId: runId,
    });
  }
});

it("AC-101 keeps a run_id when crypto.randomUUID generated it", () => {
  const runId = randomUUID();
  expect(guardDiagRecord(pipeline({ run_id: runId }))).toMatchObject({
    run_id: runId,
  });
  expect(guardDiagRecord(pipeline({ requestId: runId }))).toMatchObject({
    requestId: runId,
  });
});

it("AC-101 replaces a channel when the section 9 shape still carries a provider token", () => {
  expectRedacted("channel", `ingest.on${awsKey("AKIA", "123456")}`);
  expectRedacted("channel", `ingest.on${"ab".repeat(20)}`);
});

it("AC-101 keeps a timestamp and a long low-entropy token when the charset allows them", () => {
  expect(guardDiagRecord(pipeline())).toMatchObject({
    ts: "2026-11-02T00:00:00.000Z",
  });
  expect(
    guardDiagRecord(pipeline({ step: "error-error-error-error" })),
  ).toMatchObject({
    step: "error-error-error-error",
  });
  expect(
    guardDiagRecord(pipeline({ route: "pipeline-step-parse-done" })),
  ).toMatchObject({
    route: "pipeline-step-parse-done",
  });
});

it("AC-101 keeps an access-key prefix when the suffix is 15 characters", () => {
  const shortKey = awsKey("AKIA", "12345");
  expect(guardDiagRecord(pipeline({ run_id: shortKey }))).toMatchObject({
    run_id: shortKey,
  });
  expect(guardDiagRecord(pipeline({ requestId: shortKey }))).toMatchObject({
    requestId: shortKey,
  });
});
