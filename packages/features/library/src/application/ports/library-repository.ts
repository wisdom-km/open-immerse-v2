import type { Result } from "@oi/kernel";

import type { LibraryEntryId } from "@oi/contracts";

import type { LibraryFailure } from "../../domain/library-failure.js";
import type { LibraryRecord } from "../../domain/library-record.js";

export type LibrarySourceUpdate = {
  readonly originalPath: string;
  readonly fileName: string;
};

export type LibraryProgressUpdate = {
  readonly openedAt: string;
  readonly progressPage: number | null;
};

export type LibraryRepository = {
  findById(id: LibraryEntryId): Result<LibraryRecord | null, LibraryFailure>;
  insert(record: LibraryRecord): Result<void, LibraryFailure>;
  list(): Result<readonly LibraryRecord[], LibraryFailure>;
  updateSource(
    id: LibraryEntryId,
    source: LibrarySourceUpdate,
  ): Result<LibraryRecord, LibraryFailure>;
  updateProgress(
    id: LibraryEntryId,
    progress: LibraryProgressUpdate,
  ): Result<LibraryRecord, LibraryFailure>;
};

/**
 * 只写页码。不并进 LibraryRepository：ingest 的测试双已经实现后者，
 * 加必选方法会让本 PR 改到第二个切片。
 */
export type LibraryProgressPageUpdate = {
  updateProgressPage(
    id: LibraryEntryId,
    page: number,
  ): Result<LibraryRecord, LibraryFailure>;
};
