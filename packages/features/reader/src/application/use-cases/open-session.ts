import type { LibraryEntryId, ReaderSession } from "@oi/contracts";
import type { Result } from "@oi/kernel";

import { looksLikePdf } from "../../domain/pdf-bytes.js";
import {
  readerFailure,
  type ReaderFailure,
} from "../../domain/reader-failure.js";
import {
  buildReaderSession,
  parseReaderDocumentId,
  parseReaderFileName,
  parseReaderTitle,
  READER_VIEW_MODE_ORIGINAL,
} from "../../domain/reader-session.js";
import { DEFAULT_ZOOM_PERCENT } from "../../domain/zoom-bounds.js";
import type { PdfOpenFacts, PdfDocuments } from "../ports/pdf-documents.js";
import type { OpenReader, ReaderState } from "../ports/reader-state.js";

const NOT_CANCELLED = { aborted: false } as const;

export type OpenReaderSessionInput = {
  readonly id: string;
  readonly title: string;
  readonly fileName: string;
  readonly bytes: Uint8Array;
};

export type OpenReaderSessionDeps = {
  readonly documents: PdfDocuments;
  readonly state: ReaderState;
};

export type OpenReaderSession = (
  input: OpenReaderSessionInput,
) => Promise<Result<ReaderSession, ReaderFailure>>;

type ParsedOpen = {
  readonly id: LibraryEntryId;
  readonly title: string;
  readonly fileName: string;
};

export function createOpenReaderSession(
  deps: OpenReaderSessionDeps,
): OpenReaderSession {
  return (input) => openReaderSession(deps, input);
}

async function openReaderSession(
  deps: OpenReaderSessionDeps,
  input: OpenReaderSessionInput,
): Promise<Result<ReaderSession, ReaderFailure>> {
  const parsed = parseInput(input);
  if (!parsed.ok) {
    return parsed;
  }
  const opened = await deps.documents.open(
    parsed.value.id,
    input.bytes,
    NOT_CANCELLED,
  );
  if (!opened.ok) {
    return opened;
  }
  return storeSession(deps.state, parsed.value, opened.value);
}

function parseInput(
  input: OpenReaderSessionInput,
): Result<ParsedOpen, ReaderFailure> {
  const id = parseReaderDocumentId(input.id);
  const title = parseReaderTitle(input.title);
  const fileName = parseReaderFileName(input.fileName);
  if (id === undefined) {
    return { ok: false, error: readerFailure("not_found") };
  }
  if (title === undefined || fileName === undefined) {
    return { ok: false, error: readerFailure("rejected") };
  }
  if (!looksLikePdf(input.bytes)) {
    return { ok: false, error: readerFailure("not_pdf") };
  }
  return { ok: true, value: { id, title, fileName } };
}

function storeSession(
  state: ReaderState,
  parsed: ParsedOpen,
  facts: PdfOpenFacts,
): Result<ReaderSession, ReaderFailure> {
  if (!usablePage(facts)) {
    return { ok: false, error: readerFailure("rejected") };
  }
  const existing = state.find(parsed.id);
  const session = buildReaderSession({
    id: parsed.id,
    title: parsed.title,
    fileName: parsed.fileName,
    pageCount: facts.pageCount,
    currentPage: 1,
    zoomPercent: existing?.zoomPercent ?? DEFAULT_ZOOM_PERCENT,
    viewMode: READER_VIEW_MODE_ORIGINAL,
  });
  if (session === undefined) {
    return { ok: false, error: readerFailure("rejected") };
  }
  state.save(storedReader(session, facts, existing));
  return { ok: true, value: session };
}

function usablePage(facts: PdfOpenFacts): boolean {
  return (
    Number.isFinite(facts.firstPage.width) &&
    Number.isFinite(facts.firstPage.height) &&
    facts.firstPage.width > 0 &&
    facts.firstPage.height > 0
  );
}

function storedReader(
  session: ReaderSession,
  facts: PdfOpenFacts,
  existing: OpenReader | undefined,
): OpenReader {
  return {
    id: session.id,
    title: session.title,
    fileName: session.fileName,
    pageCount: session.pageCount,
    pageWidth: facts.firstPage.width,
    pageHeight: facts.firstPage.height,
    currentPage: session.currentPage,
    zoomPercent: session.zoomPercent,
    zoom: existing?.zoom ?? {
      kind: "percent",
      zoomPercent: session.zoomPercent,
    },
    viewMode: session.viewMode,
  };
}
