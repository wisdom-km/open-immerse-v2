import { useEffect, useRef, useState, type ReactElement } from "react";

import { clampPage } from "../pure.js";
import { pageCountNote, pageLabel } from "./copy.js";

export function GoToPage(props: {
  readonly page: number;
  readonly pageCount: number;
  readonly onJump: (page: number) => void;
}): ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const restore = useRef(false);
  const name = `转到页码，${pageLabel(props.page, props.pageCount)}`;
  useEffect(() => {
    if (!editing) {
      if (restore.current) buttonRef.current?.focus();
      restore.current = false;
      return;
    }
    restore.current = true;
    inputRef.current?.focus();
  }, [editing]);
  const close = (): void => {
    setEditing(false);
    setNote(undefined);
  };
  if (!editing) {
    return (
      <button
        ref={buttonRef}
        type="button"
        className="oi-reader-pages"
        aria-label={name}
        onClick={() => {
          setDraft(String(props.page));
          setNote(undefined);
          setEditing(true);
        }}
      >
        {pageLabel(props.page, props.pageCount)}
      </button>
    );
  }
  return (
    <span className="oi-reader-goto">
      <input
        ref={inputRef}
        aria-label={name}
        inputMode="numeric"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setNote(undefined);
        }}
        onKeyDown={(event) => {
          onFieldKey(
            event,
            draft,
            props.pageCount,
            props.onJump,
            close,
            setNote,
          );
        }}
        onBlur={close}
      />
      {note === undefined ? null : <span role="status">{note}</span>}
    </span>
  );
}

function onFieldKey(
  event: { key: string; preventDefault: () => void },
  draft: string,
  pageCount: number,
  onJump: (page: number) => void,
  close: () => void,
  setNote: (note: string) => void,
): void {
  if (event.key !== "Escape" && event.key !== "Enter") return;
  event.preventDefault();
  if (event.key === "Escape") {
    close();
    return;
  }
  const trimmed = draft.trim();
  const parsed = /^[0-9]+$/.test(trimmed) ? Number(trimmed) : undefined;
  const accepted =
    parsed !== undefined && clampPage(parsed, pageCount) === parsed;
  if (trimmed !== "" && !accepted) {
    setNote(pageCountNote(pageCount));
    return;
  }
  close();
  if (parsed !== undefined && accepted) onJump(parsed);
}
