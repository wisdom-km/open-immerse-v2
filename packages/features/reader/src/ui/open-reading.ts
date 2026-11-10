import { clampPage } from "../pure.js";

import { MISSING_DOCUMENT, UNREADABLE_PDF } from "./copy.js";
import { assetUrl, type Pair, type ReaderClient } from "./reader-client.js";

export type ReadingView = {
  readonly sentence: string | undefined;
  readonly pair: Pair | undefined;
  readonly pageCount: number | undefined;
  readonly page: number | undefined;
  readonly lostPlace: boolean;
  readonly paint:
    | ((page: number, canvas: HTMLCanvasElement) => Promise<void>)
    | undefined;
};

export async function openReading(
  client: ReaderClient,
  id: string,
): Promise<ReadingView> {
  const opened = await client.openDocument(id);
  if (!opened.ok) {
    return blocked(opened.code);
  }
  const bound = await client.bind(id);
  if (!bound.ok) {
    return blocked(bound.code);
  }
  const pair = { id: bound.id, generation: bound.generation };
  const [progress, pdf] = await Promise.all([
    client.readPage(pair.id, pair.generation),
    client.openPdf(assetUrl(bound.assetId)),
  ]);
  if (pdf === undefined) {
    return { ...blocked("other"), pair };
  }
  return placed(progress, pdf, pair);
}

function placed(
  progress: Awaited<ReturnType<ReaderClient["readPage"]>>,
  pdf: NonNullable<Awaited<ReturnType<ReaderClient["openPdf"]>>>,
  pair: Pair,
): ReadingView {
  if (!progress.ok || !samePair(progress, pair)) {
    return firstPage(pair, pdf, true);
  }
  if (progress.progressPage === null) {
    return firstPage(pair, pdf, false);
  }
  const page = clampPage(progress.progressPage, pdf.pageCount);
  if (page === undefined) {
    return { ...blocked("other"), pair };
  }
  return ready(pair, pdf, page, false);
}

function firstPage(
  pair: Pair,
  pdf: NonNullable<Awaited<ReturnType<ReaderClient["openPdf"]>>>,
  lostPlace: boolean,
): ReadingView {
  const page = clampPage(1, pdf.pageCount);
  if (page === undefined) {
    return { ...blocked("other"), pair };
  }
  return ready(pair, pdf, page, lostPlace);
}

function ready(
  pair: Pair,
  pdf: NonNullable<Awaited<ReturnType<ReaderClient["openPdf"]>>>,
  page: number,
  lostPlace: boolean,
): ReadingView {
  return {
    sentence: undefined,
    pair,
    pageCount: pdf.pageCount,
    page,
    lostPlace,
    paint: (pageNumber, canvas) => pdf.paint(pageNumber, canvas),
  };
}

function blocked(code: string): ReadingView {
  return {
    sentence: code === "not_found" ? MISSING_DOCUMENT : UNREADABLE_PDF,
    pair: undefined,
    pageCount: undefined,
    page: undefined,
    lostPlace: false,
    paint: undefined,
  };
}

function samePair(
  progress: { readonly id: string; readonly generation: number },
  pair: Pair,
): boolean {
  return progress.id === pair.id && progress.generation === pair.generation;
}
