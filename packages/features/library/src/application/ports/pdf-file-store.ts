import type { LibraryEntryId } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import type { LibraryFailure } from "../../domain/library-failure.js";

export type InspectedPdf = {
  readonly id: LibraryEntryId;
  readonly fileName: string;
};

/** 只负责字节落盘。lib_ 行由 repository 在事务里写。 */
export type PdfFileStore = {
  inspect(sourcePath: string): Result<InspectedPdf, LibraryFailure>;
  placeCopy(
    sourcePath: string,
    id: LibraryEntryId,
  ): Result<void, LibraryFailure>;
  removeCopy(id: LibraryEntryId): Result<void, LibraryFailure>;
};
