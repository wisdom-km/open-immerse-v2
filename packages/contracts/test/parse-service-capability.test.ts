import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { IpcCommandDescriptor } from "../src/ipc/descriptor.js";
import {
  SAVE_FAILED,
  SECRET_UNAVAILABLE,
  STORAGE_CORRUPT,
} from "../src/ipc/error-codes.js";
import { ingestIpc } from "../src/ipc/ingest.js";
import { libraryIpc } from "../src/ipc/library.js";
import { parsingIpc } from "../src/ipc/parsing.js";
import { readerIpc } from "../src/ipc/reader.js";
import { settingsParseIpc } from "../src/ipc/settings-parse.js";
import { settingsIpc } from "../src/ipc/settings.js";
import {
  getParseCapabilities as exportedCapabilities,
  getParseServiceStatus as exportedStatus,
  saveParseService as exportedSave,
} from "../src/index.js";
import {
  getParseServiceStatus,
  saveParseService,
} from "../src/ipc/settings-parse.js";
import { getParseCapabilities as parsingCapabilities } from "../src/ipc/parsing.js";

const closed = { additionalProperties: false } as const;

const saved = {
  vendorId: "vendor",
  format: "format",
  baseUrl: "https://example.test",
  modelId: "model",
  allowedHosts: ["example.test"],
  secret: "x",
};

const hidden = [
  "secret",
  "secretRef",
  "path",
  "absolutePath",
  "filePath",
  "credentialSlot",
] as const;

it("keeps settings parse commands internal and exposes the query", () => {
  expect(saveParseService.expose).toBe(false);
  expect(getParseServiceStatus.expose).toBe(false);
  expect(parsingCapabilities.expose).toBe(true);
  expect(saveParseService).toBe(exportedSave);
  expect(getParseServiceStatus).toBe(exportedStatus);
  expect(parsingCapabilities).toBe(exportedCapabilities);
  expect(saveParseService.idempotent).toBe(false);
  expect(getParseServiceStatus.idempotent).toBe(true);
  expect(parsingCapabilities.idempotent).toBe(true);
  expectTypeOf(saveParseService).toExtend<IpcCommandDescriptor>();
  expectTypeOf(getParseServiceStatus).toExtend<IpcCommandDescriptor>();
  expectTypeOf(parsingCapabilities).toExtend<IpcCommandDescriptor>();
});

it("does not reuse a channel already owned by another command", () => {
  const channels = [
    ...settingsIpc,
    ...settingsParseIpc,
    ...parsingIpc,
    ...libraryIpc,
    ...readerIpc,
    ...ingestIpc,
  ].map((descriptor) => descriptor.channel);
  expect(new Set(channels).size).toBe(channels.length);
  expect(settingsParseIpc.map((descriptor) => descriptor.channel)).toEqual([
    "settings.saveParseService",
    "settings.getParseServiceStatus",
  ]);
  expect(parsingIpc.map((descriptor) => descriptor.channel)).toEqual([
    "parsing.getParseCapabilities",
  ]);
});

it("accepts a closed save request and rejects a leaked field", () => {
  expect(Value.Check(saveParseService.request, saved)).toBe(true);
  expect(Value.Check(saveParseService.request, {})).toBe(false);
  expect(Value.Check(saveParseService.request, { ...saved, secret: "" })).toBe(
    false,
  );
  expect(
    Value.Check(saveParseService.request, { ...saved, allowedHosts: [] }),
  ).toBe(false);
  expect(
    Value.Check(saveParseService.request, { ...saved, secretRef: "slot" }),
  ).toBe(false);
  expect(
    Value.Check(saveParseService.request, {
      ...saved,
      path: "/tmp/secrets.bin",
    }),
  ).toBe(false);
});

it("accepts only the two success states", () => {
  expect(
    Value.Check(getParseServiceStatus.response, { state: "unconfigured" }),
  ).toBe(true);
  expect(
    Value.Check(parsingCapabilities.response, { state: "configured" }),
  ).toBe(true);
  expect(
    Value.Check(getParseServiceStatus.response, {
      state: "unconfigured",
      orphan: true,
    }),
  ).toBe(false);
  expect(
    Value.Check(parsingCapabilities.response, { state: "build_unsupported" }),
  ).toBe(false);
  expect(Value.Check(saveParseService.response, { state: "configured" })).toBe(
    true,
  );
  expect(
    Value.Check(saveParseService.response, { state: "unconfigured" }),
  ).toBe(false);
});

