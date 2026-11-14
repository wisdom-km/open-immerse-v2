import type { Result } from "@oi/kernel";

import type { ParseRecordFailure } from "../../domain/parse-record-failure.js";
import type { ParseMetadata } from "../../domain/parse-record.js";

export type ParseServiceStore = {
  readMetadata(): Result<ParseMetadata | null, ParseRecordFailure>;
};
