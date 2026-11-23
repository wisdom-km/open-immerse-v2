// @vitest-environment happy-dom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import {
  ERROR_TITLE,
  MISSING_DOCUMENT,
  VIEW_EMPTY_COPY,
} from "../../src/ui/copy.js";
import type { ReaderClient } from "../../src/ui/reader-client.js";
import { ReaderScreen } from "../../src/ui/reader-screen.js";
import type { ReaderNav } from "../../src/ui/use-bound-nav.js";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

it("keeps one page column, page, history, and zoom across modes", async () => {
  const seen = { opens: 0, writes: 0 };
  let nav: ReaderNav | undefined;
  const view = render(
    <ReaderScreen
      id="paper"
      title="Paper"
      client={client(seen)}
      onLeave={() => undefined}
      onBindNav={(next) => {
        nav = next;
      }}
    />,
  );
  expect(checked()).toBe("原文");
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  const openedZoom = selectedZoomLabel();
  fireEvent.click(screen.getByRole("button", { name: "放大" }));
  const zoomed = selectedZoomLabel();
  expect(zoomed).not.toBe(openedZoom);
  expect(zoomed).toBe("110%");
  expect(zoomSelect().textContent).not.toBe(zoomed);
  vi.useFakeTimers();
  layOut(2);
  jump("3");
  expect(pageText()).toBe("第 3 / 3 页");
  expect(movable("后退")).toBe(true);
  expect(movable("前进")).toBe(false);
  const column = pageColumn();
  const main = document.querySelector(".oi-reader-main");
  const writes = seen.writes;
  expect(seen.opens).toBe(1);
  for (const name of ["对照", "译文", "原文"] as const) {
    fireEvent.click(screen.getByRole("radio", { name }));
    expect(checked()).toBe(name);
    expect(pageColumn()).toBe(column);
    expect(document.querySelector(".oi-reader-main")).toBe(main);
    expect(document.querySelectorAll(".oi-reader-main")).toHaveLength(1);
    expect(pageText()).toBe("第 3 / 3 页");
    expect(selectedZoomLabel()).toBe(zoomed);
    expect(movable("后退")).toBe(true);
    expect(movable("前进")).toBe(false);
    expect(seen.opens).toBe(1);
    expect(seen.writes).toBe(writes);
  }
  expect(screen.queryByText(VIEW_EMPTY_COPY)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "后退" }));
  paintFrame();
  expect(pageText()).toBe("第 2 / 3 页");
  expect(movable("前进")).toBe(true);
  expect(pageColumn()).toBe(column);
  expect(selectedZoomLabel()).toBe(zoomed);
  expect(seen.writes).toBe(writes);
  fireEvent.click(screen.getByRole("button", { name: "前进" }));
  paintFrame();
  expect(pageText()).toBe("第 3 / 3 页");
  expect(pageColumn()).toBe(column);
  expect(seen.opens).toBe(1);
  expect(seen.writes).toBe(writes);
  const probe = document.createElement("button");
  probe.textContent = "页内";
  column.appendChild(probe);
  probe.focus();
  act(() => {
    nav?.viewTranslation();
  });
  expect(checked()).toBe("译文");
  expect(pageColumn()).toBe(column);
  expect(column.isConnected).toBe(true);
  expect(column.closest("[inert]")).toBeTruthy();
  expect(column.contains(document.activeElement)).toBe(false);
  expect(document.activeElement?.id).toBe("oi-reader-view-translation");
  expect(pageText()).toBe("第 3 / 3 页");
  expect(selectedZoomLabel()).toBe(zoomed);
  expect(seen.opens).toBe(1);
  expect(seen.writes).toBe(writes);
  const link = screen.getByRole("link", { name: "切到原文（Ctrl+1）" });
  link.focus();
  act(() => {
    nav?.viewOriginal();
  });
  expect(document.activeElement?.id).toBe("oi-reader-view-original");
  expect(checked()).toBe("原文");
  expect(screen.queryByText(VIEW_EMPTY_COPY)).toBeNull();
  expect(pageText()).toBe("第 3 / 3 页");
  expect(seen.opens).toBe(1);
  expect(seen.writes).toBe(writes);
  vi.useRealTimers();
  const stored = localStorage.length;
  fireEvent.click(screen.getByRole("radio", { name: "译文" }));
  view.rerender(
    <ReaderScreen
      id="other"
      title="Other"
      client={client(seen)}
      onLeave={() => undefined}
      onBindNav={(next) => {
        nav = next;
      }}
    />,
  );
  expect(checked()).toBe("原文");
  expect(localStorage.length).toBe(stored);
  expect(await screen.findByText("第 1 / 3 页")).toBeTruthy();
  expect(seen.opens).toBe(2);
});

