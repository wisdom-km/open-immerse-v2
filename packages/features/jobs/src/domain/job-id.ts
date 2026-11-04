import { parseJobId, type JobId } from "../../../../contracts/src/ids.js";

export { parseJobId };
export type { JobId };

export function sameJobId(left: JobId, right: JobId): boolean {
  return left === right;
}
