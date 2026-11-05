import type { LibraryEntryId, ReaderViewMode } from "@oi/contracts";

import type { RememberedZoom } from "../../domain/zoom-bounds.js";

export type OpenReader = {
  readonly id: LibraryEntryId;
  readonly title: string;
  readonly fileName: string;
  readonly pageCount: number;
  readonly pageWidth: number;
  readonly pageHeight: number;
  readonly currentPage: number;
  readonly zoomPercent: number;
  readonly zoom: RememberedZoom;
  readonly viewMode: ReaderViewMode;
};

/** 进程内按 id 记住。调用方持有实例，不做成模块级单例。 */
export type ReaderState = {
  readonly find: (id: LibraryEntryId) => OpenReader | undefined;
  readonly save: (reader: OpenReader) => void;
};
