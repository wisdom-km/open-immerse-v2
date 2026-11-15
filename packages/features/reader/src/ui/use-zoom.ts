import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  DEFAULT_ZOOM_PERCENT,
  nextZoomPercent,
  previousZoomPercent,
} from "../pure.js";
import { zoomSpoken } from "./copy.js";
import { attachColumnWheel } from "./zoom-gesture.js";
import { fitPagePercent, fitWidthPercent } from "./zoom-fit.js";

const ANNOUNCE_MS = 300;

export type ZoomCommands = {
  readonly zoomIn: (later?: true) => void;
  readonly zoomOut: (later?: true) => void;
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
  const percentRef = useRef(DEFAULT_ZOOM_PERCENT);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sessionRef = useRef(session);
  const activeRef = useRef(active);
  const steps = useRef<ZoomCommands>(idleZoom);
  sessionRef.current = session;
  activeRef.current = active;
  const speech = { timer, setSpoken, percentRef };
  const apply = (next: number | undefined, later = false): void => {
    if (
      !activeRef.current ||
      next === undefined ||
      next === percentRef.current
    ) {
      return;
    }
    rememberZoomAnchor(sessionRef.current.columnRef.current);
    percentRef.current = next;
    setPercent(next);
    say(speech, later);
  };
  steps.current = {
    zoomIn(later) {
      apply(nextZoomPercent(percentRef.current), later === true);
    },
    zoomOut(later) {
      apply(previousZoomPercent(percentRef.current), later === true);
    },
    zoomActual() {
      apply(DEFAULT_ZOOM_PERCENT);
    },
    zoomFitWidth() {
      apply(fitWidthPercent(sessionRef.current));
    },
    zoomFitPage() {
      apply(fitPagePercent(sessionRef.current));
    },
  };
  useEffect(() => {
    percentRef.current = DEFAULT_ZOOM_PERCENT;
    clearTimer(timer);
    setPercent(DEFAULT_ZOOM_PERCENT);
    setSpoken("");
  }, [id]);
  useEffect(() => {
    const column = sessionRef.current.columnRef.current;
    if (!active || column === null) return;
    const detach = attachColumnWheel(column, steps);
    return () => {
      detach();
      clearTimer(timer);
    };
  }, [active, id]);
  return {
    percent,
    ratio: percent / 100,
    spoken,
    commands: steps.current,
  };
}

const idle = (): void => undefined;
const idleZoom: ZoomCommands = {
  zoomIn: idle,
  zoomOut: idle,
  zoomActual: idle,
  zoomFitWidth: idle,
  zoomFitPage: idle,
};

type Speech = {
  readonly timer: { current: ReturnType<typeof setTimeout> | undefined };
  readonly setSpoken: Dispatch<SetStateAction<string>>;
  readonly percentRef: { readonly current: number };
};

function say(speech: Speech, later: boolean): void {
  clearTimer(speech.timer);
  const write = (): void => {
    const text = zoomSpoken(speech.percentRef.current);
    speech.setSpoken((current) => (current === text ? current : text));
  };
  if (!later) {
    write();
    return;
  }
  speech.timer.current = setTimeout(() => {
    speech.timer.current = undefined;
    write();
  }, ANNOUNCE_MS);
}

function clearTimer(timer: Speech["timer"]): void {
  if (timer.current === undefined) return;
  clearTimeout(timer.current);
  timer.current = undefined;
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
