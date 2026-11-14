/** 不是实测上限。E1c 之后的 8 GB Windows 真机测完才替换。此前为 Infinity，不抄 pdf.js 的 2 ** 25。 */
export const PROVISIONAL_PAGE_PIXEL_CAP = Number.POSITIVE_INFINITY;

export type PageBox = {
  readonly width: number;
  readonly height: number;
};

export type RenderSize = {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly backingWidth: number;
  readonly backingHeight: number;
  readonly scale: number;
};

export function renderSize(input: {
  readonly pageWidth: number;
  readonly pageHeight: number;
  readonly zoom: number;
  readonly dpr: number;
  readonly pixelCap: number;
}): RenderSize {
  const scale = scaleWithinCap(
    input.zoom * input.dpr,
    input.pageWidth,
    input.pageHeight,
    input.pixelCap,
  );
  const backing = backingPixels(input.pageWidth, input.pageHeight, scale);
  return {
    cssWidth: input.pageWidth * input.zoom,
    cssHeight: input.pageHeight * input.zoom,
    backingWidth: backing.width,
    backingHeight: backing.height,
    scale,
  };
}

export function clampedScale(
  requested: number,
  pageArea: number,
  pixelCap: number,
): number {
  if (!Number.isFinite(pixelCap) || pageArea <= 0) {
    return requested;
  }
  return Math.min(requested, Math.sqrt(pixelCap / pageArea));
}

function scaleWithinCap(
  requested: number,
  pageWidth: number,
  pageHeight: number,
  pixelCap: number,
): number {
  let scale = clampedScale(requested, pageWidth * pageHeight, pixelCap);
  for (let step = 0; step < 8; step += 1) {
    const backing = backingPixels(pageWidth, pageHeight, scale);
    if (
      !Number.isFinite(pixelCap) ||
      backing.width * backing.height <= pixelCap
    ) {
      return scale;
    }
    scale *= 0.99;
  }
  return scale;
}

function backingPixels(
  pageWidth: number,
  pageHeight: number,
  scale: number,
): { readonly width: number; readonly height: number } {
  return {
    width: Math.max(1, Math.ceil(pageWidth * scale - 1e-9)),
    height: Math.max(1, Math.ceil(pageHeight * scale - 1e-9)),
  };
}
