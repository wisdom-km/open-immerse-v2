import { expect, it, vi } from "vitest";

import {
  createPdfSession,
  openPdfSession,
  type PdfDocument,
  type PdfLoadingTask,
  type PdfPage,
  type PdfRenderTask,
} from "../../src/ui/pdf-session.js";
import { PDF_WASM_URL } from "../../src/ui/worker-src.js";

it("destroys the loading task once per open", async () => {
  const rounds = 5;
  let documents = 0;
  let tasks = 0;
  for (let index = 0; index < rounds; index += 1) {
    const session = createPdfSession(
      documentWithDestroy(() => {
        documents += 1;
      }),
      countingTask(() => {
        tasks += 1;
      }),
    );
    await session.close();
    await session.close();
  }
  expect(documents).toBe(0);
  expect(tasks).toBe(rounds);
});

it("does not start a render after the session has closed", async () => {
  let renders = 0;
  const waiters: Array<(page: PdfPage) => void> = [];
  const session = createPdfSession(
    waitingDocument(waiters),
    countingTask(() => undefined),
  );
  const pending = session.paint(1, fakeCanvas());
  await session.close();
  releaseClosed(waiters, () => {
    renders += 1;
  });
  await expect(pending).resolves.toBeUndefined();
  expect(renders).toBe(0);
});

it("returns quietly when the page request fails after close", async () => {
  let rejectPage: (error: unknown) => void = () => undefined;
  const session = createPdfSession(
    {
      numPages: 1,
      getPage() {
        return new Promise((_resolve, reject) => {
          rejectPage = reject;
        });
      },
    },
    countingTask(() => undefined),
  );
  const pending = session.paint(1, fakeCanvas());
  await session.close();
  rejectPage(new Error("Transport destroyed"));
  await expect(pending).resolves.toBeUndefined();
});

it("destroys the loading task when the document fails to open", async () => {
  let destroyed = 0;
  const bytes = new Uint8Array([1, 2, 3]);
  let params: unknown;
  const opened = await openPdfSession(bytes, {
    getDocument(next) {
      params = next;
      return {
        promise: Promise.reject(new Error("boom")),
        destroy() {
          destroyed += 1;
          return Promise.resolve();
        },
      };
    },
  });
  expect(opened).toBeUndefined();
  expect(destroyed).toBe(1);
  expect(params).toEqual({
    data: bytes,
    isEvalSupported: false,
    wasmUrl: PDF_WASM_URL,
    useWasm: false,
  });
});

it("cancels the in-flight render when the same canvas is painted again", async () => {
  const cancels = { count: 0 };
  const slots: Slot[] = [];
  const waiters: Array<(page: PdfPage) => void> = [];
  const session = createPdfSession(
    {
      numPages: 1,
      getPage() {
        return new Promise((resolve) => {
          waiters.push(resolve);
        });
      },
    },
    countingTask(() => undefined),
  );
  try {
    const canvas = fakeCanvas();
    const first = session.paint(1, canvas);
    release(waiters, slots, cancels);
    await flush();
    const second = session.paint(1, canvas);
    expect(cancels.count).toBe(1);
    release(waiters, slots, cancels);
    await flush();
    slots.at(-1)?.resolve();
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
  } finally {
    await session.close();
  }
});

it("reports a missing 2d context and does not render", async () => {
  const reported: unknown[] = [];
  const spy = vi
    .spyOn(console, "error")
    .mockImplementation((error: unknown) => {
      reported.push(error);
    });
  let renders = 0;
  const session = createPdfSession(
    blankPage(() => {
      renders += 1;
    }),
    countingTask(() => undefined),
  );
  try {
    await expect(
      session.paint(1, contextlessCanvas()),
    ).resolves.toBeUndefined();
    expect(renders).toBe(0);
    expect(reported.map(errorText)).toEqual(["2d context missing"]);
  } finally {
    spy.mockRestore();
    await session.close();
  }
});

