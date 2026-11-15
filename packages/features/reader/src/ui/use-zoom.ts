import { useEffect, useState } from "react";

import {
  DEFAULT_ZOOM_PERCENT,
  nextZoomPercent,
  previousZoomPercent,
  resolveZoomPercent,
} from "../pure.js";
import { zoomSpoken } from "./copy.js";

export type ZoomCommands = {
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly zoomActual: () => void;
  readonly zoomFitWidth: () => void;
};

type Box = {
  readonly width: number;
  readonly height: number;
};

type ReadingBoxes = {
  readonly boxes?: readonly Box[] | undefined;
};

type ZoomSession = {
  readonly shownPage: number | undefined;
  readonly columnRef: { readonly current: HTMLElement | null };
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
  reading: ReadingBoxes | undefined,
  session: ZoomSession,
): ZoomState {
  const [percent, setPercent] = useState(DEFAULT_ZOOM_PERCENT);
  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    setPercent(DEFAULT_ZOOM_PERCENT);
    setSpoken("");
  }, [id]);
  const apply = (next: number | undefined): void => {
    if (!active || next === undefined || next === percent) {
      return;
    }
    setPercent(next);
    setSpoken(zoomSpoken(next));
  };
  const box = boxFor(reading, session.shownPage);
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
        apply(fitWidthPercent(box, session.columnRef.current));
      },
    },
  };
}

function boxFor(
  reading: ReadingBoxes | undefined,
  page: number | undefined,
): Box | undefined {
  if (page === undefined) {
    return undefined;
  }
  return reading?.boxes?.[page - 1];
}

function fitWidthPercent(
  page: Box | undefined,
  column: HTMLElement | null,
): number | undefined {
  if (page === undefined || column === null) {
    return undefined;
  }
  return resolveZoomPercent("fit-width", page, {
    width: column.clientWidth,
    height: column.clientHeight,
  });
}
