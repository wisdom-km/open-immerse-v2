import type { Openings } from "../application/ports/openings.js";

type EntryId = Parameters<Openings["find"]>[0];
type RememberedJob = NonNullable<ReturnType<Openings["find"]>>;

/** 进程内的打开记忆。只在这一份实例里复用 jobId。 */
export function createMemoryOpenings(): Openings {
  const rows = new Map<EntryId, RememberedJob>();
  return {
    find(id) {
      return rows.get(id);
    },
    remember(id, jobId) {
      rows.set(id, jobId);
    },
  };
}
