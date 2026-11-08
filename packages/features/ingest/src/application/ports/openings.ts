import type { JobId, LibraryEntryId } from "@oi/contracts";

/** 调用方持有实例。重启或再创建一份，不保证还是同一个 jobId。 */
export type Openings = {
  find(id: LibraryEntryId): JobId | undefined;
  remember(id: LibraryEntryId, jobId: JobId): void;
};
