import { expect, expectTypeOf, it } from "vitest";

import {
  DIAG_EVENT_IDS,
  PIPELINE_RUN_FIELDS,
  readDiagEvent,
  type DiagEvent,
  type DiagLogger,
} from "@oi/contracts";
import type { Logger } from "@oi/kernel";

const envelope = {
  ts: "2026-11-02T00:00:00.000Z",
  level: "info",
  feature: "pipeline",
} as const;

const forbidden = [
  "fixture-paper-body",
  "fixture-translation",
  "fixture-prompt",
  "oitest_fixturekey",
  "/tmp/fixture/paper.pdf",
  "Bearer oitest_header",
  "oitest_querytoken",
] as const;

it("lists only the six diagnostic event ids when the whitelist is read", () => {
  expect([...DIAG_EVENT_IDS]).toEqual([
    "egress.ask",
    "budget.refused",
    "upstream.server_error",
    "scoring.unavailable",
    "pipeline.run",
    "ipc.oversize",
  ]);
  expect([...PIPELINE_RUN_FIELDS]).toEqual([
    "run_id",
    "route",
    "step",
    "status",
    "error_class",
    "duration_ms",
  ]);
  const same: DiagLogger extends Logger<DiagEvent> ? true : false = true;
  expectTypeOf(same).toEqualTypeOf<true>();
});

it("rejects an event id outside the whitelist when the name is not listed", () => {
  // @ts-expect-error event id is not on the whitelist
  const event: DiagEvent = { ...envelope, event: "langsmith.trace" };
  expectTypeOf(event).toExtend<DiagEvent>();
  expect(readDiagEvent({ ...envelope, event: "langsmith.trace" }).ok).toBe(
    false,
  );
  expect(readDiagEvent(null).ok).toBe(false);
  expect(readDiagEvent({ ...envelope, ts: "", event: "egress.ask" }).ok).toBe(
    false,
  );
});

it("AC-101 keeps only pipeline.run fields when a parse, ocr, or translate run succeeds", () => {
  for (const step of ["parse", "ocr", "translate"]) {
    const read = readDiagEvent({
      ...envelope,
      event: "pipeline.run",
      run_id: "run-1",
      route: "multimodal-layout",
      step,
      status: "done",
      error_class: "",
      duration_ms: 12,
      requestId: "req-1",
      body: forbidden[0],
      translation: forbidden[1],
      prompt: forbidden[2],
      key: forbidden[3],
      path: forbidden[4],
      authorization: forbidden[5],
      access_token: forbidden[6],
    });
    expect(read).toEqual({
      ok: true,
      value: {
        ...envelope,
        event: "pipeline.run",
        run_id: "run-1",
        route: "multimodal-layout",
        step,
        status: "done",
        error_class: "",
        duration_ms: 12,
        requestId: "req-1",
      },
    });
    const encoded = JSON.stringify(read);
    for (const sample of forbidden) {
      expect(encoded).not.toContain(sample);
    }
  }
});

it("rejects a pipeline.run record when a required field is missing or duration is not a finite millisecond count", () => {
  const fields = {
    ...envelope,
    event: "pipeline.run",
    run_id: "run-1",
    route: "multimodal-layout",
    step: "parse",
    status: "done",
    error_class: "",
    duration_ms: 1,
  };
  expect(readDiagEvent({ ...fields, run_id: 1 }).ok).toBe(false);
  expect(readDiagEvent({ ...fields, duration_ms: Number.NaN }).ok).toBe(false);
  expect(readDiagEvent({ ...fields, duration_ms: -1 }).ok).toBe(false);
  expect(readDiagEvent({ ...fields, error_class: "upstream" })).toEqual({
    ok: true,
    value: { ...fields, error_class: "upstream" },
  });
});

it("drops extra keys when egress.ask, budget.refused, or scoring.unavailable is read", () => {
  for (const event of [
    "egress.ask",
    "budget.refused",
    "scoring.unavailable",
  ] as const) {
    expect(readDiagEvent({ ...envelope, event, body: forbidden[0] })).toEqual({
      ok: true,
      value: { ...envelope, event },
    });
  }
});

it("keeps requestId and drops the response body when upstream.server_error is read", () => {
  expect(
    readDiagEvent({
      ...envelope,
      event: "upstream.server_error",
      requestId: "req-9",
      body: forbidden[0],
    }),
  ).toEqual({
    ok: true,
    value: { ...envelope, event: "upstream.server_error", requestId: "req-9" },
  });
  expect(
    readDiagEvent({ ...envelope, event: "upstream.server_error" }).ok,
  ).toBe(false);
});

it("keeps the channel name and byte count when ipc.oversize is read", () => {
  expect(
    readDiagEvent({
      ...envelope,
      event: "ipc.oversize",
      channel: "document.open",
      bytes: 1_048_576,
      payload: forbidden[0],
    }),
  ).toEqual({
    ok: true,
    value: {
      ...envelope,
      event: "ipc.oversize",
      channel: "document.open",
      bytes: 1_048_576,
    },
  });
  expect(
    readDiagEvent({
      ...envelope,
      event: "ipc.oversize",
      channel: "document.open",
      bytes: 1.5,
    }).ok,
  ).toBe(false);
});
