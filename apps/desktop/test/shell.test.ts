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
  const startedAt = performance.now();
  shellStage("before-import", startedAt);
  const { Shell } = await import("../src/renderer/shell.js");
  shellStage("after-import", startedAt);
  const add = vi.spyOn(window, "addEventListener");
  const remove = vi.spyOn(window, "removeEventListener");
  try {
    shellStage("before-render", startedAt);
    const view = render(createElement(Shell));
    shellStage("after-render", startedAt);
    dispatchAll();
    expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
    expect(callCount()).toEqual([0, 0, 0]);
    shellStage("before-library", startedAt);
    const row = await screen.findByText("Paper");
    shellStage("after-library", startedAt);
    fireEvent.click(row);
    fireEvent.dblClick(row);
    shellStage("before-reader", startedAt);
    await screen.findByRole("radio", { name: "原文" });
    shellStage("after-reader", startedAt);
    expect(seen.mounts).toBe(1);
    expect(marked("原文")).toBe(true);
    shellStage("before-event-original", startedAt);
    window.dispatchEvent(new Event(viewOriginalEvent));
    shellStage("after-event-original", startedAt);
    shellStage("before-event-bilingual", startedAt);
    window.dispatchEvent(new Event(viewBilingualEvent));
    shellStage("after-event-bilingual", startedAt);
    shellStage("before-event-translation", startedAt);
    window.dispatchEvent(new Event(viewTranslationEvent));
    shellStage("after-event-translation", startedAt);
    expect(callCount()).toEqual([1, 1, 1]);
    expect(marked("译文")).toBe(true);
    expect(marked("原文")).toBe(false);
    expect(marked("对照")).toBe(false);
    const back = document.querySelector(".oi-reader-bar .oi-reader-back");
    if (!(back instanceof HTMLElement)) {
      throw new Error("back");
    }
    shellStage("before-leave", startedAt);
    fireEvent.click(back);
    shellStage("after-leave", startedAt);
    expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
    expect(seen.mounts).toBe(0);
    window.dispatchEvent(new Event(viewOriginalEvent));
    window.dispatchEvent(new Event(viewBilingualEvent));
    window.dispatchEvent(new Event(viewTranslationEvent));
    expect(callCount()).toEqual([1, 1, 1]);
    expect(seen.mounts).toBe(0);
    expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
    shellStage("before-unmount", startedAt);
    view.unmount();
    shellStage("after-unmount", startedAt);
    for (const name of viewEvents) {
      const added = add.mock.calls.filter((call) => call[0] === name).length;
      const removed = remove.mock.calls.filter(
        (call) => call[0] === name,
      ).length;
      expect(added).toBeGreaterThan(0);
      expect(removed).toBe(added);
    }
  } finally {
    add.mockRestore();
    remove.mockRestore();
  }
});

function shellStage(stage: string, startedAt: number): void {
  const elapsed = String(Math.round(performance.now() - startedAt));
  console.error(`oi-shell-stage ${stage} ${elapsed}`);
}

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
