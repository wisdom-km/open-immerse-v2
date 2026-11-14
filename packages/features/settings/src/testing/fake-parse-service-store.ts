import type { Result } from "@oi/kernel";

import type { ParseServiceStore } from "../application/ports/parse-service-store.js";
import type { ParseRecordFailure } from "../domain/parse-record-failure.js";
import type { ParseMetadata } from "../domain/parse-record.js";

export function createFakeParseServiceStore(
  row: Result<ParseMetadata | null, ParseRecordFailure>,
): ParseServiceStore {
  return {
    readMetadata() {
      return row;
    },
  };
}
