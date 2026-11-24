import type { MouseEvent, ReactElement } from "react";

import {
  VIEW_EMPTY_COPY,
  VIEW_ORIGINAL_LINK_MAC,
  VIEW_ORIGINAL_LINK_WIN,
} from "./copy.js";

export function ViewModeEmpty(props: {
  readonly onOriginal: () => void;
}): ReactElement {
  const mac = /Mac/.test(navigator.userAgent);
  return (
    <div className="oi-reader-view-empty">
      <p data-slot="view-mode-empty-copy">{VIEW_EMPTY_COPY}</p>
      <p data-slot="view-mode-empty-degrade" />
      <a
        href="#oi-reader-view-original"
        data-view-mode-return=""
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          props.onOriginal();
        }}
      >
        {mac ? VIEW_ORIGINAL_LINK_MAC : VIEW_ORIGINAL_LINK_WIN}
      </a>
    </div>
  );
}
