import { useEffect, useState } from "react";

import {
  DEFAULT_ZOOM_PERCENT,
  nextZoomPercent,
  previousZoomPercent,
} from "../pure.js";
import { zoomSpoken } from "./copy.js";

export type ZoomCommands = {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly zoomActual: () => void;
  readonly zoomFitWidth: () => void;
};

type ZoomSession = {
  readonly columnRef: { readonly current: HTMLDivElement | null };
};

export type ZoomState = {
  readonly percent: number;
  readonly ratio: number;
  readonly spoken: string;
  readonly commands: ZoomCommands;
};

export function useZoom(
  active: boolean,
  id: string,
  session: ZoomSession,
): ZoomState {
  const [percent, setPercent] = useState(DEFAULT_ZOOM_PERCENT);
  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    setPercent(DEFAULT_ZOOM_PERCENT);
    setSpoken("");
  }, [id]);
  const apply = (next: number | undefined): void => {
    if (!active || next === undefined || next === percent) return;
    rememberZoomAnchor(session.columnRef.current);
    setPercent(next);
    setSpoken(zoomSpoken(next));
  };
  return {
    percent,
    ratio: percent / 100,
    spoken,
    commands: {
      zoomIn() {
        apply(nextZoomPercent(percent));
      },
      zoomOut() {
        apply(previousZoomPercent(percent));
      },
      zoomActual() {
        apply(DEFAULT_ZOOM_PERCENT);
      },
      zoomFitWidth() {
        apply(undefined);
      },
    },
  };
}

type Hold = { page: number; ratio: number; overlap: number };
const holds = new WeakMap<HTMLElement, Hold>();

export function rememberZoomAnchor(column: HTMLElement | null): void {
  const hold = column === null ? undefined : measureHold(column);
  if (column !== null && hold !== undefined) holds.set(column, hold);
}

function measureHold(column: HTMLElement): Hold | undefined {
  const view = column.getBoundingClientRect();
  let best: Hold | undefined;
  for (const node of column.querySelectorAll<HTMLElement>("[data-page]")) {
    const box = node.getBoundingClientRect();
    const overlap =
      Math.min(box.bottom, view.bottom) - Math.max(box.top, view.top);
    if (overlap <= 0 || (best !== undefined && overlap <= best.overlap)) {
      continue;
    }
    const start = column.scrollTop + box.top - view.top;
    best = {
      page: Number(node.dataset.page),
      ratio: box.height === 0 ? 0 : (column.scrollTop - start) / box.height,
      overlap,
    };
  }
  return best;
}

export function placeZoomAnchor(column: HTMLElement | null): void {
  const hold = column === null ? undefined : holds.get(column);
  const node =
    column === null || hold === undefined
      ? null
      : column.querySelector<HTMLElement>(`[data-page="${String(hold.page)}"]`);
  if (column === null || hold === undefined || node === null) return;
  const view = column.getBoundingClientRect();
  const box = node.getBoundingClientRect();
  column.scrollTop += box.top - view.top + hold.ratio * box.height;
}
