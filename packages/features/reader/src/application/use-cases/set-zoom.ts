import type { Result } from "@oi/kernel";

import {
  readerFailure,
  type ReaderFailure,
} from "../../domain/reader-failure.js";
import { parseReaderDocumentId } from "../../domain/reader-session.js";
import {
  levelFromRemembered,
  parseZoomLevel,
  rememberedFromLevel,
  type ZoomLevel,
} from "../../domain/zoom-bounds.js";
import type { ReaderState } from "../ports/reader-state.js";

export type SetZoomInput = {
  readonly id: string;
  readonly level: unknown;
};

export type SetZoomValue = {
  readonly level: ZoomLevel;
};

export type SetZoom = (
  input: SetZoomInput,
) => Result<SetZoomValue, ReaderFailure>;

/**
 * 只记住 PDF 原文栏的缩放。
 * 不调用 webFrame，也不使用 Electron 的 zoomIn / zoomOut role。菜单改挂属 PR-C。
 */
export function createSetZoom(state: ReaderState): SetZoom {
  return (input) => setZoom(state, input);
}

function setZoom(
  state: ReaderState,
  input: SetZoomInput,
): Result<SetZoomValue, ReaderFailure> {
  const id = parseReaderDocumentId(input.id);
  const level = parseZoomLevel(input.level);
  if (id === undefined) {
    return { ok: false, error: readerFailure("not_found") };
  }
  if (level === undefined) {
    return { ok: false, error: readerFailure("invalid_level") };
  }
  const open = state.find(id);
  const zoom = rememberedFromLevel(level);
  if (open === undefined || zoom === undefined) {
    return {
      ok: false,
      error: readerFailure(open === undefined ? "not_found" : "invalid_level"),
    };
  }
  state.save({
    ...open,
    zoom,
    zoomPercent: zoom.kind === "percent" ? zoom.zoomPercent : open.zoomPercent,
  });
  return { ok: true, value: { level: levelFromRemembered(zoom) } };
}
