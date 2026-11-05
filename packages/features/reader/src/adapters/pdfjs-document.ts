import type {
  PdfDocuments,
  PdfOpenFacts,
  PdfPageGeometry,
  ReaderCancel,
} from "../application/ports/pdf-documents.js";
import { looksLikePdf } from "../domain/pdf-bytes.js";
import { readerFailure, type ReaderFailure } from "../domain/reader-failure.js";

type DocumentId = Parameters<PdfDocuments["open"]>[0];

type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

type PdfjsPage = {
  getViewport(params: { readonly scale: number }): {
    readonly width: number;
    readonly height: number;
  };
};

type PdfjsDocument = {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<PdfjsPage>;
  destroy(): Promise<void> | void;
};

type PdfjsModule = {
  getDocument(params: PdfjsInit): {
    readonly promise: Promise<PdfjsDocument>;
  };
};

export type PdfjsInit = {
  readonly data: Uint8Array;
  readonly isEvalSupported: false;
};

/** 创建 PDF.js 文档时唯一的初始化参数。isEvalSupported 恒为 false。 */
export function pdfjsInitParameters(data: Uint8Array): PdfjsInit {
  return { data, isEvalSupported: false };
}

export function createPdfjsDocuments(): PdfDocuments {
  const openDocs = new Map<DocumentId, PdfjsDocument>();
  return {
    open(id, bytes, signal) {
      return openDocument(openDocs, id, bytes, signal);
    },
    readPage(id, pageNumber, signal) {
      return readDocumentPage(openDocs, id, pageNumber, signal);
    },
  };
}

async function openDocument(
  openDocs: Map<DocumentId, PdfjsDocument>,
  id: DocumentId,
  bytes: Uint8Array,
  signal: ReaderCancel,
): Promise<Result<PdfOpenFacts, ReaderFailure>> {
  if (signal.aborted) {
    return { ok: false, error: readerFailure("rejected") };
  }
  if (!looksLikePdf(bytes)) {
    return { ok: false, error: readerFailure("not_pdf") };
  }
  let doc: PdfjsDocument | undefined;
  try {
    doc = await loadDocument(bytes);
    const facts = await firstPageFacts(doc);
    await replaceDocument(openDocs, id, doc);
    return { ok: true, value: facts };
  } catch {
    await destroyQuiet(doc);
    return { ok: false, error: readerFailure("not_pdf") };
  }
}

async function readDocumentPage(
  openDocs: Map<DocumentId, PdfjsDocument>,
  id: DocumentId,
  pageNumber: number,
  signal: ReaderCancel,
): Promise<Result<PdfPageGeometry, ReaderFailure>> {
  if (signal.aborted) {
    return { ok: false, error: readerFailure("rejected") };
  }
  const doc = openDocs.get(id);
  if (doc === undefined) {
    return { ok: false, error: readerFailure("not_found") };
  }
  if (!onDocument(doc, pageNumber)) {
    return { ok: false, error: readerFailure("rejected") };
  }
  try {
    return { ok: true, value: await pageGeometry(doc, pageNumber) };
  } catch {
    return { ok: false, error: readerFailure("rejected") };
  }
}

function onDocument(doc: PdfjsDocument, pageNumber: number): boolean {
  return (
    Number.isInteger(pageNumber) &&
    pageNumber >= 1 &&
    pageNumber <= doc.numPages
  );
}

async function loadDocument(bytes: Uint8Array): Promise<PdfjsDocument> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument(pdfjsInitParameters(bytes));
  const doc = await task.promise;
  if (!Number.isInteger(doc.numPages) || doc.numPages < 1) {
    await destroyDocument(doc);
    throw new Error("pdfjs");
  }
  return doc;
}

async function firstPageFacts(doc: PdfjsDocument): Promise<PdfOpenFacts> {
  const firstPage = await pageGeometry(doc, 1);
  if (firstPage.width <= 0 || firstPage.height <= 0) {
    throw new Error("pdfjs");
  }
  return { pageCount: doc.numPages, firstPage };
}

async function destroyQuiet(doc: PdfjsDocument | undefined): Promise<void> {
  if (doc !== undefined) {
    await destroyDocument(doc);
  }
}

async function pageGeometry(
  doc: PdfjsDocument,
  pageNumber: number,
): Promise<PdfPageGeometry> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
  };
}

async function replaceDocument(
  openDocs: Map<DocumentId, PdfjsDocument>,
  id: DocumentId,
  doc: PdfjsDocument,
): Promise<void> {
  const previous = openDocs.get(id);
  if (previous !== undefined) {
    await destroyDocument(previous);
  }
  openDocs.set(id, doc);
}

async function destroyDocument(doc: PdfjsDocument): Promise<void> {
  await doc.destroy();
}

async function loadPdfjs(): Promise<PdfjsModule> {
  const loaded: unknown = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!isPdfjsModule(loaded)) {
    throw new Error("pdfjs");
  }
  return loaded;
}

function isPdfjsModule(value: unknown): value is PdfjsModule {
  if (
    typeof value !== "object" ||
    value === null ||
    !("getDocument" in value)
  ) {
    return false;
  }
  return typeof value.getDocument === "function";
}
