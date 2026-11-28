import { LibraryApp } from "@oi/feature-library/app";
import { ReaderScreen } from "@oi/feature-reader/ui";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { flushSync } from "react-dom";

import { desktopReaderClient } from "./reader-client.js";
import {
  goToPageEvent,
  historyBackEvent,
  historyForwardEvent,
  openFileEvent,
  returnLibraryEvent,
  viewBilingualEvent,
  viewOriginalEvent,
  viewTranslationEvent,
  zoomActualEvent,
  zoomFitWidthEvent,
  zoomInEvent,
  zoomOutEvent,
} from "./shell-events.js";

const client = desktopReaderClient();

type MenuNav = {
  readonly back: () => void;
  readonly forward: () => void;
  readonly openGoTo: () => void;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly zoomActual: () => void;
  readonly zoomFitWidth: () => void;
  readonly viewOriginal: () => void;
  readonly viewContrast: () => void;
  readonly viewTranslation: () => void;
};

export function Shell(): ReactElement {
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const [reportView] = useState(() =>
    createReaderViewReporter(readViewMenuShell),
  );
  const [title, setTitle] = useState("");
  const leaveRef = useRef<(() => void) | undefined>(undefined);
  const navRef = useRef<MenuNav | undefined>(undefined);
  const bindLeave = useCallback((leave: (() => void) | undefined) => {
    leaveRef.current = leave;
  }, []);
  const bindNav = useCallback((nav: MenuNav | undefined) => {
    navRef.current = nav;
  }, []);
  useEffect(() => blockLibraryInput(openId !== undefined), [openId]);
  useEffect(() => {
    const onEvent = (event: Event): void => {
      flushSync(() => {
        menuAction(event.type, leaveRef.current, navRef.current)?.();
      });
    };
    const names = [
      returnLibraryEvent,
      historyBackEvent,
      historyForwardEvent,
      goToPageEvent,
      zoomInEvent,
      zoomOutEvent,
      zoomActualEvent,
      zoomFitWidthEvent,
      viewOriginalEvent,
      viewBilingualEvent,
      viewTranslationEvent,
    ];
    for (const name of names) window.addEventListener(name, onEvent);
    return () => {
      for (const name of names) window.removeEventListener(name, onEvent);
    };
  }, []);
  return (
    <>
      <div inert={openId !== undefined ? true : undefined}>
        <LibraryApp
          onOpen={(id) => {
            setTitle(selectedTitle());
            setOpenId(id);
          }}
        />
      </div>
      {openId === undefined ? null : (
        <ReaderScreen
          id={openId}
          title={title}
          client={client}
          onBindLeave={bindLeave}
          onBindNav={bindNav}
          onReportView={reportView}
          onLeave={() => {
            leaveRef.current = undefined;
            navRef.current = undefined;
            setOpenId(undefined);
          }}
        />
      )}
    </>
  );
}

const zoomActions = {
  [zoomInEvent]: "zoomIn",
  [zoomOutEvent]: "zoomOut",
  [zoomActualEvent]: "zoomActual",
  [zoomFitWidthEvent]: "zoomFitWidth",
} as const;

function menuAction(
  type: string,
  leave: (() => void) | undefined,
  nav: MenuNav | undefined,
): (() => void) | undefined {
  if (type === returnLibraryEvent) return leave;
  if (type === historyBackEvent) return nav?.back;
  if (type === historyForwardEvent) return nav?.forward;
  if (type === goToPageEvent) return nav?.openGoTo;
  return viewCommand(type, nav) ?? zoomCommand(type, nav);
}

const viewActions = {
  [viewOriginalEvent]: "viewOriginal",
  [viewBilingualEvent]: "viewContrast",
  [viewTranslationEvent]: "viewTranslation",
} as const;

function viewCommand(
  type: string,
  nav: MenuNav | undefined,
): (() => void) | undefined {
  if (!Object.hasOwn(viewActions, type)) return undefined;
  return nav?.[viewActions[type as keyof typeof viewActions]];
}

function zoomCommand(
  type: string,
  nav: MenuNav | undefined,
): (() => void) | undefined {
  if (!Object.hasOwn(zoomActions, type)) return undefined;
  return nav?.[zoomActions[type as keyof typeof zoomActions]];
}

function readViewMenuShell(): ViewMenuShell | undefined {
  const host: { oi?: { readonly shell?: ViewMenuShell } } = window;
  return host.oi?.shell;
}

export type ReaderViewSlot = "original" | "contrast" | "translation";

type ViewMenuRead = { readonly op: "read" };

type ViewMenuSubmit = {
  readonly op: "submit";
  readonly mode: ReaderViewSlot;
  readonly epoch: number;
  readonly generation: number;
};

type ViewMenuResult =
  | { readonly ok: true; readonly value: { readonly epoch: number } }
  | { readonly ok: false; readonly error: { readonly code: string } };

type ViewMenuShell = {
  reportViewMenu(input: ViewMenuRead | ViewMenuSubmit): Promise<ViewMenuResult>;
};

export function createReaderViewReporter(
  readShell: () => ViewMenuShell | undefined,
): (mode: ReaderViewSlot) => void {
  let generation = 0;
  let tail: Promise<void> = Promise.resolve();
  return (mode) => {
    generation += 1;
    const issued = generation;
    tail = tail
      .then(() => deliverView(readShell, mode, issued))
      .catch(() => undefined);
  };
}

async function deliverView(
  readShell: () => ViewMenuShell | undefined,
  mode: ReaderViewSlot,
  generation: number,
): Promise<void> {
  const shell = readShell();
  if (shell === undefined) return;
  const read = await shell.reportViewMenu({ op: "read" });
  if (!read.ok) return;
  await shell.reportViewMenu({
    op: "submit",
    mode,
    epoch: read.value.epoch,
    generation,
  });
}

function selectedTitle(): string {
  const cell = document.querySelector("tr[aria-selected='true'] td");
  return cell?.textContent ?? "";
}

function blockLibraryInput(blocked: boolean): () => void {
  if (!blocked) {
    return () => undefined;
  }
  const stop = (event: Event) => {
    event.stopImmediatePropagation();
  };
  window.addEventListener(openFileEvent, stop, true);
  window.addEventListener("dragenter", stop, true);
  window.addEventListener("drop", stop, true);
  window.addEventListener("dragover", stop, true);
  return () => {
    window.removeEventListener(openFileEvent, stop, true);
    window.removeEventListener("dragenter", stop, true);
    window.removeEventListener("drop", stop, true);
    window.removeEventListener("dragover", stop, true);
  };
}
