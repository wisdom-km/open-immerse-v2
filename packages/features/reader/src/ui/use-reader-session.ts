import { useCallback, useEffect, useRef, useState } from "react";

import type { Pair, ReaderClient } from "./reader-client.js";
import {
  openReading,
  unreadableReading,
  type ReadingView,
} from "./open-reading.js";
import { overlapHeight, visiblePage } from "./visible-page.js";

export type ReaderPhase =
  | { readonly kind: "loading" }
  | { readonly kind: "view"; readonly reading: ReadingView };

type ReleaseState = {
  clientRef: { current: ReaderClient };
  pairRef: { current: Pair | undefined };
  columnRef: { current: HTMLDivElement | null };
  releaseRef: { current: () => Promise<void> };
  finishedRef: { current: boolean };
  shownRef: { current: number | undefined };
  visibleRef: { current: number | undefined };
};

export function useReaderSession(
  client: ReaderClient,
  id: string,
  onLeave: () => void,
): {
  readonly phase: ReaderPhase;
  readonly lostPlace: boolean;
  readonly shownPage: number | undefined;
  readonly columnRef: { readonly current: HTMLDivElement | null };
  readonly leave: () => void;
  readonly onScroll: () => void;
  readonly onScrollEnd: () => void;
} {
  const clientRef = useRef(client);
  clientRef.current = client;
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;
  const columnRef = useRef<HTMLDivElement | null>(null);
  const shownRef = useRef<number | undefined>(undefined);
  const visibleRef = useRef<number | undefined>(undefined);
  const pairRef = useRef<Pair | undefined>(undefined);
  const releaseRef = useRef<() => Promise<void>>(noopClose);
  const finishedRef = useRef(false);
  const [phase, setPhase] = useState<ReaderPhase>({ kind: "loading" });
  pairRef.current = phase.kind === "view" ? phase.reading.pair : undefined;
  const [lostPlace, setLostPlace] = useState(false);
  const [shownPage, setShownPage] = useState<number | undefined>(undefined);
  const holder = useRef<ReleaseState | undefined>(undefined);
  holder.current = {
    clientRef,
    pairRef,
    columnRef,
    releaseRef,
    finishedRef,
    shownRef,
    visibleRef,
  };
  useEffect(() => {
    return startWatch(id, holder, { setPhase, setLostPlace, setShownPage });
  }, [id]);
  const leave = useCallback(() => {
    const state = holder.current;
    if (state !== undefined) {
      settleLeave(state, onLeaveRef.current);
    }
  }, []);
  const scrolling = scrollControls(holder, setLostPlace, setShownPage);
  return {
    phase,
    lostPlace,
    shownPage,
    columnRef,
    leave,
    onScroll: scrolling.onScroll,
    onScrollEnd: scrolling.onScrollEnd,
  };
}

function scrollControls(
  holder: { readonly current: ReleaseState | undefined },
  setLostPlace: (lost: boolean) => void,
  setShownPage: (page: number | undefined) => void,
): { readonly onScroll: () => void; readonly onScrollEnd: () => void } {
  return {
    onScroll() {
      const state = holder.current;
      if (state === undefined) {
        return;
      }
      setLostPlace(false);
      const page = readVisible(state.columnRef.current);
      if (page !== undefined) {
        state.visibleRef.current = page;
      }
    },
    onScrollEnd() {
      const state = holder.current;
      if (state === undefined) {
        return;
      }
      const page = readVisible(state.columnRef.current);
      if (page === undefined || page === state.shownRef.current) {
        return;
      }
      state.shownRef.current = page;
      state.visibleRef.current = page;
      setShownPage(page);
      const pair = state.pairRef.current;
      if (pair !== undefined) {
        void state.clientRef.current.writePage(pair.id, pair.generation, page);
      }
    },
  };
}

function startWatch(
  id: string,
  holder: { readonly current: ReleaseState | undefined },
  setters: Pick<WatchInput, "setPhase" | "setLostPlace" | "setShownPage">,
): () => void {
  const state = holder.current;
  if (state === undefined) {
    return () => undefined;
  }
  state.finishedRef.current = false;
  state.releaseRef.current = noopClose;
  return watchReading({ id, ...state, ...setters });
}

type WatchInput = ReleaseState & {
  readonly id: string;
  readonly setPhase: (phase: ReaderPhase) => void;
  readonly setLostPlace: (lost: boolean) => void;
  readonly setShownPage: (page: number | undefined) => void;
};

function watchReading(input: WatchInput): () => void {
  let alive = true;
  input.setPhase({ kind: "loading" });
  input.setLostPlace(false);
  input.setShownPage(undefined);
  input.shownRef.current = undefined;
  input.visibleRef.current = undefined;
  void openReading(input.clientRef.current, input.id).then(
    (reading) => {
      if (!alive || input.finishedRef.current) {
        abandon(input.clientRef.current, reading);
        return;
      }
      input.releaseRef.current = reading.close;
      input.shownRef.current = reading.page;
      input.visibleRef.current = reading.page;
      input.setShownPage(reading.page);
      input.setLostPlace(reading.lostPlace);
      input.setPhase({ kind: "view", reading });
    },
    () => {
      if (!alive || input.finishedRef.current) {
        return;
      }
      input.setShownPage(undefined);
      input.setLostPlace(false);
      input.setPhase({ kind: "view", reading: unreadableReading() });
    },
  );
  return () => {
    alive = false;
    settleLeave(input, undefined);
  };
}

function settleLeave(
  release: ReleaseState,
  onLeave: (() => void) | undefined,
): void {
  if (release.finishedRef.current) {
    return;
  }
  release.finishedRef.current = true;
  const page =
    readVisible(release.columnRef.current) ??
    release.visibleRef.current ??
    release.shownRef.current;
  finishReading(
    release.clientRef.current,
    release.pairRef.current,
    page,
    onLeave,
    release.releaseRef.current,
  );
}

function abandon(client: ReaderClient, reading: ReadingView): void {
  revokeQuiet(client, reading.pair);
  void reading.close();
}

function finishReading(
  client: ReaderClient,
  pair: Pair | undefined,
  page: number | undefined,
  onLeave: (() => void) | undefined,
  close: () => Promise<void>,
): void {
  // 写页先于 revoke，依赖 main 的 setProgressPage 同步处理。销毁在这两者之后。
  if (pair !== undefined && page !== undefined) {
    void client.writePage(pair.id, pair.generation, page);
  }
  revokeQuiet(client, pair);
  void close();
  onLeave?.();
}

function revokeQuiet(
  client: ReaderClient,
  pair: { readonly id: string; readonly generation: number } | undefined,
): void {
  if (pair !== undefined) {
    void client.revoke(pair.id, pair.generation);
  }
}

function noopClose(): Promise<void> {
  return Promise.resolve();
}

export function readVisible(column: HTMLDivElement | null): number | undefined {
  if (column === null) {
    return undefined;
  }
  const view = column.getBoundingClientRect();
  const pages = [
    ...column.querySelectorAll<HTMLElement>("[data-page]"),
  ].flatMap((element) => {
    const page = Number(element.dataset.page);
    if (!Number.isInteger(page)) {
      return [];
    }
    const box = element.getBoundingClientRect();
    return [
      {
        page,
        overlap: overlapHeight(box.top, box.bottom, view.top, view.bottom),
      },
    ];
  });
  return visiblePage(pages);
}
