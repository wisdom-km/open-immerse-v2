import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { IpcCommandDescriptor } from "../src/ipc/descriptor.js";
import { ingestIpc } from "../src/ipc/ingest.js";
import { libraryIpc } from "../src/ipc/library.js";
import { libraryProgressIpc } from "../src/ipc/library-progress.js";
import { parsingIpc } from "../src/ipc/parsing.js";
import { readerIpc } from "../src/ipc/reader.js";
import { readingAssetIpc } from "../src/ipc/reading-asset.js";
import { settingsParseIpc } from "../src/ipc/settings-parse.js";
import { settingsIpc } from "../src/ipc/settings.js";
import { reportViewMenu, shellIpc } from "../src/ipc/shell.js";
import { readerViewModeSchema } from "../src/reader.js";
import { reportViewMenu as exportedReportViewMenu } from "../src/index.js";

const ceiling = Number.MAX_SAFE_INTEGER;
const request = reportViewMenu.request;
const response = reportViewMenu.response;

function submit(mode: string, epoch: unknown, generation: unknown) {
  return { op: "submit", mode, epoch, generation };
}

it("accepts a bare read and rejects every other read shape", () => {
  expect(Value.Check(request, { op: "read" })).toBe(true);
  expect(Value.Check(request, {})).toBe(false);
  expect(Value.Check(request, { op: "submit" })).toBe(false);
  expect(Value.Check(request, { op: "READ" })).toBe(false);
  expect(Value.Check(request, null)).toBe(false);
  expect(Value.Check(request, [])).toBe(false);
  for (const mode of ["original", "none"]) {
    expect(Value.Check(request, { op: "read", mode })).toBe(false);
  }
  expect(Value.Check(request, { op: "read", epoch: 1 })).toBe(false);
  expect(Value.Check(request, { op: "read", generation: 1 })).toBe(false);
  expect(Value.Check(request, { op: "read", bootId: "boot" })).toBe(false);
  expect(Value.Check(request, { op: "read", extra: true })).toBe(false);
});

it("accepts the four modes at both integer endpoints", () => {
  for (const mode of ["none", "original", "contrast", "translation"]) {
    expect(Value.Check(request, submit(mode, 1, 1))).toBe(true);
    expect(Value.Check(request, submit(mode, ceiling, ceiling))).toBe(true);
  }
  expect(Value.Check(request, submit("original", 1, ceiling))).toBe(true);
  expect(Value.Check(request, submit("original", ceiling, 1))).toBe(true);
});

it("rejects a submit that is missing a field or has a bad mode", () => {
  expect(
    Value.Check(request, { mode: "original", epoch: 1, generation: 1 }),
  ).toBe(false);
  expect(Value.Check(request, { op: "submit", epoch: 1, generation: 1 })).toBe(
    false,
  );
  expect(
    Value.Check(request, { op: "submit", mode: "original", generation: 1 }),
  ).toBe(false);
  expect(
    Value.Check(request, { op: "submit", mode: "original", epoch: 1 }),
  ).toBe(false);
  expect(Value.Check(request, submit("bilingual", 1, 1))).toBe(false);
  expect(Value.Check(request, submit("", 1, 1))).toBe(false);
  expect(
    Value.Check(request, { ...submit("original", 1, 1), bootId: "boot" }),
  ).toBe(false);
  expect(
    Value.Check(request, { ...submit("original", 1, 1), extra: true }),
  ).toBe(false);
});

it("rejects an epoch or generation outside the safe integer range", () => {
  const illegal = [
    0,
    -1,
    1.5,
    ceiling + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "1",
  ];
  for (const epoch of illegal) {
    expect(Value.Check(request, submit("original", epoch, 1))).toBe(false);
  }
  for (const generation of illegal) {
    expect(Value.Check(request, submit("original", 1, generation))).toBe(false);
  }
});

it("accepts only a closed epoch on the response", () => {
  expect(Value.Check(response, { epoch: 1 })).toBe(true);
  expect(Value.Check(response, { epoch: ceiling })).toBe(true);
  expect(Value.Check(response, { epoch: 0 })).toBe(false);
  expect(Value.Check(response, { epoch: 1.5 })).toBe(false);
  expect(Value.Check(response, { epoch: ceiling + 1 })).toBe(false);
  expect(Value.Check(response, {})).toBe(false);
  expect(Value.Check(response, { epoch: 1, generation: 1 })).toBe(false);
  expect(Value.Check(response, { epoch: 1, mode: "none" })).toBe(false);
  expect(Value.Check(response, { epoch: 1, bootId: "boot" })).toBe(false);
});

it("keeps the command hidden and unique", () => {
  expect(reportViewMenu.expose).toBe(true);
  expect(reportViewMenu.idempotent).toBe(false);
  expect(reportViewMenu.channel).toBe("shell.reportViewMenu");
  expect(reportViewMenu.kind).toBe("command");
  expect(reportViewMenu.transport).toBe("invoke");
  expect(shellIpc).toEqual([reportViewMenu]);
  expect(reportViewMenu).toBe(exportedReportViewMenu);
  expectTypeOf(reportViewMenu).toExtend<IpcCommandDescriptor>();
  const channels = [
    ...settingsIpc,
    ...settingsParseIpc,
    ...parsingIpc,
    ...libraryIpc,
    ...libraryProgressIpc,
    ...readingAssetIpc,
    ...readerIpc,
    ...ingestIpc,
    ...shellIpc,
  ].map((descriptor) => descriptor.channel);
  expect(new Set(channels).size).toBe(channels.length);
});

it("uses rejected and the shared transport codes, with no detail", () => {
  expect(reportViewMenu.errors.map((error) => error.code)).toEqual([
    "rejected",
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ]);
  expect(reportViewMenu.errors.map((error) => error.retryable)).toEqual([
    false,
    false,
    false,
    true,
  ]);
  for (const error of reportViewMenu.errors) {
    expect(error).not.toHaveProperty("detail");
  }
});

it("keeps none on the menu command and out of the reader mode", () => {
  expect(Value.Check(readerViewModeSchema, "none")).toBe(false);
  expect(Value.Check(readerViewModeSchema, "original")).toBe(true);
  expect(Value.Check(request, submit("none", 1, 1))).toBe(true);
});
