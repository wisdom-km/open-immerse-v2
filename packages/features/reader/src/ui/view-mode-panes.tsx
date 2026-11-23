import type { ReactElement } from "react";

import type { ReaderViewMode } from "./use-view-mode.js";

export function selectViewMode(
  next: ReaderViewMode,
  commit: (mode: ReaderViewMode) => void,
): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    const column = document.querySelector(".oi-reader-column");
    const insideColumn = column?.contains(active) === true;
    const onReturn = active.closest("[data-view-mode-return]") !== null;
    if (next === "translation" && insideColumn) {
      document.getElementById("oi-reader-view-translation")?.focus();
    } else if (next === "original" && onReturn) {
      document.getElementById("oi-reader-view-original")?.focus();
    }
  }
  commit(next);
}

export function ViewModePanes(props: {
  readonly mode: ReaderViewMode;
  readonly column: ReactElement;
  readonly empty: ReactElement;
}): ReactElement {
  const hidden = props.mode === "translation";
  return (
    <div className="oi-reader-panes">
      <div
        className={
          hidden ? "oi-reader-pane oi-reader-pane-hidden" : "oi-reader-pane"
        }
        inert={hidden ? true : undefined}
      >
        {props.column}
      </div>
      {props.mode === "original" ? null : (
        <div className="oi-reader-pane">{props.empty}</div>
      )}
    </div>
  );
}
