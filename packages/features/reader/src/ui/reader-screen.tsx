import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import {
  BACK_LABEL,
  BACK_TOOLTIP,
  ERROR_TITLE,
  LOST_PLACE,
  pageLabel,
} from "./copy.js";
import { GoToPage, type GoToHandle } from "./go-to-page.js";
import { HistoryControls } from "./history-controls.js";
import { PageColumn } from "./page-column.js";
import type { PdfPaint, ReaderClient } from "./reader-client.js";
import { navCommands, useBoundNav, type ReaderNav } from "./use-bound-nav.js";
import { usePositionHistory } from "./use-position-history.js";
import { useReaderLeave } from "./use-reader-leave.js";
import { useReaderSession } from "./use-reader-session.js";
import { useViewMode, type ReaderViewMode } from "./use-view-mode.js";
import { useZoom } from "./use-zoom.js";
import { ViewModeEmpty } from "./view-mode-empty.js";
import { selectViewMode, ViewModePanes } from "./view-mode-panes.js";
import { ViewModeSwitch } from "./view-mode-switch.js";
import { ZoomControls } from "./zoom-controls.js";

const SKELETON_MS = 200;
export function ReaderScreen(props: {
  readonly id: string;
  readonly title: string;
  readonly client: ReaderClient;
  readonly onLeave: () => void;
  readonly onBindLeave?:
    | ((leave: (() => void) | undefined) => void)
    | undefined;
  readonly onBindNav?: ((nav: ReaderNav | undefined) => void) | undefined;
  readonly onReportView?: (mode: ReaderViewMode) => void;
}): ReactElement {
  const session = useReaderSession(props.client, props.id, props.onLeave);
  const leaving = useReaderLeave(session.leave, props.onBindLeave);
  const view = useViewMode(props.id);
  const reportView = props.onReportView;
  const chooseView = useCallback(
    (mode: ReaderViewMode) => {
      selectViewMode(mode, view.select);
      reportView?.(mode);
    },
    [view.select, reportView],
  );
  const modeRef = useRef(view.mode);
  modeRef.current = view.mode;
  useLayoutEffect(() => {
    reportView?.(modeRef.current);
  }, [props.id, reportView]);
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
  const zoom = useZoom(viewing, props.id, session);
  const openGoTo = useRef<GoToHandle | undefined>(undefined);
  const bindOpen = useCallback((handle: GoToHandle | undefined) => {
    openGoTo.current = handle;
  }, []);
  useBoundNav(
    props.onBindNav,
    navCommands(nav, leaving.leave, openGoTo, zoom.commands, {
      viewOriginal() {
        chooseView("original");
      },
      viewContrast() {
        chooseView("contrast");
      },
      viewTranslation() {
        chooseView("translation");
      },
    }),
  );
  return (
    <section className="oi-reader" aria-label={props.title}>
      <ReaderBar
        title={props.title}
        leave={leaving.leave}
        viewing={viewing}
        pageCount={reading?.pageCount}
        lostPlace={session.lostPlace}
        fallbackPage={session.shownPage}
        nav={nav}
        onBindOpen={bindOpen}
        zoom={zoom}
        mode={view.mode}
        onView={chooseView}
      />
      <ReaderBody
        mode={view.mode}
        onView={chooseView}
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
        boxes={reading?.boxes}
        zoom={zoom.ratio}
        releasePixels={leaving.releasePixels}
        onLeave={leaving.leave}
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
  readonly onBindOpen: (handle: GoToHandle | undefined) => void;
  readonly zoom: ReturnType<typeof useZoom>;
  readonly mode: ReaderViewMode;
  readonly onView: (mode: ReaderViewMode) => void;
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
        onBindOpen={props.onBindOpen}
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
      <p className="oi-reader-live" role="status">
        {props.nav.spoken}
      </p>
      <ZoomControls active={props.viewing} zoom={props.zoom} controls={false} />
      {props.lostPlace ? (
        <p className="oi-reader-status" role="status">
          {LOST_PLACE}
        </p>
      ) : null}
      <span className="oi-reader-gap" />
      <ZoomControls active={props.viewing} zoom={props.zoom} status={false} />
      <span className="oi-reader-chip" />
      <ViewModeSwitch mode={props.mode} onSelect={props.onView} />
    </header>
  );
}

function ReaderBody(props: {
  readonly mode: ReaderViewMode;
  readonly onView: (mode: ReaderViewMode) => void;
  readonly loading: boolean;
  readonly sentence: string | undefined;
  readonly page: number | undefined;
  readonly pageCount: number | undefined;
  readonly columnRef: { readonly current: HTMLDivElement | null };
  readonly onScroll: () => void;
  readonly onScrollEnd: () => void;
  readonly paint: PdfPaint | undefined;
  readonly zoom: number;
  readonly cancel: ((canvas: HTMLCanvasElement) => void) | undefined;
  readonly boxes: readonly { width: number; height: number }[] | undefined;
  readonly releasePixels: { current: boolean };
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
    <ViewModePanes
      mode={props.mode}
      column={
        <PageColumn
          page={props.page}
          pageCount={props.pageCount}
          columnRef={props.columnRef}
          onScroll={props.onScroll}
          onScrollEnd={props.onScrollEnd}
          paint={props.paint}
          cancel={props.cancel}
          boxes={props.boxes}
          zoom={props.zoom}
          releasePixels={props.releasePixels}
        />
      }
      empty={
        <ViewModeEmpty
          onOriginal={() => {
            props.onView("original");
          }}
        />
      }
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
