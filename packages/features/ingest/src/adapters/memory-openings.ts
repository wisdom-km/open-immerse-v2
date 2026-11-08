import type { JobId, LibraryEntryId } from "@oi/contracts";

import type { Openings } from "../application/ports/openings.js";

export function createMemoryOpenings(): Openings {
  const rows = new Map<LibraryEntryId, JobId>();
  return {
    find(id) {
      return rows.get(id);
    },
    remember(id, jobId) {
      rows.set(id, jobId);
    },
  };
}
