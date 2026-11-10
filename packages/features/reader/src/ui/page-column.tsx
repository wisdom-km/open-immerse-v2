import { useEffect, useRef, type ReactElement, type Ref } from "react";

import { paintErrorIsQuiet } from "./pdf-session.js";
import type { PdfCancel, PdfPaint } from "./reader-client.js";

export function PageColumn(props: {
  readonly page: number;
  readonly pageCount: number;
  readonly columnRef: Ref<HTMLDivElement>;
  readonly onScroll: () => void;
  readonly onScrollEnd: () => void;
  readonly paint: PdfPaint | undefined;
  readonly cancel: PdfCancel | undefined;
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
          <PageSheet
            key={page}
            page={page}
            paint={props.paint}
            cancel={props.cancel}
          />
        ))}
      </div>
    </section>
  );
}

function PageSheet(props: {
  readonly page: number;
  readonly paint: PdfPaint | undefined;
  readonly cancel: PdfCancel | undefined;
}): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cancelRef = useRef(props.cancel);
  cancelRef.current = props.cancel;
  useEffect(() => {
    const canvas = canvasRef.current;
    const paint = props.paint;
    if (canvas === null || paint === undefined) {
      return;
    }
    void paint(props.page, canvas).catch((error: unknown) => {
      reportPaintError(error);
    });
    return () => {
      cancelRef.current?.(canvas);
    };
  }, [props.page, props.paint]);
  return (
    <article data-page={props.page}>
      <canvas ref={canvasRef} />
    </article>
  );
}

function reportPaintError(error: unknown): void {
  if (paintErrorIsQuiet(error)) {
    return;
  }
  console.error(error);
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
