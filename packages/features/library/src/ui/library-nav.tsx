import type { ReactElement } from "react";

import type { LibraryViewName } from "./screen-model.js";

const items = [
  { view: "recent", label: "最近" },
  { view: "all", label: "全部论文" },
] as const;

export function LibraryNav(props: {
  readonly view: LibraryViewName;
  readonly onView: (view: LibraryViewName) => void;
}): ReactElement {
  return (
    <nav aria-label="文献库">
      {items.map((item) => (
        <button
          key={item.view}
          type="button"
          aria-current={props.view === item.view ? "page" : undefined}
          onClick={() => {
            props.onView(item.view);
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
