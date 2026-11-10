import { PDF_WASM_URL } from "./worker-src.js";

export type PdfLoadingTask = {
  readonly promise: Promise<PdfDocument>;
  destroy(): Promise<void>;
};

export type PdfDocument = {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
};

export type PdfPage = {
  getViewport(params: { readonly scale: number }): {
    readonly width: number;
    readonly height: number;
  };
  render(params: {
    readonly canvasContext: CanvasRenderingContext2D;
    readonly canvas: HTMLCanvasElement;
    readonly viewport: { readonly width: number; readonly height: number };
  }): PdfRenderTask;
};

export type PdfRenderTask = {
  readonly promise: Promise<void>;
  cancel(): void;
};

export type PdfOpenParams = {
  readonly data: Uint8Array;
  readonly isEvalSupported: false;
  readonly wasmUrl: string;
  readonly useWasm: false;
};

export type PdfSource = {
  getDocument(params: PdfOpenParams): PdfLoadingTask;
};

export type PdfSession = {
  readonly pageCount: number;
  paint(page: number, canvas: HTMLCanvasElement): Promise<void>;
  cancel(canvas: HTMLCanvasElement): void;
  close(): Promise<void>;
};

export function paintErrorIsQuiet(error: unknown): boolean {
  return errorName(error) === "RenderingCancelledException";
}

type Renders = Map<HTMLCanvasElement, PdfRenderTask>;

export async function openPdfSession(
  bytes: Uint8Array,
  source: PdfSource,
): Promise<PdfSession | undefined> {
  const task = startTask(source, bytes);
  if (task === undefined) {
    return undefined;
  }
  void task.promise.catch(() => undefined);
  try {
    const doc = await task.promise;
    if (!Number.isInteger(doc.numPages) || doc.numPages < 1) {
      await destroyTask(task);
      return undefined;
    }
    return createPdfSession(doc, task);
  } catch {
    await destroyTask(task);
    return undefined;
  }
}

export function createPdfSession(
  doc: PdfDocument,
  task: PdfLoadingTask,
): PdfSession {
  const renders: Renders = new Map();
  const tokens = new Map<HTMLCanvasElement, number>();
  let closed = false;
  return {
    pageCount: doc.numPages,
    paint(page, canvas) {
      if (closed) {
        return Promise.resolve();
      }
      return paintCanvas({
        doc,
        pageNumber: page,
        canvas,
        renders,
        tokens,
        isClosed: () => closed,
      });
    },
    cancel(canvas) {
      cancelRender(renders, canvas);
    },
    close() {
      if (closed) {
        return Promise.resolve();
      }
      closed = true;
      cancelAll(renders);
      return releaseDocument(task);
    },
  };
}

type PaintRequest = {
  readonly doc: PdfDocument;
  readonly pageNumber: number;
  readonly canvas: HTMLCanvasElement;
  readonly renders: Renders;
  readonly tokens: Map<HTMLCanvasElement, number>;
  readonly isClosed: () => boolean;
};

async function paintCanvas(request: PaintRequest): Promise<void> {
  const token = (request.tokens.get(request.canvas) ?? 0) + 1;
  request.tokens.set(request.canvas, token);
  cancelRender(request.renders, request.canvas);
  try {
    const page = await request.doc.getPage(request.pageNumber);
    if (paintStopped(request, token)) {
      return;
    }
    await drawPage(request, page, token);
  } catch (error) {
    if (request.isClosed() || isCancelled(error)) {
      return;
    }
    throw error;
  }
}

async function drawPage(
  request: PaintRequest,
  page: PdfPage,
  token: number,
): Promise<void> {
  const viewport = page.getViewport({ scale: 1 });
  request.canvas.width = Math.ceil(viewport.width);
  request.canvas.height = Math.ceil(viewport.height);
  if (paintStopped(request, token)) {
    return;
  }
  const context = request.canvas.getContext("2d");
  if (context === null) {
    console.error(new Error("2d context missing"));
    return;
  }
  const render = page.render({
    canvasContext: context,
    canvas: request.canvas,
    viewport,
  });
  request.renders.set(request.canvas, render);
  try {
    await render.promise;
  } finally {
    if (request.renders.get(request.canvas) === render) {
      request.renders.delete(request.canvas);
    }
  }
}

function paintStopped(request: PaintRequest, token: number): boolean {
  return request.isClosed() || request.tokens.get(request.canvas) !== token;
}

function cancelRender(renders: Renders, canvas: HTMLCanvasElement): void {
  const current = renders.get(canvas);
  if (current === undefined) {
    return;
  }
  renders.delete(canvas);
  current.cancel();
}

function cancelAll(renders: Renders): void {
  for (const canvas of [...renders.keys()]) {
    cancelRender(renders, canvas);
  }
}

function releaseDocument(task: PdfLoadingTask): Promise<void> {
  // pdf.js 6.5.438 的 PDFDocumentProxy 没有 destroy。
  // loadingTask.destroy 会拆掉 transport 和 worker。
  return destroyTask(task);
}

async function destroyTask(task: PdfLoadingTask): Promise<void> {
  try {
    await task.destroy();
  } catch {
    return undefined;
  }
}

function startTask(
  source: PdfSource,
  bytes: Uint8Array,
): PdfLoadingTask | undefined {
  try {
    return source.getDocument({
      data: bytes,
      isEvalSupported: false,
      wasmUrl: PDF_WASM_URL,
      useWasm: false,
    });
  } catch {
    return undefined;
  }
}

function isCancelled(error: unknown): boolean {
  return errorName(error) === "RenderingCancelledException";
}

function errorName(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("name" in error)) {
    return undefined;
  }
  return typeof error.name === "string" ? error.name : undefined;
}
