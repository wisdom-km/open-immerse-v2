import { useCallback, useEffect, useRef, useState } from "react";

import type { Pair, ReaderClient } from "./reader-client.js";
import { openReading, type ReadingView } from "./open-reading.js";
import { overlapHeight, visiblePage } from "./visible-page.js";

export type ReaderPhase =
  | { readonly kind: "loading" }
  | { readonly kind: "view"; readonly reading: ReadingView };

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
  const [phase, setPhase] = useState<ReaderPhase>({ kind: "loading" });
  const pairRef = useRef<Pair | undefined>(undefined);
  pairRef.current = phase.kind === "view" ? phase.reading.pair : undefined;
  const [lostPlace, setLostPlace] = useState(false);
  const [shownPage, setShownPage] = useState<number | undefined>(undefined);
  useEffect(() => {
    return watchReading(
      id,
      clientRef,
      setPhase,
      setLostPlace,
      setShownPage,
      shownRef,
    );
  }, [id]);
  const leave = useCallback(() => {
    finishReading(
      clientRef.current,
      pairRef.current,
      readVisible(columnRef.current),
      onLeaveRef.current,
    );
  }, []);
  return {
    phase,
    lostPlace,
    shownPage,
    columnRef,
    leave,
    onScroll() {
      setLostPlace(false);
    },
    onScrollEnd() {
      const page = readVisible(columnRef.current);
      if (page === undefined || page === shownRef.current) {
        return;
      }
      shownRef.current = page;
      setShownPage(page);
      const pair = pairRef.current;
      if (pair !== undefined) {
        void clientRef.current.writePage(pair.id, pair.generation, page);
      }
    },
  };
}

function watchReading(
  id: string,
  clientRef: { current: ReaderClient },
  setPhase: (phase: ReaderPhase) => void,
  setLostPlace: (lost: boolean) => void,
  setShownPage: (page: number | undefined) => void,
  shownRef: { current: number | undefined },
): () => void {
  let alive = true;
  setPhase({ kind: "loading" });
  setLostPlace(false);
  setShownPage(undefined);
  shownRef.current = undefined;
  void openReading(clientRef.current, id).then((reading) => {
    if (!alive) {
      revokeQuiet(clientRef.current, reading.pair);
      return;
    }
    shownRef.current = reading.page;
    setShownPage(reading.page);
    setLostPlace(reading.lostPlace);
    setPhase({ kind: "view", reading });
  });
  return () => {
    alive = false;
  };
}

function finishReading(
  client: ReaderClient,
  pair: Pair | undefined,
  page: number | undefined,
  onLeave: () => void,
): void {
  // 写页先于 revoke，依赖 main 的 setProgressPage 同步处理。
  if (pair !== undefined && page !== undefined) {
    void client.writePage(pair.id, pair.generation, page);
  }
  revokeQuiet(client, pair);
  onLeave();
}

function revokeQuiet(
  client: ReaderClient,
  pair: { readonly id: string; readonly generation: number } | undefined,
): void {
  if (pair !== undefined) {
    void client.revoke(pair.id, pair.generation);
  }
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
