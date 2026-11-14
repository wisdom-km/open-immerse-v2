import { useEffect, useLayoutEffect, useState, type ReactElement } from "react";

import {
  BACK_LABEL,
  BACK_TOOLTIP,
  ERROR_TITLE,
  LOST_PLACE,
  pageLabel,
} from "./copy.js";
import { GoToPage, useNavCommands } from "./go-to-page.js";
import { HistoryControls } from "./history-controls.js";
import { PageColumn } from "./page-column.js";
import type { ReaderClient } from "./reader-client.js";
import { usePositionHistory } from "./use-position-history.js";
import { readVisible, useReaderSession } from "./use-reader-session.js";

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
  const nav = useReaderNav(
    props.id,
    viewing,
    session.shownPage,
    reading?.pageCount,
    session.columnRef,
    session.leave,
  );
  useLayoutEffect(() => {
    props.onBindLeave?.(session.leave);
    return () => {
      props.onBindLeave?.(undefined);
    };
  }, [props.onBindLeave, session.leave]);
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
        {nav.controls}
        <h1>{props.title}</h1>
        {nav.page ?? (
          <PageMark page={session.shownPage} pageCount={reading?.pageCount} />
        )}
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

function useReaderNav(
  id: string,
  viewing: boolean,
  shownPage: number | undefined,
  pageCount: number | undefined,
  columnRef: { readonly current: HTMLDivElement | null },
  leave: () => void,
) {
  const history = usePositionHistory(id, viewing ? shownPage : undefined);
  const [pending, setPending] = useState<number | undefined>(undefined);
  const shown = pending ?? shownPage;
  const show = (page: number): void => {
    setPending(page);
    columnRef.current
      ?.querySelector(`[data-page="${String(page)}"]`)
      ?.scrollIntoView();
  };
  const follow = (page: number | undefined, emptyLeaves: boolean): void => {
    if (page === undefined) {
      if (emptyLeaves) leave();
      return;
    }
    show(page);
  };
  useNavCommands(viewing, {
    back() {
      follow(history.back(), true);
    },
    forward() {
      follow(history.forward(), false);
    },
  });
  const jump = (target: number): void => {
    const visible = readVisible(columnRef.current);
    if (history.jump(visible ?? shown, target)) show(target);
  };
  return {
    clearPending: () => {
      setPending(undefined);
    },
    controls: viewing ? (
      <HistoryControls
        canBack={history.canBack}
        canForward={history.canForward}
        onBack={() => {
          follow(history.back(), false);
        }}
        onForward={() => {
          follow(history.forward(), false);
        }}
      />
    ) : null,
    page:
      viewing && shown !== undefined && pageCount !== undefined ? (
        <GoToPage page={shown} pageCount={pageCount} onJump={jump} />
      ) : null,
  };
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
