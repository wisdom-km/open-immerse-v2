import { LibraryApp } from "@oi/feature-library/app";
import { ReaderScreen } from "@oi/feature-reader/ui";
import { useEffect, useRef, useState, type ReactElement } from "react";

import { openFileEvent, returnLibraryEvent } from "../main/library-menu.js";
import { desktopReaderClient } from "./reader-client.js";

const client = desktopReaderClient();

export function Shell(): ReactElement {
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const leaveRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => blockLibraryInput(openId !== undefined), [openId]);
  useEffect(() => {
    const onReturn = () => {
      leaveRef.current?.();
    };
    window.addEventListener(returnLibraryEvent, onReturn);
    return () => {
      window.removeEventListener(returnLibraryEvent, onReturn);
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
          onBindLeave={(leave) => {
            leaveRef.current = leave;
          }}
          onLeave={() => {
            leaveRef.current = undefined;
            setOpenId(undefined);
          }}
        />
      )}
    </>
  );
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
