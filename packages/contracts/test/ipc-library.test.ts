import { type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { IpcCommandDescriptor } from "../src/ipc/descriptor.js";
import { ipcTransportErrors } from "../src/ipc/error-codes.js";
import {
  importDroppedLibrary,
  importLibrary,
  libraryIpc,
  listLibrary,
  relocateLibrary,
  type LibraryChannel,
  type LibraryCommands,
} from "../src/ipc/library.js";
import { settingsIpc } from "../src/ipc/settings.js";
import {
  libraryEntrySchema,
  type LibraryEntry,
  type LibraryEntryId,
  type LibrarySourceRecord,
} from "../src/library.js";

const entryId = "ab".repeat(32);

const idempotentByChannel = {
  "library.import": false,
  "library.importDropped": false,
  "library.list": true,
  "library.relocate": false,
} as const;

const transportByChannel = {
  "library.import": "invoke",
  "library.importDropped": "dropped-file",
  "library.list": "invoke",
  "library.relocate": "invoke",
} as const;

const errorsByChannel = {
  "library.import": [
    "cancelled",
    "not_pdf",
    "hash_mismatch",
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ],
  "library.importDropped": [
    "not_pdf",
    "hash_mismatch",
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ],
  "library.list": ["sender_rejected", "invalid_payload", "handler_threw"],
  "library.relocate": [
    "not_found",
    "cancelled",
    "not_pdf",
    "hash_mismatch",
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ],
} as const;

const responsePathKeys = new Set([
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

const requestPathKeys = new Set([
  "path",
  "originalPath",
  "filePath",
  "directory",
  "folder",
  "sourcePath",
  "absolutePath",
  "file_path",
]);

function sampleEntry(openedAt: string | null = null) {
  return {
    id: entryId,
    fileName: "paper.pdf",
    title: "TCP/IP",
    addedAt: "2026-11-05T03:42:00.000Z",
    openedAt,
  };
}

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

function outcomeSchemas(
  descriptor: (typeof libraryIpc)[number],
): readonly unknown[] {
  const details = descriptor.errors.flatMap((error) =>
    "detail" in error ? [error.detail] : [],
  );
  return [descriptor.response, ...details];
}

it("exports four unexposed library commands with unique channels", () => {
  expect(libraryIpc.map((descriptor) => descriptor.channel)).toEqual([
    "library.import",
    "library.importDropped",
    "library.list",
    "library.relocate",
  ]);
  expect(new Set(libraryIpc.map((descriptor) => descriptor.channel)).size).toBe(
    libraryIpc.length,
  );
  const settingsChannels = new Set<string>(
    settingsIpc.map((descriptor) => descriptor.channel),
  );
  for (const descriptor of libraryIpc) {
    expect(descriptor.kind).toBe("command");
    expect(descriptor.expose).toBe(false);
    expect(settingsChannels.has(descriptor.channel)).toBe(false);
    expectTypeOf(descriptor).toExtend<IpcCommandDescriptor>();
  }
});

it("pins transport, idempotent, and snake_case errors", () => {
  for (const descriptor of libraryIpc) {
    expect(descriptor.transport).toBe(transportByChannel[descriptor.channel]);
    expect(descriptor.idempotent).toBe(idempotentByChannel[descriptor.channel]);
    expect(descriptor.errors.map((error) => error.code)).toEqual([
      ...errorsByChannel[descriptor.channel],
    ]);
    for (const error of descriptor.errors) {
      expect(error.code).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      expect(error).not.toHaveProperty("message");
      expect(error).not.toHaveProperty("detail");
      const retryable = error.code === "handler_threw";
      expect(error.retryable).toBe(retryable);
    }
  }
  expect(ipcTransportErrors.map((error) => error.code)).toEqual([
    "sender_rejected",
    "invalid_payload",
    "handler_threw",
  ]);
});

it("keeps path names out of response schemas", () => {
  for (const descriptor of libraryIpc) {
    for (const schema of outcomeSchemas(descriptor)) {
      const names = keysOf(schema);
      expect(names.filter((name) => responsePathKeys.has(name))).toEqual([]);
      expect(JSON.stringify(schema)).not.toContain("originalPath");
    }
    const names = keysOf(descriptor.request);
    expect(names.filter((name) => requestPathKeys.has(name))).toEqual([]);
  }
});

it("rejects absolute paths on the entry and accepts a filename", () => {
  expect(Value.Check(libraryEntrySchema, sampleEntry(null))).toBe(true);
  expect(
    Value.Check(libraryEntrySchema, sampleEntry("2026-11-05T04:00:00Z")),
  ).toBe(true);
  expect(
    Value.Check(libraryEntrySchema, {
      ...sampleEntry(),
      fileName: "/tmp/paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, {
      ...sampleEntry(),
      fileName: "C:\\paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, {
      ...sampleEntry(),
      title: "/tmp/paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, {
      ...sampleEntry(),
      title: "C:\\paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, {
      ...sampleEntry(),
      path: "/tmp/paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, {
      ...sampleEntry(),
      originalPath: "C:\\paper.pdf",
    }),
  ).toBe(false);
});

it("accepts only a 64-digit lowercase id and a null openedAt", () => {
  expect(Value.Check(libraryEntrySchema, sampleEntry())).toBe(true);
  expect(
    Value.Check(libraryEntrySchema, { ...sampleEntry(), id: "AB".repeat(32) }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, { ...sampleEntry(), id: "ab".repeat(31) }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, {
      ...sampleEntry(),
      id: `${"ab".repeat(32)}a`,
    }),
  ).toBe(false);
  expect(
    Value.Check(libraryEntrySchema, { ...sampleEntry(), openedAt: null }),
  ).toBe(true);
  expectTypeOf<LibraryEntry["id"]>().toEqualTypeOf<LibraryEntryId>();
  expectTypeOf<LibraryEntry["openedAt"]>().toEqualTypeOf<string | null>();
  expectTypeOf<
    "originalPath" extends keyof LibraryEntry ? true : false
  >().toEqualTypeOf<false>();
  expectTypeOf<LibrarySourceRecord["originalPath"]>().toEqualTypeOf<string>();
});

it("accepts recent or all, and only the four sort fields", () => {
  expect(Value.Check(listLibrary.request, { view: "recent" })).toBe(true);
  expect(Value.Check(listLibrary.request, { view: "all" })).toBe(true);
  expect(Value.Check(listLibrary.request, { view: "papers" })).toBe(false);
  expect(Value.Check(listLibrary.request, {})).toBe(false);
  for (const field of ["title", "status", "openedAt", "addedAt"] as const) {
    expect(
      Value.Check(listLibrary.request, {
        view: "all",
        sort: { field, dir: "desc" },
      }),
    ).toBe(true);
  }
  expect(
    Value.Check(listLibrary.request, {
      view: "all",
      sort: { field: "name", dir: "asc" },
    }),
  ).toBe(false);
  expect(
    Value.Check(listLibrary.request, {
      view: "recent",
      sort: { field: "title", dir: "/tmp" },
    }),
  ).toBe(false);
  expect(
    Value.Check(listLibrary.request, {
      view: "recent",
      sort: { field: "title", dir: "C:\\paper.pdf" },
    }),
  ).toBe(false);
});

it("accepts relocate {id} only and empty import requests", () => {
  expect(Value.Check(relocateLibrary.request, { id: entryId })).toBe(true);
  expect(
    Value.Check(relocateLibrary.request, {
      id: entryId,
      path: "/tmp/paper.pdf",
    }),
  ).toBe(false);
  expect(
    Value.Check(relocateLibrary.request, {
      id: entryId,
      originalPath: "C:\\paper.pdf",
    }),
  ).toBe(false);
  expect(Value.Check(relocateLibrary.request, {})).toBe(false);
  expect(Value.Check(importLibrary.request, {})).toBe(true);
  expect(Value.Check(importDroppedLibrary.request, {})).toBe(true);
  expect(Value.Check(importLibrary.request, { path: "/tmp/paper.pdf" })).toBe(
    false,
  );
  expect(
    Value.Check(importDroppedLibrary.request, { filePath: "C:\\paper.pdf" }),
  ).toBe(false);
  expect(
    Value.Check(importLibrary.response, {
      entry: sampleEntry(),
      duplicate: true,
    }),
  ).toBe(true);
  expect(
    Value.Check(importLibrary.response, {
      entry: sampleEntry(),
      duplicate: false,
      path: "/tmp/paper.pdf",
    }),
  ).toBe(false);
  expect(Value.Check(listLibrary.response, [sampleEntry()])).toBe(true);
  expect(
    Value.Check(listLibrary.response, [
      { ...sampleEntry(), filePath: "/tmp/paper.pdf" },
    ]),
  ).toBe(false);
});

it("derives command types from the descriptors", () => {
  expectTypeOf<LibraryChannel>().toEqualTypeOf<
    | "library.import"
    | "library.importDropped"
    | "library.list"
    | "library.relocate"
  >();
  expectTypeOf<LibraryCommands["list"]>().parameters.toEqualTypeOf<
    [input: Static<typeof listLibrary.request>]
  >();
  expectTypeOf<LibraryCommands["relocate"]>().parameters.toEqualTypeOf<
    [input: Static<typeof relocateLibrary.request>]
  >();
  expectTypeOf<Parameters<LibraryCommands["import"]>>().toEqualTypeOf<
    Parameters<LibraryCommands["importDropped"]>
  >();
  expectTypeOf<
    Parameters<LibraryCommands["import"]>["length"]
  >().toEqualTypeOf<1>();
  type Listed = Awaited<ReturnType<LibraryCommands["list"]>>;
  expectTypeOf<Listed>().toExtend<{ ok: boolean }>();
});
