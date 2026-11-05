import type { Result } from "@oi/kernel";

import type {
  PdfDocuments,
  PdfOpenFacts,
  PdfPageGeometry,
  ReaderCancel,
} from "../application/ports/pdf-documents.js";
import { readerFailure, type ReaderFailure } from "../domain/reader-failure.js";

export type FakePdfOptions = {
  readonly pageCount?: number;
  readonly width?: number;
  readonly height?: number;
  readonly fail?: "not_pdf" | "rejected";
};

export type FakePdfDocuments = PdfDocuments & {
  readonly openCount: () => number;
};

type Spec = {
  readonly pageCount: number;
  readonly width: number;
  readonly height: number;
  readonly fail: FakePdfOptions["fail"];
};

export function createFakePdfDocuments(
  options?: FakePdfOptions,
): FakePdfDocuments {
  let opens = 0;
  const opened = new Set<string>();
  const spec: Spec = {
    pageCount: options?.pageCount ?? 2,
    width: options?.width ?? 200,
    height: options?.height ?? 400,
    fail: options?.fail,
  };
  return {
    openCount() {
      return opens;
    },
    open(id, bytes, signal) {
      opens += bytes.byteLength >= 0 ? 1 : 0;
      const result = openFacts(spec, signal);
      if (result.ok) {
        opened.add(id);
      }
      return Promise.resolve(result);
    },
    readPage(id, pageNumber, signal) {
      return Promise.resolve(
        readFacts(spec, { signal, opened: opened.has(id), pageNumber }),
      );
    },
  };
}

function openFacts(
  spec: Spec,
  signal: ReaderCancel,
): Result<PdfOpenFacts, ReaderFailure> {
  if (signal.aborted) {
    return { ok: false, error: readerFailure("rejected") };
  }
  if (spec.fail !== undefined) {
    return { ok: false, error: readerFailure(spec.fail) };
  }
  return {
    ok: true,
    value: {
      pageCount: spec.pageCount,
      firstPage: {
        pageNumber: 1,
        width: spec.width,
        height: spec.height,
      },
    },
  };
}

type ReadInput = {
  readonly signal: ReaderCancel;
  readonly opened: boolean;
  readonly pageNumber: number;
};

function readFacts(
  spec: Spec,
  input: ReadInput,
): Result<PdfPageGeometry, ReaderFailure> {
  if (input.signal.aborted || spec.fail !== undefined || !input.opened) {
    return { ok: false, error: readerFailure("rejected") };
  }
  if (input.pageNumber < 1 || input.pageNumber > spec.pageCount) {
    return { ok: false, error: readerFailure("rejected") };
  }
  return {
    ok: true,
    value: {
      pageNumber: input.pageNumber,
      width: spec.width,
      height: spec.height,
    },
  };
}
