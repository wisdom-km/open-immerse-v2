import type { ParseServiceStatus } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import { classifyParseRecord } from "../../domain/parse-record.js";
import type { ParseRecordFailure } from "../../domain/parse-record-failure.js";
import type { ParseSecretLookup } from "../ports/parse-secret-lookup.js";
import type { ParseServiceStore } from "../ports/parse-service-store.js";

export type GetParseServiceStatusDeps = {
  readonly store: ParseServiceStore;
  readonly secrets: ParseSecretLookup;
};

export type GetParseServiceStatus = (
  input: Record<string, never>,
) => Result<ParseServiceStatus, ParseRecordFailure>;

export function createGetParseServiceStatus(
  deps: GetParseServiceStatusDeps,
): GetParseServiceStatus {
  return () => readStatus(deps);
}

function readStatus(
  deps: GetParseServiceStatusDeps,
): Result<ParseServiceStatus, ParseRecordFailure> {
  const read = deps.store.readMetadata();
  if (!read.ok) {
    return read;
  }
  return classifyParseRecord(read.value, (slot) => deps.secrets.lookup(slot));
}