it("sizes the backing store from devicePixelRatio and keeps the CSS size", async () => {
  const host = globalThis as { devicePixelRatio?: number };
  const previous = host.devicePixelRatio;
  host.devicePixelRatio = 2;
  const session = createPdfSession(
    blankPage(() => undefined),
    countingTask(() => undefined),
  );
  try {
    const canvas = fakeCanvas();
    await session.paint(1, canvas);
    expect(canvas.width).toBe(8);
    expect(canvas.height).toBe(8);
    expect(canvas.style.width).toBe("4px");
    expect(canvas.style.height).toBe("4px");
  } finally {
    host.devicePixelRatio = previous;
    await session.close();
  }
});

it("rejects a paint that fails for a reason other than cancellation", async () => {
  const waiters: Array<(page: PdfPage) => void> = [];
  const session = createPdfSession(
    {
      numPages: 1,
      getPage() {
        return new Promise((resolve) => {
          waiters.push(resolve);
        });
      },
    },
    countingTask(() => undefined),
  );
  const pending = session.paint(1, fakeCanvas());
  const resolve = waiters.shift();
  if (resolve === undefined) {
    throw new Error("no page");
  }
  resolve({
    getViewport() {
      return { width: 4, height: 4 };
    },
    render() {
      return {
        promise: Promise.reject(new Error("draw")),
        cancel() {
          return undefined;
        },
      };
    },
  });
  await expect(pending).rejects.toThrow("draw");
  await session.close();
});

type Slot = {
  resolve: () => void;
};

function documentWithDestroy(onDestroy: () => void): PdfDocument {
  const doc = {
    numPages: 1,
    getPage(): Promise<PdfPage> {
      return Promise.reject(new Error("unused"));
    },
    destroy() {
      onDestroy();
      return Promise.resolve();
    },
  };
  return doc;
}

function waitingDocument(waiters: Array<(page: PdfPage) => void>): PdfDocument {
  return {
    numPages: 1,
    getPage() {
      return new Promise((resolve) => {
        waiters.push(resolve);
      });
    },
  };
}

function releaseClosed(
  waiters: Array<(page: PdfPage) => void>,
  onRender: () => void,
): void {
  const resolve = waiters.shift();
  if (resolve === undefined) {
    throw new Error("no page");
  }
  resolve({
    getViewport() {
      return { width: 4, height: 4 };
    },
    render() {
      onRender();
      return {
        promise: Promise.resolve(),
        cancel() {
          return undefined;
        },
      };
    },
  });
}

function countingTask(onDestroy: () => void): PdfLoadingTask {
  return {
    promise: Promise.resolve({
      numPages: 1,
      getPage() {
        return Promise.reject(new Error("unused"));
      },
    }),
    destroy() {
      onDestroy();
      return Promise.resolve();
    },
  };
}

function release(
  waiters: Array<(page: PdfPage) => void>,
  slots: Slot[],
  cancels: { count: number },
): void {
  const resolve = waiters.shift();
  if (resolve === undefined) {
    throw new Error("no page");
  }
  resolve(pageDouble(slots, cancels));
}

function pageDouble(slots: Slot[], cancels: { count: number }): PdfPage {
  return {
    getViewport() {
      return { width: 8, height: 4 };
    },
    render() {
      return renderDouble(slots, cancels);
    },
  };
}

function renderDouble(
  slots: Slot[],
  cancels: { count: number },
): PdfRenderTask {
  let resolveTask = (): void => undefined;
  let rejectTask: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((resolve, reject) => {
    resolveTask = resolve;
    rejectTask = reject;
  });
  slots.push({
    resolve() {
      resolveTask();
    },
  });
  return {
    promise,
    cancel() {
      cancels.count += 1;
      const error = new Error("cancelled");
      error.name = "RenderingCancelledException";
      rejectTask(error);
    },
  };
}

function blankPage(onRender: () => void): PdfDocument {
  return {
    numPages: 1,
    getPage() {
      return Promise.resolve({
        getViewport() {
          return { width: 4, height: 4 };
        },
        render() {
          onRender();
          return {
            promise: Promise.resolve(),
            cancel() {
              return undefined;
            },
          };
        },
      });
    },
  };
}

function contextlessCanvas(): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    style: { width: "", height: "" },
    getContext() {
      return null;
    },
  } as unknown as HTMLCanvasElement;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

function fakeCanvas(): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    style: { width: "", height: "" },
    getContext() {
      return {};
    },
  } as unknown as HTMLCanvasElement;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
