import {
  clampZoomPercent,
  parseZoomPercent,
  type FitLiteral,
  type ZoomLevel,
} from "./zoom-bounds.js";

export type PageBox = {
  readonly width: number;
  readonly height: number;
};

export type ViewportBox = {
  readonly width: number;
  readonly height: number;
};

export type ResolvedViewport = {
  readonly zoomPercent: number;
  readonly width: number;
  readonly height: number;
};

/**
 * 100 表示 scale 1：PDF 点与 CSS 像素 1:1，对齐 PDF.js getViewport({ scale: 1 })。
 * 只描述 PDF 原文栏。不缩放 Electron 界面。
 */
export function resolveZoomPercent(
  level: ZoomLevel,
  page: PageBox,
  container: ViewportBox,
): number | undefined {
  if (typeof level === "number") {
    return parseZoomPercent(level);
  }
  return fitPercent(level, page, container);
}

export function viewportForZoom(
  page: PageBox,
  zoomPercent: number,
): ResolvedViewport | undefined {
  const percent = parseZoomPercent(zoomPercent);
  if (
    percent === undefined ||
    !positive(page.width) ||
    !positive(page.height)
  ) {
    return undefined;
  }
  const scale = percent / 100;
  return {
    zoomPercent: percent,
    width: page.width * scale,
    height: page.height * scale,
  };
}

function fitPercent(
  level: FitLiteral,
  page: PageBox,
  container: ViewportBox,
): number | undefined {
  if (
    !positive(page.width) ||
    !positive(page.height) ||
    !positive(container.width) ||
    !positive(container.height)
  ) {
    return undefined;
  }
  const widthScale = container.width / page.width;
  const heightScale = container.height / page.height;
  const scale =
    level === "fit-width" ? widthScale : Math.min(widthScale, heightScale);
  return clampZoomPercent(scale * 100);
}

function positive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
