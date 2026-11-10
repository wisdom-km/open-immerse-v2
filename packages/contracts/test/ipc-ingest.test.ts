import { type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { JobId } from "../src/ids.js";
import type { IpcCommandDescriptor } from "../src/ipc/descriptor.js";
import {
  ingestIpc,
  openDocument,
  type IngestChannel,
  type IngestCommands,
  type IngestOpenDocumentRequest,
  type IngestOpenDocumentResponse,
} from "../src/ipc/ingest.js";
import { libraryIpc } from "../src/ipc/library.js";
import { readerIpc } from "../src/ipc/reader.js";
import { settingsIpc } from "../src/ipc/settings.js";
import type { LibraryEntryId } from "../src/library.js";
import { openDocument as exportedOpenDocument } from "../src/index.js";

const entryId = "ab".repeat(32);

const pathKeys = new Set([
  "path",
  "originalPath",
  "filePath",
  "dir",
  "directory",
  "folder",
  "sourcePath",
  "absolutePath",
  "file_path",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectKeys(schema: unknown, found: string[]): void {
  if (Array.isArray(schema)) {
    for (const item of schema) {
      collectKeys(item, found);
    }
    return;
  }
  if (!isRecord(schema)) {
    return;
  }
  const properties = schema["properties"];
  if (isRecord(properties)) {
    for (const key of Object.keys(properties)) {
      found.push(key);
      collectKeys(properties[key], found);
    }
  }
  for (const keyword of ["items", "anyOf", "allOf", "oneOf"] as const) {
    if (keyword in schema) {
      collectKeys(schema[keyword], found);
    }
  }
}

function keysOf(schema: unknown): string[] {
  const found: string[] = [];
  collectKeys(schema, found);
  return found;
}

it("exports one exposed openDocument command", () => {
  expect(ingestIpc.map((descriptor) => descriptor.channel)).toEqual([
    "ingest.openDocument",
  ]);
  expect(openDocument.kind).toBe("command");
  expect(openDocument.expose).toBe(true);
  expect(openDocument.idempotent).toBe(true);
  expect(openDocument.transport).toBe("invoke");
  expect(openDocument).toBe(exportedOpenDocument);
  expectTypeOf(openDocument).toExtend<IpcCommandDescriptor>();
  expectTypeOf<IngestChannel>().toEqualTypeOf<"ingest.openDocument">();
});

it("does not reuse a settings, library, or reader channel", () => {
  const channels = [
    ...settingsIpc.map((descriptor) => descriptor.channel),
    ...libraryIpc.map((descriptor) => descriptor.channel),
    ...readerIpc.map((descriptor) => descriptor.channel),
    ...ingestIpc.map((descriptor) => descriptor.channel),
  ];
  expect(new Set(channels).size).toBe(channels.length);
  expect(openDocument.channel).not.toBe(libraryIpc[0].channel);
});

it("uses not_found and the shared transport codes", () => {
  expect(openDocument.errors.map((error) => error.code)).toEqual([
    "not_found",
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ]);
  for (const error of openDocument.errors) {
    expect(error.code).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
    expect(error).not.toHaveProperty("message");
    expect(error.retryable).toBe(error.code === "handler_threw");
  }
  expect(openDocument.errors.map((error) => error.code)).not.toContain(
    "not_pdf",
  );
});

it("keeps path keys out of the openDocument schemas", () => {
  const schemas = [openDocument.request, openDocument.response];
  for (const schema of schemas) {
    expect(keysOf(schema).filter((name) => pathKeys.has(name))).toEqual([]);
    expect(JSON.stringify(schema)).not.toContain("originalPath");
  }
  for (const error of openDocument.errors) {
    expect(error).not.toHaveProperty("detail");
  }
});

it("accepts only {id} when the id is 64 lowercase hex", () => {
  expect(Value.Check(openDocument.request, { id: entryId })).toBe(true);
  expect(Value.Check(openDocument.request, {})).toBe(false);
  expect(
    Value.Check(openDocument.request, { id: entryId, path: "/tmp/paper.pdf" }),
  ).toBe(false);
  expect(
    Value.Check(openDocument.request, {
      id: entryId,
      filePath: "C:\\paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(openDocument.request, { id: entryId, source: "library" }),
  ).toBe(false);
  expect(Value.Check(openDocument.request, { id: "AB".repeat(32) })).toBe(
    false,
  );
  expect(Value.Check(openDocument.request, { id: "ab".repeat(31) })).toBe(
    false,
  );
  expect(Value.Check(openDocument.request, { id: `${entryId}a` })).toBe(false);
  expect(
    Value.Check(openDocument.response, { jobId: "job-1", path: "/tmp/a.pdf" }),
  ).toBe(false);
  expect(Value.Check(openDocument.response, { jobId: "job-1" })).toBe(true);
  expect(Value.Check(openDocument.response, { jobId: 1 })).toBe(false);
});

it("brands the open id as LibraryEntryId and the job id as JobId", () => {
  expectTypeOf<
    IngestOpenDocumentRequest["id"]
  >().toEqualTypeOf<LibraryEntryId>();
  expectTypeOf<IngestOpenDocumentResponse["jobId"]>().toEqualTypeOf<JobId>();
  expectTypeOf<IngestCommands["openDocument"]>().parameters.toEqualTypeOf<
    [input: Static<typeof openDocument.request>]
  >();
  type Opened = Awaited<ReturnType<IngestCommands["openDocument"]>>;
  expectTypeOf<Opened>().toExtend<{ ok: boolean }>();
});
