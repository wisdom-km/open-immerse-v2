// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, useEffect, type ComponentProps } from "react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

import {
  viewBilingualEvent,
  viewOriginalEvent,
  viewTranslationEvent,
} from "../src/renderer/shell-events.js";

const seen = vi.hoisted(() => ({
  mounts: 0,
  viewOriginal: 0,
  viewContrast: 0,
  viewTranslation: 0,
}));

vi.mock("@oi/feature-reader/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@oi/feature-reader/ui")>();
  function CountingReader(
    props: ComponentProps<typeof actual.ReaderScreen>,
  ): ReturnType<typeof actual.ReaderScreen> {
    useEffect(() => {
      seen.mounts += 1;
      return () => {
        seen.mounts -= 1;
      };
    }, []);
    return createElement(actual.ReaderScreen, {
      ...props,
      onBindNav(nav) {
        if (nav === undefined) {
          props.onBindNav?.(undefined);
          return;
        }
        props.onBindNav?.({
          ...nav,
          viewOriginal() {
            seen.viewOriginal += 1;
            nav.viewOriginal();
          },
          viewContrast() {
            seen.viewContrast += 1;
            nav.viewContrast();
          },
          viewTranslation() {
            seen.viewTranslation += 1;
            nav.viewTranslation();
          },
        });
      },
    });
  }
  return { ...actual, ReaderScreen: CountingReader };
});

const viewEvents = [
  viewOriginalEvent,
  viewBilingualEvent,
  viewTranslationEvent,
] as const;

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
  seen.mounts = 0;
  seen.viewOriginal = 0;
  seen.viewContrast = 0;
  seen.viewTranslation = 0;
});

it("changes the open reader once per view event and ignores events after leave", async () => {
  const watch = watchViewListeners();
  try {
    const { Shell } = await import("../src/renderer/shell.js");
    const view = render(createElement(Shell));
    dispatchAll();
    expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
    expect(callCount()).toEqual([0, 0, 0]);
    const row = await screen.findByText("Paper");
    fireEvent.click(row);
    fireEvent.dblClick(row);
    await screen.findByRole("radio", { name: "原文" });
    expect(seen.mounts).toBe(1);
    expect(marked("原文")).toBe(true);
    window.dispatchEvent(new Event(viewOriginalEvent));
    window.dispatchEvent(new Event(viewBilingualEvent));
    window.dispatchEvent(new Event(viewTranslationEvent));
    expect(callCount()).toEqual([1, 1, 1]);
    expect(marked("译文")).toBe(true);
    expect(marked("原文")).toBe(false);
    expect(marked("对照")).toBe(false);
    const back = document.querySelector(".oi-reader-bar .oi-reader-back");
    if (!(back instanceof HTMLElement)) {
      throw new Error("back");
    }
    fireEvent.click(back);
    expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
    expect(seen.mounts).toBe(0);
    window.dispatchEvent(new Event(viewOriginalEvent));
    window.dispatchEvent(new Event(viewBilingualEvent));
    window.dispatchEvent(new Event(viewTranslationEvent));
    expect(callCount()).toEqual([1, 1, 1]);
    expect(seen.mounts).toBe(0);
    expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
    view.unmount();
    for (const name of viewEvents) {
      expect(watch.added.get(name)).toBeGreaterThan(0);
      expect(watch.removed.get(name)).toBe(watch.added.get(name));
    }
  } finally {
    watch.restore();
  }
});

function callCount(): readonly [number, number, number] {
  return [seen.viewOriginal, seen.viewContrast, seen.viewTranslation];
}

function marked(name: string): boolean {
  const node = screen.getByRole("radio", { name });
  return node instanceof HTMLInputElement && node.checked;
}

function dispatchAll(): void {
  for (const name of viewEvents) window.dispatchEvent(new Event(name));
}

function watchViewListeners(): {
  readonly added: ReadonlyMap<string, number>;
  readonly removed: ReadonlyMap<string, number>;
  restore(): void;
} {
  const names = new Set<string>(viewEvents);
  const added = new Map<string, number>();
  const removed = new Map<string, number>();
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  const addPatched = (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void => {
    if (names.has(type)) {
      added.set(type, (added.get(type) ?? 0) + 1);
    }
    if (listener !== null) {
      add(type, listener, options);
    }
  };
  const removePatched = (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void => {
    if (names.has(type)) {
      removed.set(type, (removed.get(type) ?? 0) + 1);
    }
    if (listener !== null) {
      remove(type, listener, options);
    }
  };
  window.addEventListener = addPatched as typeof window.addEventListener;
  window.removeEventListener =
    removePatched as typeof window.removeEventListener;
  return {
    added,
    removed,
    restore() {
      window.addEventListener = add;
      window.removeEventListener = remove;
    },
  };
}
