import type { ReactElement } from "react";

import type { LibraryViewName } from "./screen-model.js";

export function LibraryEmpty(props: {
  readonly view: LibraryViewName;
  readonly onAll: () => void;
}): ReactElement {
  return (
    <div>
      <p>把论文 PDF 拖到这里</p>
      {props.view === "recent" ? (
        <a
          href="#all-papers"
          onClick={(event) => {
            event.preventDefault();
            props.onAll();
          }}
        >
          全部论文
        </a>
      ) : null}
    </div>
  );
}
