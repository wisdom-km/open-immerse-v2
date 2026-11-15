import { useState, type ReactElement } from "react";

import { ZOOM_PERCENT_MAX, ZOOM_PERCENT_MIN } from "../pure.js";
import type { ZoomState } from "./use-zoom.js";

export function ZoomControls(props: {
  readonly active: boolean;
  readonly zoom: ZoomState;
}): ReactElement {
  return (
    <>
      {props.active ? <ZoomPad zoom={props.zoom} /> : null}
      <p className="oi-reader-zoom" role="status">
        {props.zoom.spoken}
      </p>
    </>
  );
}

function ZoomPad(props: { readonly zoom: ZoomState }): ReactElement {
  const [tick, setTick] = useState(0);
  const mac = /Mac/.test(navigator.userAgent);
  return (
    <span className="oi-reader-zoom-controls">
      <button
        type="button"
        aria-label="缩小"
        title={shortcut("缩小", mac)}
        disabled={props.zoom.percent <= ZOOM_PERCENT_MIN}
        onClick={() => {
          props.zoom.commands.zoomOut();
        }}
      >
        −
      </button>
      <select
        key={tick}
        aria-label="缩放"
        defaultValue="current"
        onChange={(event) => {
          choose(event.target.value, props.zoom);
          setTick((value) => value + 1);
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
        disabled={props.zoom.percent >= ZOOM_PERCENT_MAX}
        onClick={() => {
          props.zoom.commands.zoomIn();
        }}
      >
        +
      </button>
    </span>
  );
}

function choose(value: string, zoom: ZoomState): void {
  if (value === "actual") zoom.commands.zoomActual();
  else if (value === "fit-width") zoom.commands.zoomFitWidth();
  else if (value === "fit-page") zoom.commands.zoomFitPage();
}

function shortcut(
  name: "放大" | "缩小" | "实际大小" | "适合宽度",
  mac: boolean,
): string {
  const key = mac ? macKey(name) : windowsKey(name);
  return `${name}（${key}）`;
}

function macKey(name: "放大" | "缩小" | "实际大小" | "适合宽度"): string {
  if (name === "放大") return "⌘=";
  if (name === "缩小") return "⌘−";
  if (name === "实际大小") return "⌘0";
  return "⌥⌘0";
}

function windowsKey(name: "放大" | "缩小" | "实际大小" | "适合宽度"): string {
  if (name === "放大") return "Ctrl+=";
  if (name === "缩小") return "Ctrl+−";
  if (name === "实际大小") return "Ctrl+0";
  return "Ctrl+Alt+0";
}
