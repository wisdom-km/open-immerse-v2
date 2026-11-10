// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import {
  BACK_LABEL,
  LOST_PLACE,
  MISSING_DOCUMENT,
  UNREADABLE_PDF,
} from "../../src/ui/copy.js";
import type { ReaderClient } from "../../src/ui/reader-client.js";
import { ReaderScreen } from "../../src/ui/reader-screen.js";

afterEach(() => {
  cleanup();
});

it("shows the lost-place line once and hides it after scrolling", async () => {
  render(
    <ReaderScreen
      id="paper"
      title="Paper"
      client={fakeClient({
        readPage() {
          return Promise.resolve({ ok: false as const, code: "rejected" });
        },
      })}
      onLeave={() => undefined}
    />,
  );
  expect(await screen.findAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status").textContent).toBe(LOST_PLACE);
  fireEvent.scroll(column());
  expect(screen.queryByRole("status")).toBeNull();
});

it("does not show the lost-place line after a successful read", async () => {
  render(screenFor(fakeClient({})));
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  expect(screen.queryByText(LOST_PLACE)).toBeNull();
  expect(document.querySelector(".oi-reader-chip")?.textContent).toBe("");
  expect(document.body.textContent).not.toMatch(/解析|已保存|原文件没有被修改/);
});

it("shows the missing and unreadable sentences without a diagnostic button", async () => {
  const missing = render(screenFor(failOpen("not_found")));
  expect(await screen.findByText(MISSING_DOCUMENT)).toBeTruthy();
  expect(screen.getByRole("heading", { name: "无法打开此文件" })).toBeTruthy();
  missing.unmount();
  render(screenFor(failOpen("handler_threw")));
  expect(await screen.findByText(UNREADABLE_PDF)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "导出诊断包…" })).toBeNull();
  expect(screen.queryByRole("button", { name: "打开文件…" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Aa" })).toBeNull();
});

it("revokes on Alt+ArrowLeft and writes the visible page", async () => {
  const writes: number[] = [];
  const revokes: string[] = [];
  let left = 0;
  render(
    screenFor(
      fakeClient({
        writePage(_id, _generation, page) {
          writes.push(page);
          return Promise.resolve();
        },
        revoke(id) {
          revokes.push(id);
          return Promise.resolve();
        },
      }),
      () => {
        left += 1;
      },
    ),
  );
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  expect(writes).toEqual([]);
  layOut(1);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(revokes).toEqual([]);
  fireEvent.keyDown(window, { key: "ArrowLeft", altKey: true });
  await waitFor(() => {
    expect(revokes).toEqual(["paper"]);
  });
  expect(writes).toEqual([1]);
  expect(left).toBe(1);
});

it("writes a changed page only after scrollend", async () => {
  const writes: number[] = [];
  render(
    screenFor(
      fakeClient({
        readPage(id, generation) {
          return Promise.resolve({
            ok: true as const,
            id,
            generation,
            progressPage: 1,
          });
        },
        writePage(_id, _generation, page) {
          writes.push(page);
          return Promise.resolve();
        },
      }),
    ),
  );
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  expect(writes).toEqual([]);
  layOut(2);
  column().dispatchEvent(new Event("scrollend", { bubbles: true }));
  await waitFor(() => {
    expect(writes).toEqual([2]);
  });
  expect(screen.getByText("第 2 / 3 页")).toBeTruthy();
});

it("leaves through the bound menu callback", async () => {
  const revokes: string[] = [];
  let leave: (() => void) | undefined;
  render(
    <ReaderScreen
      id="paper"
      title="Paper"
      client={fakeClient({
        revoke(id) {
          revokes.push(id);
          return Promise.resolve();
        },
      })}
      onBindLeave={(next) => {
        leave = next;
      }}
      onLeave={() => undefined}
    />,
  );
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  await waitFor(() => {
    expect(typeof leave).toBe("function");
  });
  layOut(1);
  leave?.();
  await waitFor(() => {
    expect(revokes).toEqual(["paper"]);
  });
});

it("revokes when the menu calls the callback captured before the page is shown", async () => {
  const revokes: string[] = [];
  const writes: number[] = [];
  let first: (() => void) | undefined;
  render(
    <ReaderScreen
      id="paper"
      title="Paper"
      client={fakeClient({
        writePage(_id, _generation, page) {
          writes.push(page);
          return Promise.resolve();
        },
        revoke(id) {
          revokes.push(id);
          return Promise.resolve();
        },
      })}
      onBindLeave={(next) => {
        if (next !== undefined && first === undefined) {
          first = next;
        }
      }}
      onLeave={() => undefined}
    />,
  );
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  layOut(1);
  const captured = first;
  expect(typeof captured).toBe("function");
  captured?.();
  await waitFor(() => {
    expect(revokes).toEqual(["paper"]);
  });
  expect(writes).toEqual([1]);
});

it("revokes when the back button is clicked", async () => {
  const revokes: string[] = [];
  const writes: number[] = [];
  let left = 0;
  render(
    <ReaderScreen
      id="paper"
      title="Paper"
      client={fakeClient({
        writePage(_id, _generation, page) {
          writes.push(page);
          return Promise.resolve();
        },
        revoke(id) {
          revokes.push(id);
          return Promise.resolve();
        },
      })}
      onLeave={() => {
        left += 1;
      }}
    />,
  );
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  layOut(1);
  fireEvent.click(screen.getByRole("button", { name: BACK_LABEL }));
  await waitFor(() => {
    expect(revokes).toEqual(["paper"]);
  });
  expect(writes).toEqual([1]);
  expect(left).toBe(1);
});

it("writes, revokes, then closes the pdf when leaving", async () => {
  const order: string[] = [];
  render(
    screenFor(
      fakeClient({
        writePage() {
          order.push("write");
          return Promise.resolve();
        },
        revoke() {
          order.push("revoke");
          return Promise.resolve();
        },
        openPdf() {
          return Promise.resolve({
            pageCount: 3,
            paint,
            cancel,
            close() {
              order.push("close");
              return Promise.resolve();
            },
          });
        },
      }),
    ),
  );
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  layOut(1);
  fireEvent.click(screen.getByRole("button", { name: BACK_LABEL }));
  expect(order).toEqual(["write", "revoke", "close"]);
});

it("closes the pdf once per open across repeated visits", async () => {
  let opens = 0;
  const closes: number[] = [];
  const client = fakeClient({
    openPdf() {
      opens += 1;
      return Promise.resolve({
        pageCount: 3,
        paint,
        cancel,
        close() {
          closes.push(opens);
          return Promise.resolve();
        },
      });
    },
  });
  const view = render(screenFor(client, () => undefined, "paper-0", "Title 0"));
  for (let round = 0; round < 4; round += 1) {
    if (round > 0) {
      view.rerender(
        screenFor(
          client,
          () => undefined,
          `paper-${String(round)}`,
          `Title ${String(round)}`,
        ),
      );
    }
    expect(
      await screen.findByRole("heading", { name: `Title ${String(round)}` }),
    ).toBeTruthy();
    expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: BACK_LABEL }));
    await waitFor(() => {
      expect(closes).toHaveLength(round + 1);
    });
  }
  expect(opens).toBe(4);
  expect(closes).toEqual([1, 2, 3, 4]);
});

