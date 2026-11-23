// @vitest-environment happy-dom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import {
  ERROR_TITLE,
  MISSING_DOCUMENT,
  VIEW_EMPTY_COPY,
  VIEW_ORIGINAL_LINK_WIN,
} from "../../src/ui/copy.js";
import type { ReaderClient } from "../../src/ui/reader-client.js";
import { ReaderScreen } from "../../src/ui/reader-screen.js";
import type { ReaderNav } from "../../src/ui/use-bound-nav.js";

afterEach(() => {
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
  const column = pageColumn();
  const main = document.querySelector(".oi-reader-main");
  const zoom = screen.getByRole("combobox", { name: "缩放" }).textContent;
  const back = screen
    .getByRole("button", { name: "后退" })
    .getAttribute("aria-disabled");
  const forward = screen
    .getByRole("button", { name: "前进" })
    .getAttribute("aria-disabled");
  expect(seen.opens).toBe(1);
  expect(seen.writes).toBe(0);
  fireEvent.click(screen.getByRole("radio", { name: "对照" }));
  expect(checked()).toBe("对照");
  expect(pageColumn()).toBe(column);
  expect(document.querySelector(".oi-reader-main")).toBe(main);
  expect(document.querySelectorAll(".oi-reader-main")).toHaveLength(1);
  expect(screen.getByText("第 1 / 3 页")).toBeTruthy();
  expect(screen.getByText(VIEW_EMPTY_COPY)).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "缩放" }).textContent).toBe(zoom);
  expect(
    screen.getByRole("button", { name: "后退" }).getAttribute("aria-disabled"),
  ).toBe(back);
  expect(
    screen.getByRole("button", { name: "前进" }).getAttribute("aria-disabled"),
  ).toBe(forward);
  expect(seen.opens).toBe(1);
  expect(seen.writes).toBe(0);
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
  expect(seen.opens).toBe(1);
  expect(seen.writes).toBe(0);
  const link = screen.getByRole("link", { name: VIEW_ORIGINAL_LINK_WIN });
  link.focus();
  act(() => {
    nav?.viewOriginal();
  });
  expect(document.activeElement?.id).toBe("oi-reader-view-original");
  expect(checked()).toBe("原文");
  expect(screen.queryByText(VIEW_EMPTY_COPY)).toBeNull();
  expect(seen.opens).toBe(1);
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
  return chosen[0]?.parentElement?.textContent?.trim() ?? "";
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
