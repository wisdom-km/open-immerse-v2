import { useEffect, useState } from "react";

import {
  DEFAULT_ZOOM_PERCENT,
  nextZoomPercent,
  previousZoomPercent,
  resolveZoomPercent,
  ZOOM_PERCENT_MAX,
  ZOOM_PERCENT_MIN,
} from "../pure.js";
import { zoomSpoken } from "./copy.js";
import { readVisible } from "./use-reader-session.js";

export type ZoomCommands = {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly zoomActual: () => void;
  readonly zoomFitWidth: () => void;
  readonly zoomFitPage: () => void;
};

type PageSize = { readonly width: number; readonly height: number };

export type ZoomSession = {
  readonly columnRef: { readonly current: HTMLDivElement | null };
  readonly phase?:
    | { readonly kind: "loading" }
    | {
        readonly kind: "view";
        readonly reading: { readonly boxes: readonly PageSize[] };
      };
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
        apply(fitWidthPercent(session));
      },
      zoomFitPage() {
        apply(fitPagePercent(session));
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

type MeasuredFit = {
  readonly column: HTMLDivElement;
  readonly page: number;
  readonly box: PageSize;
};

/** 页宽取重叠最大的可见页，调用时再量。不用 shownPage。 */
function measureFit(session: ZoomSession): MeasuredFit | undefined {
  const column = session.columnRef.current;
  const page = column === null ? undefined : readVisible(column);
  const boxes =
    session.phase?.kind === "view" ? session.phase.reading.boxes : [];
  const box = page === undefined ? undefined : boxes[page - 1];
  if (column === null || page === undefined || box === undefined) return;
  return { column, page, box };
}

function fitWidthPercent(session: ZoomSession): number | undefined {
  const measured = measureFit(session);
  if (measured === undefined) return undefined;
  const budget = measured.column.clientWidth - axisChrome(measured, "x");
  const level = clampFloor(budget, measured.box.width);
  if (level === undefined) return undefined;
  return resolveZoomPercent(level, measured.box, {
    width: Math.max(budget, 1),
    height: Math.max(measured.column.clientHeight, 1),
  });
}

function fitPagePercent(session: ZoomSession): number | undefined {
  const measured = measureFit(session);
  if (measured === undefined) return undefined;
  const width = measured.column.clientWidth - axisChrome(measured, "x");
  const height = measured.column.clientHeight - axisChrome(measured, "y");
  const span = measured.box.height;
  if (width <= 0 || height <= 0 || span <= 0) return undefined;
  const limit = Math.min(width, (height * measured.box.width) / span);
  const level = clampFloor(limit, measured.box.width);
  if (level === undefined) return undefined;
  return resolveZoomPercent(level, measured.box, {
    width: Math.max(width, 1),
    height: Math.max(height, 1),
  });
}

function clampFloor(budget: number, pageWidth: number): number | undefined {
  const bad = !Number.isFinite(budget + pageWidth) || pageWidth <= 0;
  if (bad) return undefined;
  const raw = Math.floor((budget / pageWidth) * 100);
  if (raw < ZOOM_PERCENT_MIN) return ZOOM_PERCENT_MIN;
  if (raw > ZOOM_PERCENT_MAX) return ZOOM_PERCENT_MAX;
  return raw;
}

function axisChrome(measured: MeasuredFit, axis: "x" | "y"): number {
  const pad = getComputedStyle(measured.column);
  const frame = pageFrame(measured.column, measured.page);
  const [start, end] =
    axis === "x" ? (["Left", "Right"] as const) : (["Top", "Bottom"] as const);
  return (
    px(pad[`padding${start}`]) +
    px(pad[`padding${end}`]) +
    px(frame?.[`border${start}Width`]) +
    px(frame?.[`border${end}Width`]) +
    px(frame?.[`padding${start}`]) +
    px(frame?.[`padding${end}`])
  );
}

function pageFrame(
  column: HTMLElement,
  page: number,
): CSSStyleDeclaration | undefined {
  const node = column.querySelector(`[data-page="${String(page)}"]`);
  return node instanceof HTMLElement ? getComputedStyle(node) : undefined;
}

function px(value: string | undefined): number {
  if (value === undefined) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