it("closes the pdf when the screen unmounts", async () => {
  let closes = 0;
  const view = render(
    screenFor(
      fakeClient({
        openPdf() {
          return Promise.resolve({
            pageCount: 3,
            paint,
            cancel,
            close() {
              closes += 1;
              return Promise.resolve();
            },
          });
        },
      }),
    ),
  );
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  view.unmount();
  expect(closes).toBe(1);
});

it("keeps the new title when an older open resolves later", async () => {
  let releaseFirst: ((value: number) => void) | undefined;
  const first = new Promise<number>((resolve) => {
    releaseFirst = resolve;
  });
  const client = fakeClient({
    readPage(id, generation) {
      if (id === "first") {
        return first.then((page) => ({
          ok: true as const,
          id,
          generation,
          progressPage: page,
        }));
      }
      return Promise.resolve({
        ok: true as const,
        id,
        generation,
        progressPage: 1,
      });
    },
  });
  const view = render(screenFor(client, () => undefined, "first", "First"));
  view.rerender(screenFor(client, () => undefined, "second", "Second"));
  releaseFirst?.(4);
  expect(await screen.findByText("Second")).toBeTruthy();
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  expect(screen.queryByText("第 4 / 3 页")).toBeNull();
});

function screenFor(
  client: ReaderClient,
  onLeave: () => void = () => undefined,
  id = "paper",
  title = "Paper",
) {
  return (
    <ReaderScreen id={id} title={title} client={client} onLeave={onLeave} />
  );
}

function failOpen(code: string): ReaderClient {
  return fakeClient({
    openDocument() {
      return Promise.resolve({ ok: false as const, code });
    },
  });
}

function column(): HTMLElement {
  const node = document.querySelector(".oi-reader-column");
  if (!(node instanceof HTMLElement)) {
    throw new Error("column");
  }
  return node;
}

function layOut(winner: number): void {
  const node = column();
  node.getBoundingClientRect = () => box(0, 100);
  for (const article of node.querySelectorAll("article")) {
    const page = Number(article.getAttribute("data-page"));
    article.getBoundingClientRect = () => box(0, page === winner ? 80 : 20);
  }
}

function box(top: number, bottom: number): DOMRect {
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

function paint(): Promise<void> {
  return Promise.resolve();
}

function cancel(): void {
  return undefined;
}

function close(): Promise<void> {
  return Promise.resolve();
}

function fakeClient(over: Partial<ReaderClient>): ReaderClient {
  return {
    openDocument() {
      return Promise.resolve({ ok: true as const });
    },
    bind(id) {
      return Promise.resolve({
        ok: true as const,
        id,
        assetId: "asset",
        generation: 1,
      });
    },
    readPage(id, generation) {
      return Promise.resolve({
        ok: true as const,
        id,
        generation,
        progressPage: 1,
      });
    },
    writePage() {
      return Promise.resolve();
    },
    revoke() {
      return Promise.resolve();
    },
    openPdf() {
      return Promise.resolve({ pageCount: 3, paint, cancel, close });
    },
    ...over,
  };
}
