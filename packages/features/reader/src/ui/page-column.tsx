import { useEffect, useRef, type ReactElement, type Ref } from "react";

export function PageColumn(props: {
  readonly page: number;
  readonly pageCount: number;
  readonly columnRef: Ref<HTMLDivElement>;
  readonly onScroll: () => void;
  readonly onScrollEnd: () => void;
  readonly paint:
    | ((page: number, canvas: HTMLCanvasElement) => Promise<void>)
    | undefined;
}): ReactElement {
  const pages = pageNumbers(props.pageCount);
  return (
    <section className="oi-reader-main">
      <Restore columnRef={props.columnRef} page={props.page} />
      <div
        className="oi-reader-column"
        ref={props.columnRef}
        onScroll={props.onScroll}
        onScrollEnd={props.onScrollEnd}
      >
        {pages.map((page) => (
          <PageSheet key={page} page={page} paint={props.paint} />
        ))}
      </div>
    </section>
  );
}

function PageSheet(props: {
  readonly page: number;
  readonly paint:
    | ((page: number, canvas: HTMLCanvasElement) => Promise<void>)
    | undefined;
}): ReactElement {
  return (
    <article data-page={props.page}>
      <canvas
        ref={(node) => {
          if (node !== null && props.paint !== undefined) {
            void props.paint(props.page, node);
          }
        }}
      />
    </article>
  );
}

function pageNumbers(pageCount: number): number[] {
  return Array.from({ length: pageCount }, (_unused, index) => index + 1);
}

function Restore(props: {
  readonly columnRef: Ref<HTMLDivElement>;
  readonly page: number;
}): null {
  const pageRef = useRef(props.page);
  useEffect(() => {
    const column = currentColumn(props.columnRef);
    const selector = `[data-page="${String(pageRef.current)}"]`;
    column?.querySelector<HTMLElement>(selector)?.scrollIntoView();
  }, [props.columnRef]);
  return null;
}

function currentColumn(ref: Ref<HTMLDivElement>): HTMLDivElement | null {
  if (ref !== null && typeof ref !== "function") {
    return ref.current;
  }
  return null;
}
