import { useEffect, useState, type Ref } from "react";

import {
  canvasWindow,
  spanFromOverlaps,
  type PageSpan,
} from "./canvas-window.js";
import { overlapHeight } from "./visible-page.js";

export function useCanvasWindow(
  columnRef: Ref<HTMLDivElement>,
  page: number,
  pageCount: number,
): { readonly span: PageSpan; readonly onScroll: () => void } {
  const [seen, setSeen] = useState<PageSpan | undefined>(undefined);
  useEffect(() => {
    setSeen((current) => {
      if (
        current !== undefined &&
        page >= current.first &&
        page <= current.last
      ) {
        return current;
      }
      return undefined;
    });
  }, [page, pageCount]);
  const visible = seen ?? { first: page, last: page };
  return {
    span: canvasWindow(visible.first, visible.last, pageCount),
    onScroll() {
      const next = readSpan(columnRef);
      if (next === undefined) {
        return;
      }
      setSeen((current) =>
        current?.first === next.first && current.last === next.last
          ? current
          : next,
      );
    },
  };
}

function readSpan(columnRef: Ref<HTMLDivElement>): PageSpan | undefined {
  const column = columnElement(columnRef);
  if (column === null) {
    return undefined;
  }
  const view = column.getBoundingClientRect();
  const pages = [...column.querySelectorAll<HTMLElement>("[data-page]")].map(
    (element) => {
      const box = element.getBoundingClientRect();
      return {
        page: Number(element.dataset.page),
        overlap: overlapHeight(box.top, box.bottom, view.top, view.bottom),
      };
    },
  );
  return spanFromOverlaps(pages);
}

function columnElement(ref: Ref<HTMLDivElement>): HTMLDivElement | null {
  if (ref !== null && typeof ref !== "function") {
    return ref.current;
  }
  return null;
}
