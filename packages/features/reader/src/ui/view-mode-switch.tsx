import type { ReactElement } from "react";

import type { ReaderViewMode } from "./use-view-mode.js";

const options = [
  ["original", "原文", "oi-reader-view-original"],
  ["contrast", "对照", "oi-reader-view-contrast"],
  ["translation", "译文", "oi-reader-view-translation"],
] as const;

export function ViewModeSwitch(props: {
  readonly mode: ReaderViewMode;
  readonly onSelect: (mode: ReaderViewMode) => void;
}): ReactElement {
  return (
    <fieldset
      className="oi-reader-view-mode"
      role="radiogroup"
      aria-label="栏位"
    >
      {options.map(([value, label, id]) => (
        <label key={value}>
          <input
            id={id}
            type="radio"
            name="oi-reader-view-mode"
            value={value}
            checked={props.mode === value}
            onChange={() => {
              props.onSelect(value);
            }}
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
