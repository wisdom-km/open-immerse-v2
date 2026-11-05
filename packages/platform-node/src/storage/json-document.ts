import type { Result } from "@oi/kernel";

import { storageFailure, type StorageFailure } from "./errors.js";

export type JsonDocumentMode = "read-write" | "read-only";

export type JsonDocument = {
  readonly schemaVersion: number;
  readonly mode: JsonDocumentMode;
  readonly value: Readonly<Record<string, unknown>>;
  readonly source: string;
};

export type JsonWriteResult = {
  readonly text: string;
  readonly writes: number;
};

export function readJsonDocument(
  text: string,
  supportedMajor: number,
): Result<JsonDocument, StorageFailure> {
  if (!Number.isInteger(supportedMajor) || supportedMajor < 1) {
    return rejectedJson();
  }
  const parsed = parseObject(text);
  if (!parsed.ok) {
    return parsed;
  }
  const schemaVersion = parsed.value.schemaVersion;
  if (!isMajor(schemaVersion)) {
    return rejectedJson();
  }
  return {
    ok: true,
    value: {
      schemaVersion,
      mode: schemaVersion > supportedMajor ? "read-only" : "read-write",
      value: parsed.value,
      source: text,
    },
  };
}

export function writeJsonDocument(
  document: JsonDocument,
  next: Readonly<Record<string, unknown>>,
): JsonWriteResult {
  if (document.mode === "read-only") {
    return { text: document.source, writes: 0 };
  }
  return {
    text: JSON.stringify({
      ...document.value,
      ...next,
      schemaVersion: document.schemaVersion,
    }),
    writes: 1,
  };
}

function parseObject(
  text: string,
): Result<Record<string, unknown>, StorageFailure> {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) {
      return rejectedJson();
    }
    return { ok: true, value: parsed };
  } catch {
    return rejectedJson();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMajor(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function rejectedJson(): Result<never, StorageFailure> {
  return {
    ok: false,
    error: storageFailure(
      "storage.json_rejected",
      "json document was rejected",
    ),
  };
}
