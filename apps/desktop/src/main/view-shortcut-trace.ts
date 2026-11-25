import {
  viewBilingualEvent,
  viewOriginalEvent,
  viewTranslationEvent,
} from "./library-menu.js";

export const viewShortcutReasons = [
  "destroyed",
  "busy",
  "pending",
  "uncommitted",
  "event-absent",
  "replace-threw",
  "replace-stale",
  "post-check-threw",
  "post-check-false",
  "committed-mismatch",
  "install-unknown",
  "mark-changed",
  "dispatch-threw",
  "destroyed-after-dispatch",
  "pending-budget",
  "pending-after",
  "accepted",
  "click-rejected",
] as const;

export type ViewShortcutReason = (typeof viewShortcutReasons)[number];

export type ViewShortcutSlot = "original" | "contrast" | "translation";

export type ViewShortcutWriter = (line: string) => boolean;

export type ViewShortcutTrace = {
  arm(): void;
  click(event: string): void;
  gate(event: string, result: 0 | 1, reason: string): number | undefined;
  markClosed(): boolean;
};

const reasonSet: ReadonlySet<string> = new Set(viewShortcutReasons);

export function createViewShortcutTrace(
  write: ViewShortcutWriter = writeStdout,
): ViewShortcutTrace {
  let next = 1;
  let dropped = 0;
  let armed = false;
  let closed = false;

  const emit = (fields: Readonly<Record<string, string | number>>): {
    readonly n: number;
    readonly ok: boolean;
  } => {
    const n = next;
    next += 1;
    let ok = false;
    try {
      ok = write(`${JSON.stringify({ n, ...fields })}\n`) === true;
    } catch {
      ok = false;
    }
    if (!ok) dropped += 1;
    return { n, ok };
  };

  return {
    arm() {
      if (armed) return;
      armed = true;
      emit({ step: "armed" });
    },
    click(event) {
      const slot = slotOf(event);
      if (slot === undefined) return;
      emit({ step: "click", slot });
    },
    gate(event, result, reason) {
      const slot = slotOf(event);
      if (slot === undefined || !reasonSet.has(reason)) return undefined;
      if (result !== 0 && result !== 1) return undefined;
      return emit({ step: "gate", slot, result, reason }).n;
    },
    markClosed() {
      if (closed) return true;
      const written = emit({ step: "closed", dropped });
      if (!written.ok) return false;
      closed = true;
      return true;
    },
  };
}

function slotOf(event: string): ViewShortcutSlot | undefined {
  if (event === viewOriginalEvent) return "original";
  if (event === viewBilingualEvent) return "contrast";
  if (event === viewTranslationEvent) return "translation";
  return undefined;
}

function writeStdout(line: string): boolean {
  return process.stdout.write(line);
}
