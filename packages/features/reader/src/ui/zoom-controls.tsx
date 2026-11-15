import type { KeyboardEvent, ReactElement } from "react";

import { ZOOM_PERCENT_MAX, ZOOM_PERCENT_MIN } from "../pure.js";
import type { ZoomState } from "./use-zoom.js";

const KEYS = {
  放大: ["Ctrl+=", "⌘="],
  缩小: ["Ctrl+−", "⌘−"],
  实际大小: ["Ctrl+0", "⌘0"],
  适合宽度: ["Ctrl+Alt+0", "⌥⌘0"],
} as const;

export function ZoomControls(props: {
  readonly active: boolean;
  readonly zoom: ZoomState;
  readonly controls?: boolean;
  readonly status?: boolean;
}): ReactElement {
  return (
    <>
      {props.controls !== false && props.active ? (
        <ZoomPad zoom={props.zoom} />
      ) : null}
      {props.status === false ? null : (
        <p className="oi-reader-zoom" role="status">
          {props.zoom.spoken}
        </p>
      )}
    </>
  );
}

function ZoomPad(props: { readonly zoom: ZoomState }): ReactElement {
  const mac = /Mac/.test(navigator.userAgent);
  const atMin = props.zoom.percent <= ZOOM_PERCENT_MIN;
  const atMax = props.zoom.percent >= ZOOM_PERCENT_MAX;
  return (
    <span className="oi-reader-zoom-controls">
      <button
        type="button"
        aria-label="缩小"
        title={shortcut("缩小", mac)}
        aria-disabled={atMin || undefined}
        onClick={() => {
          if (!atMin) props.zoom.commands.zoomOut();
        }}
      >
        −
      </button>
      <select
        aria-label="缩放"
        value="current"
        onKeyDown={keepClosed}
        onChange={(event) => {
          choose(event.target.value, props.zoom);
        }}
      >
        <option value="current">{props.zoom.percent}%</option>
        <option value="actual" title={shortcut("实际大小", mac)}>
          实际大小
        </option>
        <option value="fit-width" title={shortcut("适合宽度", mac)}>
          适合宽度
        </option>
        <option value="fit-page">适合页面</option>
        <option value="note" disabled>
          只缩放 PDF 原文栏；界面跟随系统缩放
        </option>
      </select>
      <button
        type="button"
        aria-label="放大"
        title={shortcut("放大", mac)}
        aria-disabled={atMax || undefined}
        onClick={() => {
          if (!atMax) props.zoom.commands.zoomIn();
        }}
      >
        +
      </button>
    </span>
  );
}

function keepClosed(event: KeyboardEvent<HTMLSelectElement>): void {
  if (event.altKey || !/^(Arrow|Page|Home|End)/.test(event.key)) return;
  event.preventDefault();
}

function choose(value: string, zoom: ZoomState): void {
  if (value === "actual") zoom.commands.zoomActual();
  else if (value === "fit-width") zoom.commands.zoomFitWidth();
  else if (value === "fit-page") zoom.commands.zoomFitPage();
}

function shortcut(name: keyof typeof KEYS, mac: boolean): string {
  return `${name}（${KEYS[name][mac ? 1 : 0]}）`;
}
