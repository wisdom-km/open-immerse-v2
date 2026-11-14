import type { ParseServiceStatus } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import {
  parseRecordFailure,
  type ParseRecordFailure,
} from "./parse-record-failure.js";

export type ParseMetadata = {
  readonly vendorId: string;
  readonly format: string;
  readonly baseUrl: string;
  readonly modelId: string;
  readonly allowedHosts: readonly string[];
  readonly credentialSlot: string;
};

export type ParseSecretAnswer = "usable" | "unavailable";

export function classifyParseRecord(
  row: ParseMetadata | null,
  lookup: (slot: string) => ParseSecretAnswer,
): Result<ParseServiceStatus, ParseRecordFailure> {
  if (row === null) {
    return { ok: true, value: { state: "unconfigured" } };
  }
  if (!validRow(row)) {
    return { ok: false, error: parseRecordFailure("storage_corrupt") };
  }
  if (lookup(row.credentialSlot) === "usable") {
    return { ok: true, value: { state: "configured" } };
  }
  return { ok: false, error: parseRecordFailure("secret_unavailable") };
}

function validRow(row: ParseMetadata): boolean {
  return (
    filled(row.vendorId) &&
    filled(row.format) &&
    filled(row.baseUrl) &&
    filled(row.modelId) &&
    filled(row.credentialSlot) &&
    hostsOk(row.allowedHosts)
  );
}

function filled(value: string): boolean {
  return value.length > 0;
}

function hostsOk(hosts: readonly string[]): boolean {
  return hosts.length > 0 && hosts.every(filled);
}
