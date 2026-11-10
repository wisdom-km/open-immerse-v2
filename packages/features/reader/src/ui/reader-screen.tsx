import { useEffect, useLayoutEffect, useState, type ReactElement } from "react";

import {
  BACK_LABEL,
  BACK_TOOLTIP,
  ERROR_TITLE,
  LOST_PLACE,
  pageLabel,
} from "./copy.js";
import { PageColumn } from "./page-column.js";
import type { ReaderClient } from "./reader-client.js";
import { useReaderSession } from "./use-reader-session.js";

const SKELETON_MS = 200;

export function ReaderScreen(props: {
  readonly id: string;
  readonly title: string;
  readonly client: ReaderClient;
  readonly onLeave: () => void;
  readonly onBindLeave?:
    | ((leave: (() => void) | undefined) => void)
    | undefined;
}): ReactElement {
  const session = useReaderSession(props.client, props.id, props.onLeave);
  useLeaveKeys(session.leave);
  useLayoutEffect(() => {
    props.onBindLeave?.(session.leave);
    return () => {
      props.onBindLeave?.(undefined);
    };
  }, [props.onBindLeave, session.leave]);
  const reading =
    session.phase.kind === "view" ? session.phase.reading : undefined;
  return (
    <section className="oi-reader" aria-label={props.title}>
      <header className="oi-reader-bar">
        <button
          type="button"
          className="oi-reader-back"
          aria-label={BACK_LABEL}
          title={BACK_TOOLTIP}
          onClick={session.leave}
        >
          ‹
        </button>
        <h1>{props.title}</h1>
        <PageMark page={session.shownPage} pageCount={reading?.pageCount} />
        {session.lostPlace ? (
          <p className="oi-reader-status" role="status">
            {LOST_PLACE}
          </p>
        ) : null}
        <span className="oi-reader-gap" />
        <span className="oi-reader-chip" />
      </header>
      <ReaderBody
        loading={session.phase.kind === "loading"}
        sentence={reading?.sentence}
        page={session.shownPage}
        pageCount={reading?.pageCount}
        columnRef={session.columnRef}
        onScroll={session.onScroll}
        onScrollEnd={session.onScrollEnd}
        paint={reading?.paint}
        onLeave={session.leave}
      />
    </section>
  );
}

function ReaderBody(props: {
  readonly loading: boolean;
  readonly sentence: string | undefined;
  readonly page: number | undefined;
  readonly pageCount: number | undefined;
  readonly columnRef: { readonly current: HTMLDivElement | null };
  readonly onScroll: () => void;
  readonly onScrollEnd: () => void;
  readonly paint:
    | ((page: number, canvas: HTMLCanvasElement) => Promise<void>)
    | undefined;
  readonly onLeave: () => void;
}): ReactElement {
  if (props.loading) {
    return <LoadingPane />;
  }
  if (
    props.sentence !== undefined ||
    props.page === undefined ||
    props.pageCount === undefined
  ) {
    return <ErrorPane sentence={props.sentence} onLeave={props.onLeave} />;
  }
  return (
    <PageColumn
      page={props.page}
      pageCount={props.pageCount}
      columnRef={props.columnRef}
      onScroll={props.onScroll}
      onScrollEnd={props.onScrollEnd}
      paint={props.paint}
    />
  );
}

function PageMark(props: {
  readonly page: number | undefined;
  readonly pageCount: number | undefined;
}): ReactElement | null {
  if (props.page === undefined || props.pageCount === undefined) {
    return null;
  }
  return (
    <p className="oi-reader-pages">{pageLabel(props.page, props.pageCount)}</p>
  );
}

function LoadingPane(): ReactElement {
  const visible = useDelayed(SKELETON_MS);
  return visible ? <div className="oi-reader-skeleton" /> : <div />;
}

function useDelayed(delayMs: number): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [delayMs]);
  return visible;
}

function ErrorPane(props: {
  readonly sentence: string | undefined;
  readonly onLeave: () => void;
}): ReactElement {
  return (
    <div className="oi-reader-error">
      <h2>{ERROR_TITLE}</h2>
      <p>{props.sentence}</p>
      <button type="button" onClick={props.onLeave}>
        {BACK_LABEL}
      </button>
    </div>
  );
}

function useLeaveKeys(leave: () => void): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        leave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [leave]);
}
