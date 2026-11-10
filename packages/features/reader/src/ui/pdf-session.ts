export type PdfLoadingTask = {
  readonly promise: Promise<PdfDocument>;
  destroy(): Promise<void>;
};

export type PdfDocument = {
  readonly numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  destroy?: () => Promise<void> | void;
  cleanup?: () => Promise<void> | void;
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

export type PdfSource = {
  getDocument(params: {
    readonly data: Uint8Array;
    readonly isEvalSupported: false;
  }): PdfLoadingTask;
};

export type PdfSession = {
  readonly pageCount: number;
  paint(page: number, canvas: HTMLCanvasElement): Promise<void>;
  cancel(canvas: HTMLCanvasElement): void;
  close(): Promise<void>;
};

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
      return paintCanvas(doc, page, canvas, renders, tokens);
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
      return releaseDocument(doc, task);
    },
  };
}

async function paintCanvas(
  doc: PdfDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  renders: Renders,
  tokens: Map<HTMLCanvasElement, number>,
): Promise<void> {
  const token = (tokens.get(canvas) ?? 0) + 1;
  tokens.set(canvas, token);
  cancelRender(renders, canvas);
  const page = await doc.getPage(pageNumber);
  if (tokens.get(canvas) !== token) {
    return;
  }
  const viewport = page.getViewport({ scale: 1 });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  if (context === null || tokens.get(canvas) !== token) {
    return;
  }
  const render = page.render({ canvasContext: context, canvas, viewport });
  renders.set(canvas, render);
  try {
    await render.promise;
  } catch (error) {
    if (!isCancelled(error)) {
      throw error;
    }
  } finally {
    if (renders.get(canvas) === render) {
      renders.delete(canvas);
    }
  }
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

async function releaseDocument(
  doc: PdfDocument,
  task: PdfLoadingTask,
): Promise<void> {
  await destroyDocument(doc);
  // 6.5 的 loadingTask.destroy 会拆掉文档 transport 和 worker。
  await destroyTask(task);
}

async function destroyDocument(doc: PdfDocument): Promise<void> {
  try {
    if (typeof doc.destroy === "function") {
      await doc.destroy();
      return;
    }
    if (typeof doc.cleanup === "function") {
      await doc.cleanup();
    }
  } catch {
    return undefined;
  }
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
    return source.getDocument({ data: bytes, isEvalSupported: false });
  } catch {
    return undefined;
  }
}

function isCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "RenderingCancelledException"
  );
}
