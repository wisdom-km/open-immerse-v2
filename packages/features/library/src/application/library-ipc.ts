import type { LibraryCommands } from "@oi/contracts";

import type { PdfPicker } from "./ports/pdf-picker.js";
import type { ImportPdf } from "./use-cases/import-pdf.js";
import type { ListLibrary } from "./use-cases/list-library.js";
import type { RelocateSource } from "./use-cases/relocate-source.js";

/** 拖入的绝对路径不进 request schema，由 main 在契约参数之外传入。 */
export type DroppedPdfImport = (
  absolutePath: string,
) => ReturnType<LibraryCommands["importDropped"]>;

export type LibraryIpcHandlers = {
  readonly import: LibraryCommands["import"];
  readonly importDropped: DroppedPdfImport;
  readonly list: LibraryCommands["list"];
  readonly relocate: LibraryCommands["relocate"];
};

export type LibraryIpcDeps = {
  readonly importPdf: ImportPdf;
  readonly listLibrary: ListLibrary;
  readonly relocateSource: RelocateSource;
  readonly pickPdf: PdfPicker;
};
