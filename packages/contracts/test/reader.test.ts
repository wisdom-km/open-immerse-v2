import { type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { IpcCommandDescriptor } from "../src/ipc/descriptor.js";
import {
  readerIpc,
  setZoom,
  type ReaderChannel,
  type ReaderCommands,
} from "../src/ipc/reader.js";
import type { LibraryEntryId } from "../src/library.js";
import {
  readerSessionSchema,
  type ReaderSession,
  type ReaderViewMode,
} from "../src/reader.js";
import { setZoom as exportedSetZoom } from "../src/index.js";

const entryId = "cd".repeat(32);

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

function session(patch: Record<string, unknown> = {}) {
  return {
    id: entryId,
    title: "TCP/IP",
    fileName: "paper.pdf",
    pageCount: 12,
    currentPage: 12,
    zoomPercent: 125,
    viewMode: "original",
    ...patch,
  };
}

it("exports one unexposed setZoom command and no page or view command", () => {
  expect(readerIpc.map((descriptor) => descriptor.channel)).toEqual([
    "reader.setZoom",
  ]);
  expect(setZoom.kind).toBe("command");
  expect(setZoom.expose).toBe(false);
  expect(setZoom.idempotent).toBe(true);
  expect(setZoom.transport).toBe("invoke");
  expect(setZoom).toBe(exportedSetZoom);
  expectTypeOf(setZoom).toExtend<IpcCommandDescriptor>();
  expectTypeOf<ReaderChannel>().toEqualTypeOf<"reader.setZoom">();
  expect(readerIpc.map((descriptor) => descriptor.channel)).not.toContain(
    "reader.setPage",
  );
  expect(readerIpc.map((descriptor) => descriptor.channel)).not.toContain(
    "reader.setViewMode",
  );
});

it("uses not_found and keeps path keys out of setZoom", () => {
  expect(setZoom.errors.map((error) => error.code)).toEqual([
    "not_found",
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ]);
  for (const error of setZoom.errors) {
    expect(error.code).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
    expect(error.retryable).toBe(error.code === "handler_threw");
    expect(error).not.toHaveProperty("detail");
  }
  for (const schema of [
    setZoom.request,
    setZoom.response,
    readerSessionSchema,
  ]) {
    expect(keysOf(schema).filter((name) => pathKeys.has(name))).toEqual([]);
    expect(JSON.stringify(schema)).not.toContain("originalPath");
  }
});

it("accepts zoom bounds and fit levels, and rejects a path on the request", () => {
  expect(Value.Check(setZoom.request, { id: entryId, level: 25 })).toBe(true);
  expect(Value.Check(setZoom.request, { id: entryId, level: 400 })).toBe(true);
  expect(Value.Check(setZoom.request, { id: entryId, level: 24 })).toBe(false);
  expect(Value.Check(setZoom.request, { id: entryId, level: 401 })).toBe(false);
  expect(
    Value.Check(setZoom.request, { id: entryId, level: "fit-width" }),
  ).toBe(true);
  expect(Value.Check(setZoom.request, { id: entryId, level: "fit-page" })).toBe(
    true,
  );
  expect(
    Value.Check(setZoom.request, { id: entryId, level: "fit-height" }),
  ).toBe(false);
  expect(
    Value.Check(setZoom.request, {
      id: entryId,
      level: 100,
      path: "/tmp/paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(setZoom.request, {
      id: entryId,
      level: 100,
      filePath: "C:\\paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(setZoom.request, { id: "AB".repeat(32), level: 100 }),
  ).toBe(false);
  expect(Value.Check(setZoom.response, { level: "fit-page" })).toBe(true);
  expect(Value.Check(setZoom.response, { level: "fit-page", dir: "x" })).toBe(
    false,
  );
});

it("accepts a reader session without absolute paths", () => {
  expect(Value.Check(readerSessionSchema, session())).toBe(true);
  for (const viewMode of ["original", "contrast", "translation"] as const) {
    expect(Value.Check(readerSessionSchema, session({ viewMode }))).toBe(true);
  }
  expect(Value.Check(readerSessionSchema, session({ viewMode: "对照" }))).toBe(
    false,
  );
  expect(Value.Check(readerSessionSchema, session({ viewMode: "dual" }))).toBe(
    false,
  );
  expect(Value.Check(readerSessionSchema, session({ zoomPercent: 25 }))).toBe(
    true,
  );
  expect(Value.Check(readerSessionSchema, session({ zoomPercent: 400 }))).toBe(
    true,
  );
  expect(Value.Check(readerSessionSchema, session({ zoomPercent: 24 }))).toBe(
    false,
  );
  expect(Value.Check(readerSessionSchema, session({ zoomPercent: 401 }))).toBe(
    false,
  );
  expect(
    Value.Check(readerSessionSchema, session({ zoomPercent: "fit-width" })),
  ).toBe(false);
  expect(Value.Check(readerSessionSchema, session({ pageCount: 0 }))).toBe(
    false,
  );
  expect(Value.Check(readerSessionSchema, session({ currentPage: 0 }))).toBe(
    false,
  );
  expect(
    Value.Check(readerSessionSchema, session({ fileName: "/tmp/paper.pdf" })),
  ).toBe(false);
  expect(
    Value.Check(readerSessionSchema, session({ fileName: "C:\\paper.pdf" })),
  ).toBe(false);
  expect(
    Value.Check(readerSessionSchema, session({ title: "/tmp/paper.pdf" })),
  ).toBe(false);
  expect(
    Value.Check(readerSessionSchema, session({ title: "C:\\paper.pdf" })),
  ).toBe(false);
  expect(
    Value.Check(readerSessionSchema, session({ path: "/tmp/paper.pdf" })),
  ).toBe(false);
  const { viewMode, ...withoutMode } = session();
  expect(viewMode).toBe("original");
  expect(Value.Check(readerSessionSchema, withoutMode)).toBe(false);
});

it("brands the session id and types setZoom from the descriptor", () => {
  expectTypeOf<ReaderSession["id"]>().toEqualTypeOf<LibraryEntryId>();
  expectTypeOf<ReaderSession["viewMode"]>().toEqualTypeOf<ReaderViewMode>();
  expectTypeOf<
    "path" extends keyof ReaderSession ? true : false
  >().toEqualTypeOf<false>();
  expectTypeOf<
    "originalPath" extends keyof ReaderSession ? true : false
  >().toEqualTypeOf<false>();
  expectTypeOf<ReaderCommands["setZoom"]>().parameters.toEqualTypeOf<
    [input: Static<typeof setZoom.request>]
  >();
});
