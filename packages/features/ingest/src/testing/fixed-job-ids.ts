import { parseJobId, type JobId } from "@oi/contracts";

import type { JobIdSource } from "../application/ports/job-ids.js";

export type FixedJobIds = JobIdSource & {
  readonly calls: () => number;
};

export function createFixedJobIds(values: readonly string[]): FixedJobIds {
  let cursor = 0;
  let calls = 0;
  return {
    calls() {
      return calls;
    },
    next() {
      calls += 1;
      const value = values[cursor];
      cursor += 1;
      return jobId(value);
    },
  };
}

function jobId(value: string | undefined): JobId {
  const parsed = value === undefined ? undefined : parseJobId(value);
  if (parsed === undefined || !parsed.ok) {
    throw new Error("job id");
  }
  return parsed.value;
}
