import type { ReactElement } from "react";

export function LibrarySkeleton(): ReactElement {
  return (
    <div aria-busy="true">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
