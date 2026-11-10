import type { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { expect, expectTypeOf, it } from "vitest";

import type { IpcCommandDescriptor } from "../src/ipc/descriptor.js";
import { ingestIpc, openDocument } from "../src/ipc/ingest.js";
import { libraryIpc } from "../src/ipc/library.js";
import { libraryProgressIpc } from "../src/ipc/library-progress.js";
import { parsingIpc } from "../src/ipc/parsing.js";
import { readerIpc, setZoom } from "../src/ipc/reader.js";
import {
  bindReadingAsset,
  readingAssetIpc,
  revokeReadingAsset,
} from "../src/ipc/reading-asset.js";
import { settingsParseIpc } from "../src/ipc/settings-parse.js";
import { settingsIpc } from "../src/ipc/settings.js";
import {
  bindReadingAsset as exportedBind,
  revokeReadingAsset as exportedRevoke,
} from "../src/index.js";

const id = "ab".repeat(32);
const generation = 2;

it("exposes bind, revoke, and openDocument, and keeps setZoom hidden", () => {
  expect(bindReadingAsset.expose).toBe(true);
  expect(revokeReadingAsset.expose).toBe(true);
  expect(bindReadingAsset.idempotent).toBe(false);
  expect(revokeReadingAsset.idempotent).toBe(false);
  expect(bindReadingAsset).toBe(exportedBind);
  expect(revokeReadingAsset).toBe(exportedRevoke);
  expect(openDocument.expose).toBe(true);
  expect(setZoom.expose).toBe(false);
  expectTypeOf(bindReadingAsset).toExtend<IpcCommandDescriptor>();
  expectTypeOf(revokeReadingAsset).toExtend<IpcCommandDescriptor>();
});

it("does not reuse a channel owned by another command", () => {
  const channels = [
    ...settingsIpc,
    ...settingsParseIpc,
    ...parsingIpc,
    ...libraryIpc,
    ...libraryProgressIpc,
    ...readingAssetIpc,
    ...readerIpc,
    ...ingestIpc,
  ].map((descriptor) => descriptor.channel);
  expect(new Set(channels).size).toBe(channels.length);
  expect(readingAssetIpc.map((descriptor) => descriptor.channel)).toEqual([
    "library.bindReadingAsset",
    "library.revokeReadingAsset",
  ]);
});

it("accepts a closed bind request and a path-free asset id", () => {
  expect(Value.Check(bindReadingAsset.request, { id })).toBe(true);
  expect(Value.Check(bindReadingAsset.request, {})).toBe(false);
  expect(Value.Check(bindReadingAsset.request, { id, generation })).toBe(false);
  expect(
    Value.Check(bindReadingAsset.response, {
      id,
      assetId: "asset-1",
      generation: 1,
    }),
  ).toBe(true);
  expect(
    Value.Check(bindReadingAsset.response, {
      id,
      assetId: "asset-1",
      generation: Number.MAX_SAFE_INTEGER,
    }),
  ).toBe(true);
  for (const assetId of ["", "a/b", "a\\b", "../x", "/tmp/a"]) {
    expect(
      Value.Check(bindReadingAsset.response, { id, assetId, generation: 1 }),
    ).toBe(false);
  }
});

it("echoes only the request id when bind is rejected", () => {
  const detail = requiredDetail(bindReadingAsset.errors);
  expect(propertyNames(detail)).toEqual(["id"]);
  expect(Value.Check(detail, { id })).toBe(true);
  expect(Value.Check(detail, { id, generation })).toBe(false);
  expect(codes(bindReadingAsset.errors)).toContain("not_found");
  expect(detailOf(bindReadingAsset.errors, "not_found")).toBeUndefined();
});

it("echoes the request pair when revoke is rejected", () => {
  expect(Value.Check(revokeReadingAsset.request, { id, generation })).toBe(
    true,
  );
  expect(Value.Check(revokeReadingAsset.request, { id })).toBe(false);
  expect(
    Value.Check(revokeReadingAsset.request, {
      id,
      generation: Number.MAX_SAFE_INTEGER + 1,
    }),
  ).toBe(false);
  expect(Value.Check(revokeReadingAsset.response, { id, generation })).toBe(
    true,
  );
  const detail = requiredDetail(revokeReadingAsset.errors);
  expect(propertyNames(detail)).toEqual(["id", "generation"]);
  expect(Value.Check(detail, { id, generation })).toBe(true);
  expect(Value.Check(detail, { id, generation, progressPage: 1 })).toBe(false);
  expect(codes(revokeReadingAsset.errors)).not.toContain("not_found");
});

function codes(
  errors: readonly { readonly code: string }[],
): readonly string[] {
  return errors.map((error) => error.code);
}

function detailOf(
  errors: readonly { readonly code: string; readonly detail?: unknown }[],
  code: string,
): unknown {
  return errors.find((error) => error.code === code)?.detail;
}

function requiredDetail(
  errors: readonly { readonly code: string; readonly detail?: unknown }[],
): TSchema {
  const detail = detailOf(errors, "rejected");
  if (!isSchema(detail)) {
    throw new Error("rejected detail");
  }
  return detail;
}

function isSchema(value: unknown): value is TSchema {
  return typeof value === "object" && value !== null && "type" in value;
}

function propertyNames(schema: unknown): string[] {
  if (typeof schema !== "object" || schema === null) {
    return [];
  }
  const properties = (schema as { properties?: unknown }).properties;
  if (typeof properties !== "object" || properties === null) {
    return [];
  }
  return Object.keys(properties);
}
