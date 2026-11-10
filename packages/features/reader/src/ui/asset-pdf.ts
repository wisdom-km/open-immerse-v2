import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

import type { OpenedPdf } from "./reader-client.js";

type PdfPage = {
  getViewport(params: { readonly scale: number }): {
    readonly width: number;
    readonly height: number;
  };
  render(params: {
    readonly canvasContext: CanvasRenderingContext2D;
    readonly canvas: HTMLCanvasElement;
    readonly viewport: { readonly width: number; readonly height: number };
  }): { readonly promise: Promise<void> };
};

type PdfDocument = {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
};

type PdfModule = {
  getDocument(params: {
    readonly data: Uint8Array;
    readonly isEvalSupported: false;
  }): { readonly promise: Promise<PdfDocument> };
};

export async function loadAssetPdf(
  url: string,
): Promise<OpenedPdf | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return undefined;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const doc = await openDocument(bytes);
    if (doc === undefined) {
      return undefined;
    }
    return {
      pageCount: doc.numPages,
      paint: (page, canvas) => paintPage(doc, page, canvas),
    };
  } catch {
    return undefined;
  }
}

async function openDocument(
  bytes: Uint8Array,
): Promise<PdfDocument | undefined> {
  if (!isPdfModule(pdfjs)) {
    return undefined;
  }
  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false })
    .promise;
  if (!Number.isInteger(doc.numPages) || doc.numPages < 1) {
    return undefined;
  }
  return doc;
}

async function paintPage(
  doc: PdfDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }
  await page.render({ canvasContext: context, canvas, viewport }).promise;
}

function isPdfModule(value: unknown): value is PdfModule {
  if (
    typeof value !== "object" ||
    value === null ||
    !("getDocument" in value)
  ) {
    return false;
  }
  return typeof value.getDocument === "function";
}
