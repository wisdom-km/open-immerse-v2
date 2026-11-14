import type { AppStorage } from "@oi/platform-node";

import type { ParseServiceStore } from "../application/ports/parse-service-store.js";
import { parseRecordFailure } from "../domain/parse-record-failure.js";
import type { ParseMetadata } from "../domain/parse-record.js";

type ReadMetadata = ReturnType<ParseServiceStore["readMetadata"]>;

const SELECT_PARSE =
  "SELECT vendor_id, format, base_url, model_id, allowed_hosts, credential_slot FROM set_providers WHERE purpose = 'parse'";

export function createSqliteParseServiceStore(
  storage: AppStorage,
): ParseServiceStore {
  return { readMetadata: () => readMetadata(storage) };
}

function readMetadata(storage: AppStorage): ReadMetadata {
  try {
    const rows = storage.queryAll(SELECT_PARSE);
    if (rows.length === 0) {
      return { ok: true, value: null };
    }
    const parsed = rows.length === 1 ? parseRow(rows[0]) : undefined;
    if (parsed === undefined) {
      return { ok: false, error: parseRecordFailure("storage_corrupt") };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: parseRecordFailure("storage_corrupt") };
  }
}

function parseRow(
  row: Record<string, unknown> | undefined,
): ParseMetadata | undefined {
  if (row === undefined) {
    return undefined;
  }
  const vendorId = text(row.vendor_id);
  const format = text(row.format);
  const baseUrl = text(row.base_url);
  const modelId = text(row.model_id);
  const credentialSlot = text(row.credential_slot);
  const allowedHosts = hosts(row.allowed_hosts);
  if (
    vendorId === undefined ||
    format === undefined ||
    baseUrl === undefined ||
    modelId === undefined ||
    credentialSlot === undefined ||
    allowedHosts === undefined
  ) {
    return undefined;
  }
  return { vendorId, format, baseUrl, modelId, allowedHosts, credentialSlot };
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function hosts(value: unknown): readonly string[] | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  try {
    return stringList(JSON.parse(value));
  } catch {
    return undefined;
  }
}

function stringList(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const list: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return undefined;
    }
    list.push(item);
  }
  return list;
}
