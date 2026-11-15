import {
  resolveZoomPercent,
  ZOOM_PERCENT_MAX,
  ZOOM_PERCENT_MIN,
} from "../pure.js";
import { readVisible } from "./use-reader-session.js";

type PageSize = { readonly width: number; readonly height: number };

/** 与 ZoomSession 同结构。不从 use-zoom 导入，避免循环。 */
type FitSession = {
  readonly columnRef: { readonly current: HTMLDivElement | null };
  readonly phase?:
    | { readonly kind: "loading" }
    | {
        readonly kind: "view";
        readonly reading: { readonly boxes: readonly PageSize[] };
      };
};

type MeasuredFit = {
  readonly column: HTMLDivElement;
  readonly page: number;
  readonly box: PageSize;
};

/** 页宽取重叠最大的可见页，调用时再量。不用 shownPage。 */
function measureFit(session: FitSession): MeasuredFit | undefined {
  const column = session.columnRef.current;
  const page = column === null ? undefined : readVisible(column);
  const boxes =
    session.phase?.kind === "view" ? session.phase.reading.boxes : [];
  const box = page === undefined ? undefined : boxes[page - 1];
  if (column === null || page === undefined || box === undefined) return;
  return { column, page, box };
}

export function fitWidthPercent(session: FitSession): number | undefined {
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

export function fitPagePercent(session: FitSession): number | undefined {
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
  if (!Number.isFinite(budget + pageWidth) || pageWidth <= 0) return;
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
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}
