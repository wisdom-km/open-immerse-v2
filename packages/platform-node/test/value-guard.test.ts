import { expect, it } from "vitest";

import { guardDiagRecord, REDACTED } from "../src/logging/value-guard.js";

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

it("AC-101 keeps a successful pipeline run when the field values are short tokens", () => {
  expect(guardDiagRecord(pipeline())).toMatchObject({
    event: "pipeline.run",
    step: "parse",
    error_class: "",
    duration_ms: 12,
    ts: "2026-11-02T00:00:00.000Z",
  });
});

it("AC-101 replaces a charset-valid fake key when the value contains sk-", () => {
  const guarded = guardDiagRecord(pipeline({ step: "sk-oitest_abc" }));
  expect(guarded).toMatchObject({ event: "pipeline.run", step: REDACTED });
  expect(JSON.stringify(guarded)).not.toContain("sk-oitest_abc");
});

it("AC-101 replaces a charset-valid fake key when the value contains the oitest_ prefix", () => {
  const guarded = guardDiagRecord(pipeline({ route: "oitest_fixturekey" }));
  expect(guarded).toMatchObject({ event: "pipeline.run", route: REDACTED });
  expect(JSON.stringify(guarded)).not.toContain("oitest_fixturekey");
});

it("AC-101 keeps api-key-missing when the value has no query separator", () => {
  expect(
    guardDiagRecord(pipeline({ error_class: "api-key-missing" })),
  ).toMatchObject({
    error_class: "api-key-missing",
  });
});

it("AC-101 replaces bearer and authorization text when the casing varies", () => {
  const guarded = guardDiagRecord(
    pipeline({
      level: "BeArEr oitest_header",
      feature: "AuThOrIzAtIoN oitest_header",
    }),
  );
  expect(guarded).toMatchObject({ level: REDACTED, feature: REDACTED });
  expect(JSON.stringify(guarded)).not.toContain("oitest_header");
});

it("AC-101 replaces a query value when it contains access_token= or key=", () => {
  const guarded = guardDiagRecord(
    pipeline({
      route: "cb?access_token=oitest_querytoken",
      error_class:
        "preset?key=abc&client_id=oitest_cid&client_secret=oitest_sec",
    }),
  );
  const encoded = JSON.stringify(guarded);
  expect(guarded).toMatchObject({ route: REDACTED, error_class: REDACTED });
  expect(encoded).not.toContain("oitest_querytoken");
  expect(encoded).not.toContain("key=abc");
  expect(encoded).not.toContain("client_secret");
});

it("AC-101 replaces an absolute path when it is stored in a string field", () => {
  const guarded = guardDiagRecord(
    pipeline({ route: "/tmp/fixture/paper.pdf" }),
  );
  expect(guarded).toMatchObject({ route: REDACTED });
  expect(JSON.stringify(guarded)).not.toContain("/tmp/fixture/paper.pdf");
});

it("AC-101 replaces an overlong body when it is placed in error_class", () => {
  const body = `fixture-paper-body ${"x".repeat(80)}`;
  const translation = `fixture-translation ${"y".repeat(80)}`;
  const prompt = `fixture-prompt ${"z".repeat(80)}`;
  const guarded = guardDiagRecord(
    pipeline({ error_class: body, route: translation, step: prompt }),
  );
  const encoded = JSON.stringify(guarded);
  expect(guarded).toMatchObject({
    error_class: REDACTED,
    route: REDACTED,
    step: REDACTED,
  });
  expect(encoded).not.toContain("fixture-paper-body");
  expect(encoded).not.toContain("fixture-translation");
  expect(encoded).not.toContain("fixture-prompt");
});

it("drops an extra key when the record still passes the whitelist", () => {
  const guarded = guardDiagRecord({
    ...pipeline(),
    body: `fixture-paper-body ${"x".repeat(40)}`,
  });
  expect(JSON.stringify(guarded)).not.toContain("fixture-paper-body");
  expect(guarded).not.toHaveProperty("body");
});

it("returns undefined when readDiagEvent rejects the record", () => {
  expect(guardDiagRecord({ ...pipeline(), ts: "" })).toBeUndefined();
  expect(
    guardDiagRecord({ ...pipeline(), event: "langsmith.trace" }),
  ).toBeUndefined();
  expect(guardDiagRecord(null)).toBeUndefined();
});

function oversize(channel: string): Record<string, unknown> {
  return {
    ts: "2026-11-02T00:00:00.000Z",
    level: "info",
    feature: "ipc",
    event: "ipc.oversize",
    channel,
    bytes: 1,
  };
}

it("AC-101 keeps a channel when the name matches section 9", () => {
  const channels = [
    "ingest.onProgress",
    "translation.onBlockChanged",
    "settings.onEgressConsentRequired",
    "jobs.onJobEvent",
    "markdown.onFileEvent",
    "quality.onScoringUnavailable",
    "ingest.openDocument",
    "formula-source.alignSource",
    "settings.withdrawEgressConsent",
    "qa.onQm7w2e9r4t6y8u1i3o5p0a",
  ];
  for (const channel of channels) {
    expect(guardDiagRecord(oversize(channel))).toMatchObject({
      event: "ipc.oversize",
      channel,
    });
  }
});

it("AC-101 replaces a channel when the name leaves the section 9 shape", () => {
  const channels = [
    "Ingest.onProgress",
    "ingest.on Progress",
    "ingest/onProgress",
  ];
  for (const channel of channels) {
    const guarded = guardDiagRecord(oversize(channel));
    expect(guarded).toMatchObject({ channel: REDACTED });
    expect(JSON.stringify(guarded)).not.toContain(channel);
  }
});

it("AC-101 replaces an absolute path when it is stored in channel", () => {
  const channel = "/tmp/fixture/paper.pdf";
  const guarded = guardDiagRecord(oversize(channel));
  expect(guarded).toMatchObject({ channel: REDACTED });
  expect(JSON.stringify(guarded)).not.toContain(channel);
});

it("AC-101 replaces a high-entropy tail when it is stored on run_id", () => {
  const tail = "Qm7w2e9r4t6y8u1i3o5p0a";
  const guarded = guardDiagRecord(pipeline({ run_id: tail }));
  expect(guarded).toMatchObject({ run_id: REDACTED });
  expect(JSON.stringify(guarded)).not.toContain(tail);
});
