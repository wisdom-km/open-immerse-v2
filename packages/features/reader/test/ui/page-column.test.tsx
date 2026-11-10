// @vitest-environment happy-dom
import { act, render } from "@testing-library/react";
import { createRef, type ReactElement } from "react";
import { expect, it, vi } from "vitest";

import { PageColumn } from "../../src/ui/page-column.js";
import { PDF_SESSION_CLOSED } from "../../src/ui/pdf-session.js";
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

it("stays quiet for cancellation and a closed session", async () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const closed = new Error("closed");
  closed.name = PDF_SESSION_CLOSED;
  const cancelled = new Error("cancelled");
  cancelled.name = "RenderingCancelledException";
  try {
    const view = render(
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
    view.rerender(
      column(
        1,
        () => Promise.reject(closed),
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
