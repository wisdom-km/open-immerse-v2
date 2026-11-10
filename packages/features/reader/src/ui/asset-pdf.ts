import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  openPdfSession,
  type PdfLoadingTask,
  type PdfOpenParams,
} from "./pdf-session.js";
import type { OpenedPdf } from "./reader-client.js";
import { assignWorkerSrc } from "./worker-src.js";

type PdfModule = {
  readonly GlobalWorkerOptions: { workerSrc: string };
  getDocument(params: PdfOpenParams): {
    readonly promise: Promise<unknown>;
    destroy(): Promise<void>;
  };
};

export async function loadAssetPdf(
  url: string,
): Promise<OpenedPdf | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok || !isPdfModule(pdfjs)) {
      return undefined;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    assignWorkerSrc(pdfjs);
    const session = await openPdfSession(bytes, {
      getDocument(params) {
        return pdfjs.getDocument(params) as unknown as PdfLoadingTask;
      },
    });
    if (session === undefined) {
      return undefined;
    }
    return {
      pageCount: session.pageCount,
      paint: (page, canvas) => session.paint(page, canvas),
      cancel(canvas) {
        session.cancel(canvas);
      },
      close: () => session.close(),
    };
  } catch {
    return undefined;
  }
}

function isPdfModule(value: unknown): value is PdfModule {
  if (
    typeof value !== "object" ||
    value === null ||
    !("getDocument" in value) ||
    typeof value.getDocument !== "function" ||
    !("GlobalWorkerOptions" in value)
  ) {
    return false;
  }
  const options = value.GlobalWorkerOptions;
  return (
    (typeof options === "function" ||
      (typeof options === "object" && options !== null)) &&
    "workerSrc" in options
  );
}
