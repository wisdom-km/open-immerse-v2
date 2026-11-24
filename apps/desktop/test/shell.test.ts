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

const diag = vi.hoisted(() => {
  const tickMs = 50;
  const state = {
    startedAt: 0,
    ticks: 0,
    maxGap: 0,
    timer: undefined as number | undefined,
  };
  function stage(name: string): void {
    const elapsed = String(Math.round(performance.now() - state.startedAt));
    const ticks = String(state.ticks);
    const maxGap = String(Math.round(state.maxGap));
    console.error(
      `oi-shell-stage ${name} ${elapsed} ticks ${ticks} maxGap ${maxGap}`,
    );
  }
  function stop(): void {
    if (state.timer !== undefined) {
      window.clearInterval(state.timer);
      state.timer = undefined;
    }
  }
  function start(): void {
    stop();
    state.ticks = 0;
    state.maxGap = 0;
    let last = performance.now();
    state.timer = window.setInterval(() => {
      const now = performance.now();
      const gap = now - last;
      last = now;
      state.ticks += 1;
      if (gap > state.maxGap) {
        state.maxGap = gap;
      }
    }, tickMs);
  }
  return { state, stage, start, stop };
});

vi.mock("@oi/feature-reader/ui", async (importOriginal) => {
  diag.stage("mock-enter");
  const actual = await importOriginal<typeof import("@oi/feature-reader/ui")>();
  diag.stage("mock-after-original");
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
  diag.stage("mock-return");
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
  fixtureBits("installed");
});

afterEach(() => {
  diag.stop();
  cleanup();
  seen.mounts = 0;
  seen.viewOriginal = 0;
  seen.viewContrast = 0;
  seen.viewTranslation = 0;
});

it("changes the open reader once per view event and ignores events after leave", async () => {
  diag.state.startedAt = performance.now();
  diag.start();
  try {
    diag.stage("before-import");
    fixtureBits("before-import");
    const { Shell } = await import("../src/renderer/shell.js");
    diag.stage("after-import");
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    try {
      diag.stage("before-render");
      fixtureBits("before-render");
      const view = render(createElement(Shell));
      diag.stage("after-render");
      dispatchAll();
      expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
      expect(callCount()).toEqual([0, 0, 0]);
      diag.stage("before-library");
      const row = await screen.findByText("Paper");
      diag.stage("after-library");
      fireEvent.click(row);
      fireEvent.dblClick(row);
      diag.stage("before-reader");
      await screen.findByRole("radio", { name: "原文" });
      diag.stage("after-reader");
      expect(seen.mounts).toBe(1);
      expect(marked("原文")).toBe(true);
      diag.stage("before-event-original");
      window.dispatchEvent(new Event(viewOriginalEvent));
      diag.stage("after-event-original");
      diag.stage("before-event-bilingual");
      window.dispatchEvent(new Event(viewBilingualEvent));
      diag.stage("after-event-bilingual");
      diag.stage("before-event-translation");
      window.dispatchEvent(new Event(viewTranslationEvent));
      diag.stage("after-event-translation");
      expect(callCount()).toEqual([1, 1, 1]);
      expect(marked("译文")).toBe(true);
      expect(marked("原文")).toBe(false);
      expect(marked("对照")).toBe(false);
      const back = document.querySelector(".oi-reader-bar .oi-reader-back");
      if (!(back instanceof HTMLElement)) {
        throw new Error("back");
      }
      diag.stage("before-leave");
      fireEvent.click(back);
      diag.stage("after-leave");
      expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
      expect(seen.mounts).toBe(0);
      window.dispatchEvent(new Event(viewOriginalEvent));
      window.dispatchEvent(new Event(viewBilingualEvent));
      window.dispatchEvent(new Event(viewTranslationEvent));
      expect(callCount()).toEqual([1, 1, 1]);
      expect(seen.mounts).toBe(0);
      expect(screen.queryByRole("radiogroup", { name: "栏位" })).toBeNull();
      diag.stage("before-unmount");
      view.unmount();
      diag.stage("after-unmount");
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
  } finally {
    diag.stop();
  }
});

function fixtureBits(place: string): void {
  const host = window as unknown as {
    oi?: { library?: object; ingest?: object };
  };
  const oi = host.oi;
  const library = oi?.library;
  const ingest = oi?.ingest;
  const fetchFn = globalThis.fetch;
  const libCount = library === undefined ? 0 : Object.keys(library).length;
  const ingestCount = ingest === undefined ? 0 : Object.keys(ingest).length;
  console.error(
    `oi-shell-fixture ${place} fetchFn=${String(typeof fetchFn === "function")} fetchMock=${String(vi.isMockFunction(fetchFn))} oi=${String(oi !== undefined)} lib=${String(libCount)} ingest=${String(ingestCount)}`,
  );
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
