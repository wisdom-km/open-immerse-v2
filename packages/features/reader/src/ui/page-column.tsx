import { useEffect, useRef, type ReactElement, type Ref } from "react";

import type { PageBox } from "./render-scale.js";
import { paintErrorIsQuiet } from "./pdf-session.js";
import type { PdfCancel, PdfPaint } from "./reader-client.js";
import { useCanvasWindow } from "./use-canvas-window.js";

export function PageColumn(props: {
  readonly page: number;
  readonly pageCount: number;
  readonly columnRef: Ref<HTMLDivElement>;
  readonly onScroll: () => void;
  readonly onScrollEnd: () => void;
  readonly paint: PdfPaint | undefined;
  readonly cancel: PdfCancel | undefined;
  readonly boxes?: readonly PageBox[] | undefined;
  readonly releasePixels?: { current: boolean };
}): ReactElement {
  const pages = pageNumbers(props.pageCount);
  const canvas = useCanvasWindow(props.columnRef, props.page, props.pageCount);
  const releasePixels = props.releasePixels ?? alwaysRelease;
  return (
    <section className="oi-reader-main">
      <Restore columnRef={props.columnRef} page={props.page} />
      <div
        className="oi-reader-column"
        ref={props.columnRef}
        onScroll={() => {
          canvas.onScroll();
          props.onScroll();
        }}
        onScrollEnd={props.onScrollEnd}
      >
        {pages.map((page) => (
          <PageFrame
            key={page}
            page={page}
            box={props.boxes?.[page - 1]}
            kept={page >= canvas.span.first && page <= canvas.span.last}
            paint={props.paint}
            cancel={props.cancel}
            releasePixels={releasePixels}
          />
        ))}
      </div>
    </section>
  );
}

const alwaysRelease = { current: true };

function PageFrame(props: {
  readonly page: number;
  readonly box: PageBox | undefined;
  readonly kept: boolean;
  readonly paint: PdfPaint | undefined;
  readonly cancel: PdfCancel | undefined;
  readonly releasePixels: { current: boolean };
}): ReactElement {
  return (
    <article
      data-page={props.page}
      className={props.box === undefined ? undefined : "oi-reader-sheet"}
      style={frameStyle(props.box)}
    >
      {props.kept ? (
        <PaintedPage
          page={props.page}
          paint={props.paint}
          cancel={props.cancel}
          releasePixels={props.releasePixels}
        />
      ) : null}
    </article>
  );
}

function PaintedPage(props: {
  readonly page: number;
  readonly paint: PdfPaint | undefined;
  readonly cancel: PdfCancel | undefined;
  readonly releasePixels: { current: boolean };
}): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cancelRef = useRef(props.cancel);
  cancelRef.current = props.cancel;
  const releaseRef = useRef(props.releasePixels);
  releaseRef.current = props.releasePixels;
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
      if (releaseRef.current.current) {
        canvas.width = 0;
        canvas.height = 0;
      }
      cancelRef.current?.(canvas);
    };
  }, [props.page, props.paint]);
  return <canvas ref={canvasRef} aria-hidden="true" />;
}

function frameStyle(
  box: PageBox | undefined,
):
  | { readonly width: string; readonly height: string; readonly minHeight: 0 }
  | undefined {
  if (box === undefined) {
    return undefined;
  }
  return {
    width: `${String(box.width)}px`,
    height: `${String(box.height)}px`,
    minHeight: 0,
  };
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
    const column = columnElement(props.columnRef);
    const selector = `[data-page="${String(pageRef.current)}"]`;
    column?.querySelector<HTMLElement>(selector)?.scrollIntoView();
  }, [props.columnRef]);
  return null;
}

function columnElement(ref: Ref<HTMLDivElement>): HTMLDivElement | null {
  if (ref !== null && typeof ref !== "function") {
    return ref.current;
  }
  return null;
}
