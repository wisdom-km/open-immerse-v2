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
} from "./shell-events.js";

const client = desktopReaderClient();

type MenuNav = {
  readonly back: () => void;
  readonly forward: () => void;
  readonly openGoTo: () => void;
};

export function Shell(): ReactElement {
  const [openId, setOpenId] = useState<string | undefined>(undefined);
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

function menuAction(
  type: string,
  leave: (() => void) | undefined,
  nav: MenuNav | undefined,
): (() => void) | undefined {
  if (type === returnLibraryEvent) return leave;
  if (type === historyBackEvent) return nav?.back;
  if (type === historyForwardEvent) return nav?.forward;
  if (type === goToPageEvent) return nav?.openGoTo;
  return undefined;
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
