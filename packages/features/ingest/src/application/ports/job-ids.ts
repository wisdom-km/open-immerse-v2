import type { JobId } from "@oi/contracts";

export type JobIdSource = {
  next(): JobId;
};