it("rejects an extra field on an empty read", () => {
  expect(Value.Check(getParseServiceStatus.request, {})).toBe(true);
  expect(Value.Check(parsingCapabilities.request, {})).toBe(true);
  expect(
    Value.Check(getParseServiceStatus.request, { state: "unconfigured" }),
  ).toBe(false);
  expect(Value.Check(parsingCapabilities.request, { secret: "x" })).toBe(false);
});

it("keeps read errors shared and save_failed on the write only", () => {
  expect(getParseServiceStatus.errors).toBe(parsingCapabilities.errors);
  const readCodes = getParseServiceStatus.errors.map((error) => error.code);
  const saveCodes = saveParseService.errors.map((error) => error.code);
  expect(readCodes).toContain(STORAGE_CORRUPT);
  expect(readCodes).toContain(SECRET_UNAVAILABLE);
  expect(readCodes).not.toContain("unconfigured");
  expect(readCodes).not.toContain(SAVE_FAILED);
  expect(saveCodes).toEqual([...readCodes, SAVE_FAILED]);
});

it("keeps secret on the internal save request only", () => {
  expect(hiddenKeys(saveParseService.request)).toEqual(["secret"]);
  expect(hiddenKeys(saveParseService.response)).toEqual([]);
  expect(hiddenKeys(getParseServiceStatus.request)).toEqual([]);
  expect(hiddenKeys(parsingCapabilities.request)).toEqual([]);
});

it("rejects an error that carries a secret or a path", () => {
  const read = errorSchema(getParseServiceStatus.errors);
  const write = errorSchema(saveParseService.errors);
  expect(Value.Check(read, { code: "unconfigured", retryable: false })).toBe(
    false,
  );
  expect(
    Value.Check(read, {
      code: STORAGE_CORRUPT,
      retryable: false,
      secret: "x",
    }),
  ).toBe(false);
  expect(
    Value.Check(read, {
      code: SECRET_UNAVAILABLE,
      retryable: false,
      secretRef: "slot",
    }),
  ).toBe(false);
  expect(
    Value.Check(write, {
      code: SAVE_FAILED,
      retryable: false,
      path: "/tmp/secrets.bin",
    }),
  ).toBe(false);
  expect(Value.Check(read, { code: STORAGE_CORRUPT, retryable: false })).toBe(
    true,
  );
  for (const descriptor of [
    saveParseService,
    getParseServiceStatus,
    parsingCapabilities,
  ]) {
    expect(hiddenKeys(descriptor.response)).toEqual([]);
    expect(hiddenKeys(errorSchema(descriptor.errors))).toEqual([]);
  }
  expect(hiddenKeys(getParseServiceStatus.request)).toEqual([]);
  expect(hiddenKeys(parsingCapabilities.request)).toEqual([]);
});

function errorSchema(
  errors: readonly { readonly code: string; readonly retryable: boolean }[],
) {
  return Type.Union(
    errors.map((error) =>
      Type.Object(
        {
          code: Type.Literal(error.code),
          retryable: Type.Literal(error.retryable),
        },
        closed,
      ),
    ),
  );
}

function hiddenKeys(schema: unknown): string[] {
  return collectKeys(schema).filter((key) =>
    hidden.includes(key as (typeof hidden)[number]),
  );
}

function collectKeys(schema: unknown): string[] {
  if (Array.isArray(schema)) {
    return schema.flatMap((item) => collectKeys(item));
  }
  if (typeof schema !== "object" || schema === null) {
    return [];
  }
  const record = schema as Record<string, unknown>;
  const properties = record["properties"];
  const own = isRecord(properties) ? Object.keys(properties) : [];
  const nested = own.flatMap((key) =>
    collectKeys(isRecord(properties) ? properties[key] : undefined),
  );
  const keywords = ["items", "anyOf", "allOf", "oneOf"].flatMap((keyword) =>
    collectKeys(record[keyword]),
  );
  return [...own, ...nested, ...keywords];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
