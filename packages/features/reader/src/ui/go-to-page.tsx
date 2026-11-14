import { useEffect, useRef, useState, type ReactElement } from "react";

import { clampPage } from "../pure.js";
import {
  GO_TO_PAGE_EVENT,
  HISTORY_BACK_EVENT,
  HISTORY_FORWARD_EVENT,
  pageCountNote,
  pageLabel,
} from "./copy.js";

export function GoToPage(props: {
  readonly page: number;
  readonly pageCount: number;
  readonly onJump: (page: number) => void;
}): ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const open = () => {
      setDraft(String(props.page));
      setNote(undefined);
      setEditing(true);
    };
    window.addEventListener(GO_TO_PAGE_EVENT, open);
    return () => {
      window.removeEventListener(GO_TO_PAGE_EVENT, open);
    };
  }, [props.page]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  const name = `转到页码，${pageLabel(props.page, props.pageCount)}`;
  if (!editing) {
    return (
      <button
        type="button"
        className="oi-reader-pages"
        aria-label={name}
        onClick={() => {
          window.dispatchEvent(new Event(GO_TO_PAGE_EVENT));
        }}
      >
        {pageLabel(props.page, props.pageCount)}
      </button>
    );
  }
  const close = (): void => {
    setEditing(false);
    setNote(undefined);
  };
  const commit = (): void => {
    const trimmed = draft.trim();
    const parsed = /^[0-9]+$/.test(trimmed) ? Number(trimmed) : undefined;
    if (
      trimmed === "" ||
      (parsed !== undefined && clampPage(parsed, props.pageCount) === parsed)
    ) {
      close();
      if (parsed !== undefined) props.onJump(parsed);
      return;
    }
    setNote(pageCountNote(props.pageCount));
  };
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
          if (event.key !== "Escape" && event.key !== "Enter") return;
          event.preventDefault();
          if (event.key === "Enter") commit();
          else close();
        }}
        onBlur={close}
      />
      {note === undefined ? null : <span role="status">{note}</span>}
    </span>
  );
}

export function useNavCommands(
  viewing: boolean,
  commands: { readonly back: () => void; readonly forward: () => void },
): void {
  const ref = useRef({ viewing, commands });
  ref.current = { viewing, commands };
  useEffect(() => {
    const rows = [
      [HISTORY_BACK_EVENT, false, "back"],
      [HISTORY_FORWARD_EVENT, true, "forward"],
    ] as const;
    const offs = rows.map(([name, onlyView, key]) => {
      const handler = () => {
        if (!onlyView || ref.current.viewing) ref.current.commands[key]();
      };
      window.addEventListener(name, handler);
      return () => {
        window.removeEventListener(name, handler);
      };
    });
    return () => {
      for (const off of offs) off();
    };
  }, []);
}
