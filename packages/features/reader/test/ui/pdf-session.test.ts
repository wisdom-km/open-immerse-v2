import { expect, it } from "vitest";

import {
  createPdfSession,
  openPdfSession,
  type PdfDocument,
  type PdfLoadingTask,
  type PdfPage,
  type PdfRenderTask,
} from "../../src/ui/pdf-session.js";

it("destroys the document and the loading task once per open", async () => {
  const rounds = 5;
  let documents = 0;
  let tasks = 0;
  for (let index = 0; index < rounds; index += 1) {
    const session = createPdfSession(
      countingDoc(() => {
        documents += 1;
      }),
      countingTask(() => {
        tasks += 1;
      }),
    );
    await session.close();
    await session.close();
  }
  expect(documents).toBe(rounds);
  expect(tasks).toBe(rounds);
});

it("cleans the document and then destroys the loading task when the document has no destroy", async () => {
  const calls: string[] = [];
  const session = createPdfSession(
    {
      numPages: 1,
      getPage() {
        return Promise.reject(new Error("unused"));
      },
      cleanup() {
        calls.push("cleanup");
        return Promise.resolve();
      },
    },
    countingTask(() => {
      calls.push("task");
    }),
  );
  await session.close();
  expect(calls).toEqual(["cleanup", "task"]);
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
  expect(params).toEqual({ data: bytes, isEvalSupported: false });
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

function countingDoc(onDestroy: () => void): PdfDocument {
  return {
    numPages: 1,
    getPage() {
      return Promise.reject(new Error("unused"));
    },
    destroy() {
      onDestroy();
      return Promise.resolve();
    },
  };
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

function fakeCanvas(): HTMLCanvasElement {
  return {
    width: 0,
    height: 0,
    getContext() {
      return {};
    },
  } as unknown as HTMLCanvasElement;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