it("does not replace loading or an error with the empty state", async () => {
  let release: ((value: { ok: true }) => void) | undefined;
  const pending = new Promise<{ ok: true }>((resolve) => {
    release = resolve;
  });
  const view = render(
    <ReaderScreen
      id="paper"
      title="Paper"
      client={client({ opens: 0, writes: 0 }, { openDocument: () => pending })}
      onLeave={() => undefined}
    />,
  );
  expect(await screen.findByRole("radio", { name: "原文" })).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "译文" }));
  expect(screen.queryByText(VIEW_EMPTY_COPY)).toBeNull();
  expect(document.querySelector(".oi-reader-column")).toBeNull();
  release?.({ ok: true });
  expect(await screen.findByText(VIEW_EMPTY_COPY)).toBeTruthy();
  view.rerender(
    <ReaderScreen
      id="missing"
      title="Missing"
      client={client(
        { opens: 0, writes: 0 },
        {
          openDocument: () => Promise.resolve({ ok: false, code: "not_found" }),
        },
      )}
      onLeave={() => undefined}
    />,
  );
  expect(await screen.findByText(ERROR_TITLE)).toBeTruthy();
  expect(screen.getByText(MISSING_DOCUMENT)).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "对照" }));
  expect(screen.getByText(ERROR_TITLE)).toBeTruthy();
  expect(screen.queryByText(VIEW_EMPTY_COPY)).toBeNull();
});

function checked(): string {
  const chosen = [
    screen.getByRole("radio", { name: "原文" }),
    screen.getByRole("radio", { name: "对照" }),
    screen.getByRole("radio", { name: "译文" }),
  ].filter((node) => node instanceof HTMLInputElement && node.checked);
  expect(chosen).toHaveLength(1);
  return (chosen[0]?.parentElement?.textContent ?? "").trim();
}

function selectedZoomLabel(): string {
  const selected = zoomSelect().selectedOptions[0];
  if (selected === undefined) {
    throw new Error("zoom option");
  }
  return selected.text;
}

function zoomSelect(): HTMLSelectElement {
  const node = screen.getByRole("combobox", { name: "缩放" });
  if (!(node instanceof HTMLSelectElement)) {
    throw new Error("zoom");
  }
  return node;
}

function pageText(): string | null {
  return screen.getByRole("button", { name: /转到页码/ }).textContent;
}

function movable(name: "后退" | "前进"): boolean {
  return (
    screen.getByRole("button", { name }).getAttribute("aria-disabled") !==
    "true"
  );
}

function jump(value: string): void {
  fireEvent.click(screen.getByRole("button", { name: /转到页码/ }));
  const field = screen.getByRole("textbox");
  fireEvent.change(field, { target: { value } });
  fireEvent.keyDown(field, { key: "Enter" });
  paintFrame();
}

function paintFrame(): void {
  act(() => {
    vi.advanceTimersToNextFrame();
  });
}

function layOut(winner: number): void {
  const node = pageColumn();
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

function pageColumn(): HTMLElement {
  const node = document.querySelector(".oi-reader-column");
  if (!(node instanceof HTMLElement)) {
    throw new Error("column");
  }
  return node;
}

function client(
  seen: { opens: number; writes: number },
  over: Partial<ReaderClient> = {},
): ReaderClient {
  return {
    openDocument() {
      seen.opens += 1;
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
      seen.writes += 1;
      return Promise.resolve();
    },
    revoke() {
      return Promise.resolve();
    },
    openPdf() {
      return Promise.resolve({
        pageCount: 3,
        paint: () => Promise.resolve(),
        cancel: () => undefined,
        close: () => Promise.resolve(),
      });
    },
    ...over,
  };
}
