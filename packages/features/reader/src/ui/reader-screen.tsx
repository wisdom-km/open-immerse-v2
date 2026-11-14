import { useEffect, useLayoutEffect, useState, type ReactElement } from "react";

import {
  BACK_LABEL,
  BACK_TOOLTIP,
  ERROR_TITLE,
  LOST_PLACE,
  pageLabel,
} from "./copy.js";
import { GoToPage } from "./go-to-page.js";
import { HistoryControls } from "./history-controls.js";
import { PageColumn } from "./page-column.js";
import type { ReaderClient } from "./reader-client.js";
import { usePositionHistory } from "./use-position-history.js";
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
  const reading =
    session.phase.kind === "view" ? session.phase.reading : undefined;
  const viewing =
    reading?.paint !== undefined && session.shownPage !== undefined;
  const nav = usePositionHistory(
    props.id,
    viewing ? session.shownPage : undefined,
    session.columnRef,
    reading?.pageCount,
  );
  useLeaveKeys(session.leave);
  useLayoutEffect(() => {
    props.onBindLeave?.(session.leave);
    return () => {
      props.onBindLeave?.(undefined);
    };
  }, [props.onBindLeave, session.leave]);
  return (
    <section className="oi-reader" aria-label={props.title}>
      <ReaderBar
        title={props.title}
        leave={session.leave}
        viewing={viewing}
        pageCount={reading?.pageCount}
        lostPlace={session.lostPlace}
        fallbackPage={session.shownPage}
        nav={nav}
      />
      <ReaderBody
        loading={session.phase.kind === "loading"}
        sentence={reading?.sentence}
        page={session.shownPage}
        pageCount={reading?.pageCount}
        columnRef={session.columnRef}
        onScroll={session.onScroll}
        onScrollEnd={() => {
          nav.clearPending();
          session.onScrollEnd();
        }}
        paint={reading?.paint}
        cancel={reading?.cancel}
        onLeave={session.leave}
      />
    </section>
  );
}

function ReaderBar(props: {
  readonly title: string;
  readonly leave: () => void;
  readonly viewing: boolean;
  readonly pageCount: number | undefined;
  readonly lostPlace: boolean;
  readonly fallbackPage: number | undefined;
  readonly nav: ReturnType<typeof usePositionHistory>;
}): ReactElement {
  const page =
    props.viewing &&
    props.nav.shown !== undefined &&
    props.pageCount !== undefined ? (
      <GoToPage
        page={props.nav.shown}
        pageCount={props.pageCount}
        onJump={(target) => {
          props.nav.jump(target);
        }}
      />
    ) : (
      <PageMark page={props.fallbackPage} pageCount={props.pageCount} />
    );
  return (
    <header className="oi-reader-bar">
      <button
        type="button"
        className="oi-reader-back"
        aria-label={BACK_LABEL}
        title={BACK_TOOLTIP}
        onClick={props.leave}
      >
        ‹
      </button>
      {props.viewing ? (
        <HistoryControls
          canBack={props.nav.canBack}
          canForward={props.nav.canForward}
          onBack={() => {
            props.nav.back();
          }}
          onForward={() => {
            props.nav.forward();
          }}
        />
      ) : null}
      <h1>{props.title}</h1>
      {page}
      <p className="oi-reader-status" role="status">
        {props.nav.spoken}
      </p>
      {props.lostPlace ? (
        <p className="oi-reader-status" role="status">
          {LOST_PLACE}
        </p>
      ) : null}
      <span className="oi-reader-gap" />
      <span className="oi-reader-chip" />
    </header>
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
  readonly cancel: ((canvas: HTMLCanvasElement) => void) | undefined;
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
      cancel={props.cancel}
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
