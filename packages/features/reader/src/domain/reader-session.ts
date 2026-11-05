import type {
  LibraryEntryId,
  ReaderSession,
  ReaderViewMode,
} from "@oi/contracts";

import { clampPage } from "./page-bounds.js";
import { parseZoomPercent } from "./zoom-bounds.js";

const SHA256_HEX = /^[0-9a-f]{64}$/;
const FILE_NAME = /^[^/\\]+$/;
const TITLE = /^(?!\/)(?!\\)(?![A-Za-z]:[\\/]).*$/;

/**
 * ③ 临时默认栏位。DESIGN.md 第 156 行仍写默认「对照」。
 * 本常量不改 DESIGN。M4 恢复对照。
 */
export const READER_VIEW_MODE_ORIGINAL = "original" as const;

export function parseReaderDocumentId(
  value: string,
): LibraryEntryId | undefined {
  if (!SHA256_HEX.test(value)) {
    return undefined;
  }
  return value as LibraryEntryId;
}

export function parseReaderFileName(value: string): string | undefined {
  if (value.length === 0 || !FILE_NAME.test(value)) {
    return undefined;
  }
  return value;
}

export function parseReaderTitle(value: string): string | undefined {
  if (!TITLE.test(value)) {
    return undefined;
  }
  return value;
}

export type ReaderSessionInput = {
  readonly id: LibraryEntryId;
  readonly title: string;
  readonly fileName: string;
  readonly pageCount: number;
  readonly currentPage: number;
  readonly zoomPercent: number;
  readonly viewMode: ReaderViewMode;
};

/**
 * 逐字段拷贝，不展开入参，避免 path / originalPath / filePath 被带进会话。
 * currentPage 先夹到 [1, pageCount]。
 */
export function buildReaderSession(
  input: ReaderSessionInput,
): ReaderSession | undefined {
  const currentPage = clampPage(input.currentPage, input.pageCount);
  const zoomPercent = parseZoomPercent(input.zoomPercent);
  const fileName = parseReaderFileName(input.fileName);
  const title = parseReaderTitle(input.title);
  if (
    currentPage === undefined ||
    zoomPercent === undefined ||
    fileName === undefined ||
    title === undefined
  ) {
    return undefined;
  }
  return {
    id: input.id,
    title,
    fileName,
    pageCount: input.pageCount,
    currentPage,
    zoomPercent,
    viewMode: input.viewMode,
  };
}
