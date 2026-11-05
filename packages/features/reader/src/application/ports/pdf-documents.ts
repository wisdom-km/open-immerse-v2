import type { LibraryEntryId } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import type { ReaderFailure } from "../../domain/reader-failure.js";

export type PdfPageGeometry = {
  readonly pageNumber: number;
  readonly width: number;
  readonly height: number;
};

export type PdfOpenFacts = {
  readonly pageCount: number;
  readonly firstPage: PdfPageGeometry;
};

/**
 * 取消令牌只看 aborted。
 * core 的 lib 没有 DOM，不能写 AbortSignal 这个名字（G14）。
 * 真实的 AbortSignal 结构上满足本类型。它不穿过 index.ts 的用例入参。
 */
export type ReaderCancel = {
  readonly aborted: boolean;
};

export type PdfDocuments = {
  open(
    id: LibraryEntryId,
    bytes: Uint8Array,
    signal: ReaderCancel,
  ): Promise<Result<PdfOpenFacts, ReaderFailure>>;
  readPage(
    id: LibraryEntryId,
    pageNumber: number,
    signal: ReaderCancel,
  ): Promise<Result<PdfPageGeometry, ReaderFailure>>;
};
