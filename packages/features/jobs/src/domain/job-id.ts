import { parseJobId, type JobId } from "@oi/contracts";

export { parseJobId };
export type { JobId };

export function sameJobId(left: JobId, right: JobId): boolean {
  return left === right;
}
