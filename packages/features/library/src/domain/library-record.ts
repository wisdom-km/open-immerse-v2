import type { LibraryEntry, LibraryEntryId } from "@oi/contracts";

const FILE_NAME = /^[^/\\]+$/;
const TITLE = /^(?!\/)(?!\\)(?![A-Za-z]:[\\/]).*$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

/** 仅 main / core。originalPath 不得进入返回给调用方的 LibraryEntry。 */
export type LibraryRecord = {
  readonly id: LibraryEntryId;
  readonly fileName: string;
  readonly title: string;
  readonly originalPath: string;
  readonly addedAt: string;
  readonly openedAt: string | null;
  readonly progressPage: number | null;
};

export function toLibraryEntry(record: LibraryRecord): LibraryEntry {
  return {
    id: record.id,
    fileName: record.fileName,
    title: record.title,
    addedAt: record.addedAt,
    openedAt: record.openedAt,
  };
}

export function parseTitle(title: string): string | undefined {
  if (!TITLE.test(title)) {
    return undefined;
  }
  return title;
}

/** 无解析时的标题：去掉末尾的 .pdf，大小写不敏感。 */
export function titleFromFileName(fileName: string): string | undefined {
  const title = fileName.toLowerCase().endsWith(".pdf")
    ? fileName.slice(0, -4)
    : fileName;
  return parseTitle(title);
}

export function parseFileName(fileName: string): string | undefined {
  if (fileName === "." || fileName === ".." || !FILE_NAME.test(fileName)) {
    return undefined;
  }
  return fileName;
}

export function parseTimestamp(value: string): string | undefined {
  if (!TIMESTAMP.test(value)) {
    return undefined;
  }
  return value;
}

export function formatUtc(nowMs: number): string | undefined {
  if (!Number.isFinite(nowMs)) {
    return undefined;
  }
  return parseTimestamp(new Date(nowMs).toISOString());
}

export function parseProgressPage(
  page: number | null,
): number | null | undefined {
  if (page === null) {
    return null;
  }
  if (!Number.isInteger(page) || page < 1) {
    return undefined;
  }
  return page;
}
