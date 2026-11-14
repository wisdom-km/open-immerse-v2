// @vitest-environment happy-dom
import { act, render } from "@testing-library/react";
import { createRef, type ReactElement } from "react";
import { expect, it, vi } from "vitest";

import { PageColumn } from "../../src/ui/page-column.js";
import type { PdfCancel, PdfPaint } from "../../src/ui/reader-client.js";

it("does not paint the same page again when the shown page changes", async () => {
  const painted: number[] = [];
  const paint: PdfPaint = (page) => {
    painted.push(page);
    return Promise.resolve();
  };
  const view = render(column(1, paint, () => undefined));
  await act(async () => {
    await Promise.resolve();
  });
  expect(painted).toEqual([1, 2, 3]);
  await act(async () => {
    view.rerender(column(2, paint, () => undefined));
    await Promise.resolve();
  });
  expect(painted).toEqual([1, 2, 3]);
});

it("paints again when the document changes and cancels the previous canvas", async () => {
  const painted: number[] = [];
  const cancelled: HTMLCanvasElement[] = [];
  const first: PdfPaint = (page) => {
    painted.push(page);
    return Promise.resolve();
  };
  const second: PdfPaint = (page) => {
    painted.push(page);
    return Promise.resolve();
  };
  const cancel: PdfCancel = (canvas) => {
    cancelled.push(canvas);
  };
  const view = render(column(1, first, cancel));
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    view.rerender(column(1, second, cancel));
    await Promise.resolve();
  });
  expect(painted).toEqual([1, 2, 3, 1, 2, 3]);
  expect(cancelled).toHaveLength(3);
});

it("reports a paint error that is not cancellation or a closed session", async () => {
  const reported: unknown[] = [];
  const spy = vi
    .spyOn(console, "error")
    .mockImplementation((error: unknown) => {
      reported.push(error);
    });
  const failure = new Error("draw");
  try {
    render(
      column(
        1,
        () => Promise.reject(failure),
        () => undefined,
        1,
      ),
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(reported).toEqual([failure]);
  } finally {
    spy.mockRestore();
  }
});

it("stays quiet for a cancelled paint", async () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const cancelled = new Error("cancelled");
  cancelled.name = "RenderingCancelledException";
  try {
    render(
      column(
        1,
        () => Promise.reject(cancelled),
        () => undefined,
        1,
      ),
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(spy).not.toHaveBeenCalled();
  } finally {
    spy.mockRestore();
  }
});

it("cancels an unfinished paint on unmount without an unhandled rejection", async () => {
  const cancelled: number[] = [];
  let rejectPaint: (error: unknown) => void = () => undefined;
  const paint: PdfPaint = () =>
    new Promise<void>((_resolve, reject) => {
      rejectPaint = reject;
    });
  const view = render(
    column(
      1,
      paint,
      () => {
        cancelled.push(1);
        const error = new Error("cancelled");
        error.name = "RenderingCancelledException";
        rejectPaint(error);
      },
      1,
    ),
  );
  await act(async () => {
    await Promise.resolve();
  });
  view.unmount();
  await act(async () => {
    await Promise.resolve();
  });
  expect(cancelled).toEqual([1]);
});

it("paints the shown page window, then releases canvases outside the scrolled window", async () => {
  const painted: number[] = [];
  const columnRef = createRef<HTMLDivElement>();
  const view = render(
    <PageColumn
      page={1}
      pageCount={8}
      columnRef={columnRef}
      onScroll={() => undefined}
      onScrollEnd={() => undefined}
      paint={(page) => {
        painted.push(page);
        return Promise.resolve();
      }}
      cancel={() => undefined}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  const before = [...view.container.querySelectorAll("canvas")];
  expect(before).toHaveLength(3);
  const node = columnRef.current;
  if (node === null) {
    throw new Error("column");
  }
  place(node, 6);
  act(() => {
    node.dispatchEvent(new Event("scroll"));
  });
  expect(before.map((canvas) => canvas.width)).toEqual([0, 0, 0]);
  expect(canvasPages(view.container)).toEqual([4, 5, 6, 7, 8]);
  expect(painted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

it("leaves the canvas pixels when the reader is closing", async () => {
  const releasePixels = { current: false };
  const view = render(
    <PageColumn
      page={1}
      pageCount={1}
      columnRef={createRef()}
      onScroll={() => undefined}
      onScrollEnd={() => undefined}
      paint={() => Promise.resolve()}
      cancel={() => undefined}
      releasePixels={releasePixels}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
  const canvas = view.container.querySelector("canvas");
  if (canvas === null) {
    throw new Error("canvas");
  }
  canvas.width = 12;
  canvas.height = 8;
  view.unmount();
  expect(canvas.width).toBe(12);
  expect(canvas.height).toBe(8);
});

function place(column: HTMLDivElement, winner: number): void {
  column.getBoundingClientRect = () => rect(0, 100);
  for (const article of column.querySelectorAll("article")) {
    const page = Number(article.getAttribute("data-page"));
    const inside = page === winner;
    article.getBoundingClientRect = () =>
      rect(inside ? 10 : 200, inside ? 90 : 220);
  }
}

function canvasPages(container: HTMLElement): number[] {
  return [...container.querySelectorAll("canvas")].map((canvas) =>
    Number(canvas.parentElement?.getAttribute("data-page")),
  );
}

function rect(top: number, bottom: number): DOMRect {
  return {
    top,
    bottom,
    left: 0,
    right: 100,
    width: 100,
    height: bottom - top,
    x: 0,
    y: top,
    toJSON() {
      return {};
    },
  };
}

function column(
  page: number,
  paint: PdfPaint,
  cancel: PdfCancel,
  pageCount = 3,
): ReactElement {
  return (
    <PageColumn
      page={page}
      pageCount={pageCount}
      columnRef={createRef<HTMLDivElement>()}
      onScroll={() => undefined}
      onScrollEnd={() => undefined}
      paint={paint}
      cancel={cancel}
    />
  );
}
