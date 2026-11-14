import { useEffect, useRef, useState } from "react";

import {
  emptyPositionHistory,
  goBack,
  goForward,
  recordJump,
  replaceCurrent,
  type PositionHistory,
} from "../pure.js";
import { pageLabel } from "./copy.js";
import { readVisible } from "./use-reader-session.js";

export function usePositionHistory(
  documentId: string,
  page: number | undefined,
  columnRef: { readonly current: HTMLDivElement | null },
  pageCount: number | undefined,
) {
  const [history, setHistory] = useState<PositionHistory>(emptyPositionHistory);
  const historyRef = useRef(history);
  historyRef.current = history;
  const recorded = useRef<string | undefined>(undefined);
  const frame = useRef(0);
  const [pending, setPending] = useState<number | undefined>(undefined);
  const [spoken, setSpoken] = useState("");
  const shown = pending ?? page;
  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current);
    };
  }, []);
  useEffect(() => {
    if (page === undefined) {
      recorded.current = undefined;
      setPending(undefined);
      queueSpeech(undefined, frame, setSpoken);
      publish(emptyPositionHistory(), historyRef, setHistory);
      return;
    }
    if (recorded.current === documentId) return;
    recorded.current = documentId;
    setPending(undefined);
    queueSpeech(undefined, frame, setSpoken);
    publish(
      recordJump(emptyPositionHistory(), { page }),
      historyRef,
      setHistory,
    );
  }, [documentId, page]);
  const reveal = (next: number): void => {
    setPending(next);
    if (pageCount !== undefined) {
      queueSpeech(pageLabel(next, pageCount), frame, setSpoken);
    }
    columnRef.current
      ?.querySelector(`[data-page="${String(next)}"]`)
      ?.scrollIntoView();
  };
  return {
    canBack: history.back.length > 0,
    canForward: history.forward.length > 0,
    shown,
    spoken,
    clearPending() {
      setPending(undefined);
    },
    back() {
      const next = move(goBack, historyRef, setHistory);
      if (next !== undefined) reveal(next);
    },
    forward() {
      const next = move(goForward, historyRef, setHistory);
      if (next !== undefined) reveal(next);
    },
    jump(target: number) {
      const place = readVisible(columnRef.current) ?? shown;
      const current = historyRef.current;
      const base =
        place === undefined
          ? current
          : replaceCurrent(current, { page: place });
      const next = recordJump(base, { page: target });
      if (next !== current) publish(next, historyRef, setHistory);
      reveal(target);
    },
  };
}

function queueSpeech(
  text: string | undefined,
  frame: { current: number },
  setSpoken: (value: string) => void,
): void {
  cancelAnimationFrame(frame.current);
  setSpoken("");
  if (text === undefined) return;
  frame.current = requestAnimationFrame(() => {
    setSpoken(text);
  });
}
function move(
  step: (history: PositionHistory) => PositionHistory,
  historyRef: { current: PositionHistory },
  setHistory: (history: PositionHistory) => void,
): number | undefined {
  const next = step(historyRef.current);
  if (next === historyRef.current) return undefined;
  publish(next, historyRef, setHistory);
  return next.current?.page;
}
function publish(
  next: PositionHistory,
  historyRef: { current: PositionHistory },
  setHistory: (history: PositionHistory) => void,
): void {
  historyRef.current = next;
  setHistory(next);
}
