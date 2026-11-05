import type { ReactElement } from "react";

import { DropOverlay } from "./drop-overlay.js";
import { LibraryEmpty } from "./library-empty.js";
import { LibraryNav } from "./library-nav.js";
import { LibrarySkeleton } from "./library-skeleton.js";
import { LibraryStatus } from "./library-status.js";
import { LibraryTable } from "./library-table.js";
import { useFileDrop } from "./use-drop.js";
import { useLibraryScreen, type LibraryScreen } from "./use-library-screen.js";

export function LibraryApp(): ReactElement {
  const screen = useLibraryScreen();
  const dragging = useFileDrop(screen.dropFile);
  return (
    <div className="library">
      <LibraryNav view={screen.view} onView={screen.chooseView} />
      <main>
        <header>
          <h1>{screen.view === "recent" ? "最近" : "全部论文"}</h1>
          <button type="button" onClick={screen.openFile}>
            打开文件…
          </button>
        </header>
        <LibraryStatus text={screen.status} />
        <LibraryBody screen={screen} />
        {dragging ? <DropOverlay /> : null}
      </main>
    </div>
  );
}

function LibraryBody(props: {
  readonly screen: LibraryScreen;
}): ReactElement | null {
  if (props.screen.busy) {
    return <LibrarySkeleton />;
  }
  if (props.screen.rows.length === 0) {
    if (props.screen.failed) {
      return null;
    }
    return (
      <LibraryEmpty
        view={props.screen.view}
        onAll={() => {
          props.screen.chooseView("all");
        }}
      />
    );
  }
  return (
    <LibraryTable
      rows={props.screen.rows}
      sort={props.screen.sort}
      selectedId={props.screen.selectedId}
      onSort={props.screen.chooseSort}
      onSelect={props.screen.selectRow}
    />
  );
}
