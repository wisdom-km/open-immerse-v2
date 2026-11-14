export { looksLikePdf } from "./domain/pdf-bytes.js";
export { clampPage } from "./domain/page-bounds.js";
export {
  emptyPositionHistory,
  goBack,
  goForward,
  POSITION_HISTORY_LIMIT,
  recordJump,
  replaceCurrent,
} from "./domain/position-history.js";
export type { PositionHistory, ReaderJump } from "./domain/position-history.js";
export {
  buildReaderSession,
  parseReaderDocumentId,
  parseReaderFileName,
  parseReaderTitle,
  READER_VIEW_MODE_ORIGINAL,
} from "./domain/reader-session.js";
export type { ReaderSessionInput } from "./domain/reader-session.js";
export {
  resolveZoomPercent,
  viewportForZoom,
} from "./domain/viewport-mapping.js";
export type {
  PageBox,
  ResolvedViewport,
  ViewportBox,
} from "./domain/viewport-mapping.js";
export {
  clampZoomPercent,
  DEFAULT_ZOOM_PERCENT,
  levelFromRemembered,
  nextZoomPercent,
  parseZoomLevel,
  parseZoomPercent,
  previousZoomPercent,
  rememberedFromLevel,
  ZOOM_PERCENT_MAX,
  ZOOM_PERCENT_MIN,
} from "./domain/zoom-bounds.js";
export type {
  FitLiteral,
  RememberedZoom,
  ZoomLevel,
} from "./domain/zoom-bounds.js";
