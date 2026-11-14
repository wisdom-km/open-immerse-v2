// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { BACK_LABEL, LOST_PLACE, UNREADABLE_PDF } from "../../src/ui/copy.js";
import type { ReaderClient } from "../../src/ui/reader-client.js";
import { ReaderScreen } from "../../src/ui/reader-screen.js";

afterEach(() => {
  cleanup();
});

it("does not write on scrollend or the back button after a failed page read", async () => {
  const calls: string[] = [];
  render(failedScreen(calls));
  expect(await screen.findByText(LOST_PLACE)).toBeTruthy();
  expect(screen.getByText("第 1 / 3 页")).toBeTruthy();
  layOut(2);
  column().dispatchEvent(new Event("scrollend", { bubbles: true }));
  await flush();
  expect(calls).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: BACK_LABEL }));
  await waitFor(() => {
    expect(calls).toEqual(["revoke", "close"]);
  });
});

it("does not write when menu back leaves after a failed page read", async () => {
  let back: (() => void) | undefined;
  await leaveWithoutWrite(
    () => {
      back?.();
    },
    (nav) => {
      back = nav?.back;
    },
  );
});

it("does not write when the menu leaves after a failed page read", async () => {
  let bound: (() => void) | undefined;
  const calls: string[] = [];
  render(
    <ReaderScreen
      id="paper"
      title="Paper"
      client={failedClient(calls)}
      onBindLeave={(next) => {
        bound = next;
      }}
      onLeave={() => undefined}
    />,
  );
  expect(await screen.findByText(LOST_PLACE)).toBeTruthy();
  layOut(1);
  const leave = bound;
  expect(typeof leave).toBe("function");
  leave?.();
  await waitFor(() => {
    expect(calls).toEqual(["revoke", "close"]);
  });
});

it("does not write when the screen unmounts after a failed page read", async () => {
  const calls: string[] = [];
  const view = render(failedScreen(calls));
  expect(await screen.findByText(LOST_PLACE)).toBeTruthy();
  layOut(1);
  view.unmount();
  await waitFor(() => {
    expect(calls).toEqual(["revoke", "close"]);
  });
});

it("does not write on leave when reading the stored page rejects", async () => {
  const calls: string[] = [];
  render(rejectedScreen(calls));
  expect(await screen.findByText(UNREADABLE_PDF)).toBeTruthy();
  await waitFor(() => {
    expect(calls).toEqual(["close", "revoke"]);
  });
  const [back] = screen.getAllByRole("button", { name: BACK_LABEL });
  if (back === undefined) {
    throw new Error("back");
  }
  fireEvent.click(back);
  await flush();
  expect(calls).toEqual(["close", "revoke"]);
});

async function leaveWithoutWrite(
  leave: () => void,
  onBindNav?: (nav: { readonly back: () => void } | undefined) => void,
): Promise<void> {
  const calls: string[] = [];
  const view = render(failedScreen(calls, onBindNav));
  expect(await screen.findByText(LOST_PLACE)).toBeTruthy();
  layOut(1);
  leave();
  await waitFor(() => {
    expect(calls).toEqual(["revoke", "close"]);
  });
  view.unmount();
}

function failedScreen(
  calls: string[],
  onBindNav?: (nav: { readonly back: () => void } | undefined) => void,
) {
  return (
    <ReaderScreen
      id="paper"
      title="Paper"
      client={failedClient(calls)}
      onBindNav={onBindNav}
      onLeave={() => undefined}
    />
  );
}

function rejectedScreen(calls: string[]) {
  return (
    <ReaderScreen
      id="paper"
      title="Paper"
      client={failedClient(calls, {
        readPage() {
          return Promise.reject(new Error("ipc"));
        },
      })}
      onLeave={() => undefined}
    />
  );
}

function failedClient(
  calls: string[],
  over: Partial<ReaderClient> = {},
): ReaderClient {
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
    readPage() {
      return Promise.resolve({ ok: false as const, code: "rejected" });
    },
    writePage() {
      calls.push("write");
      return Promise.resolve();
    },
    revoke() {
      calls.push("revoke");
      return Promise.resolve();
    },
    openPdf() {
      return Promise.resolve({
        pageCount: 3,
        paint() {
          return Promise.resolve();
        },
        cancel() {
          return undefined;
        },
        close() {
          calls.push("close");
          return Promise.resolve();
        },
      });
    },
    ...over,
  };
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

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
