// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

import {
  viewBilingualEvent,
  viewOriginalEvent,
  viewTranslationEvent,
} from "../src/renderer/shell-events.js";

beforeAll(() => {
  vi.stubGlobal("fetch", () => Promise.resolve({ ok: false }));
  Object.assign(window, {
    oi: {
      ingest: {
        openDocument: () =>
          Promise.resolve({ ok: true, value: { jobId: "job" } }),
      },
      library: {
        list: () =>
          Promise.resolve({
            ok: true,
            value: [
              {
                id: "paper",
                title: "Paper",
                addedAt: "2026-01-01",
                openedAt: null,
              },
            ],
          }),
        bindReadingAsset: () =>
          Promise.resolve({
            ok: true,
            value: { id: "paper", assetId: "asset", generation: 1 },
          }),
        getProgressPage: () =>
          Promise.resolve({
            ok: true,
            value: { id: "paper", generation: 1, progressPage: 1 },
          }),
        setProgressPage: () => Promise.resolve({ ok: true }),
        revokeReadingAsset: () => Promise.resolve({ ok: true }),
        import: () =>
          Promise.resolve({ ok: false, error: { code: "rejected" } }),
        importDropped: () =>
          Promise.resolve({ ok: false, error: { code: "rejected" } }),
      },
    },
  });
});

afterEach(() => {
  cleanup();
});

it("changes the open reader once per view event and ignores events after leave", async () => {
  const { Shell } = await import("../src/renderer/shell.js");
  render(createElement(Shell));
  dispatchAll();
  expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
  const row = await screen.findByText("Paper");
  fireEvent.click(row);
  fireEvent.dblClick(row);
  await screen.findByRole("radio", { name: "原文" });
  expect(marked("原文")).toBe(true);
  window.dispatchEvent(new Event(viewBilingualEvent));
  expect(marked("对照")).toBe(true);
  expect(marked("原文")).toBe(false);
  window.dispatchEvent(new Event(viewBilingualEvent));
  expect(marked("对照")).toBe(true);
  window.dispatchEvent(new Event(viewTranslationEvent));
  expect(marked("译文")).toBe(true);
  expect(marked("对照")).toBe(false);
  window.dispatchEvent(new Event(viewOriginalEvent));
  expect(marked("原文")).toBe(true);
  const back = document.querySelector(".oi-reader-bar .oi-reader-back");
  if (!(back instanceof HTMLElement)) {
    throw new Error("back");
  }
  fireEvent.click(back);
  expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
  expect(dispatchAll).not.toThrow();
});

function marked(name: string): boolean {
  const node = screen.getByRole("radio", { name });
  return node instanceof HTMLInputElement && node.checked;
}

function dispatchAll(): void {
  window.dispatchEvent(new Event(viewOriginalEvent));
  window.dispatchEvent(new Event(viewBilingualEvent));
  window.dispatchEvent(new Event(viewTranslationEvent));
}
