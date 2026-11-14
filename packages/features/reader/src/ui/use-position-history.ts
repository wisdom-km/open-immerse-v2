import { useEffect, useRef, useState } from "react";

import {
  emptyPositionHistory,
  goBack,
  goForward,
  recordJump,
  replaceCurrent,
  type PositionHistory,
} from "../pure.js";

export function usePositionHistory(
  documentId: string,
  page: number | undefined,
) {
  const [history, setHistory] = useState<PositionHistory>(emptyPositionHistory);
  const historyRef = useRef(history);
  historyRef.current = history;
  const recorded = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (page === undefined) {
      recorded.current = undefined;
      publish(emptyPositionHistory(), historyRef, setHistory);
      return;
    }
    if (recorded.current === documentId) return;
    recorded.current = documentId;
    publish(
      recordJump(emptyPositionHistory(), { page }),
      historyRef,
      setHistory,
    );
  }, [documentId, page]);
  return {
    canBack: history.back.length > 0,
    canForward: history.forward.length > 0,
    back() {
      return move(goBack, historyRef, setHistory);
    },
    forward() {
      return move(goForward, historyRef, setHistory);
    },
    jump(visible: number | undefined, target: number) {
      const current = historyRef.current;
      const base =
        visible === undefined
          ? current
          : replaceCurrent(current, { page: visible });
      const next = recordJump(base, { page: target });
      if (next === current) return false;
      publish(next, historyRef, setHistory);
      return true;
    },
  };
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
