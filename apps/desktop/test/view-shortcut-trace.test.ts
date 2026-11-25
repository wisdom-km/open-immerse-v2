import { expect, it } from "vitest";

import { viewOriginalEvent } from "../src/main/library-menu.js";
import {
  createViewShortcutTrace,
  type ViewShortcutWriter,
} from "../src/main/view-shortcut-trace.js";

type Line = {
  readonly n: number;
  readonly step: string;
  readonly slot?: string;
  readonly result?: number;
  readonly reason?: string;
  readonly dropped?: number;
};

function open(write: ViewShortcutWriter): {
  readonly lines: Line[];
  readonly trace: ReturnType<typeof createViewShortcutTrace>;
} {
  const lines: Line[] = [];
  const trace = createViewShortcutTrace((line) => {
    lines.push(JSON.parse(line) as Line);
    return write(line);
  });
  return { lines, trace };
}

it("does not write a line for an unknown event or reason", () => {
  const seen = open(() => true);
  seen.trace.click("oi-zoom-in");
  expect(seen.trace.gate("oi-zoom-in", 0, "destroyed")).toBeUndefined();
  expect(seen.trace.gate(viewOriginalEvent, 0, "not-a-reason")).toBeUndefined();
  expect(seen.lines).toEqual([]);
  expect(seen.trace.gate(viewOriginalEvent, 0, "busy")).toBe(1);
  expect(seen.lines).toEqual([
    { n: 1, step: "gate", slot: "original", result: 0, reason: "busy" },
  ]);
});

it("returns the chosen n when the writer throws", () => {
  const attempts: Line[] = [];
  let fail = true;
  const trace = createViewShortcutTrace((line) => {
    attempts.push(JSON.parse(line) as Line);
    if (!fail) return true;
    fail = false;
    throw new Error("write failed");
  });
  expect(trace.gate(viewOriginalEvent, 0, "destroyed")).toBe(1);
  expect(attempts[0]).toEqual({
    n: 1,
    step: "gate",
    slot: "original",
    result: 0,
    reason: "destroyed",
  });
  expect(trace.gate(viewOriginalEvent, 1, "accepted")).toBe(2);
  expect(trace.markClosed()).toBe(true);
  expect(attempts.at(-1)).toEqual({ n: 3, step: "closed", dropped: 1 });
});

it("retries closed after a false write and then stops", () => {
  let fail = true;
  const attempts: string[] = [];
  const trace = createViewShortcutTrace((line) => {
    attempts.push(line);
    if (!fail) return true;
    fail = false;
    return false;
  });
  expect(trace.markClosed()).toBe(false);
  expect(trace.markClosed()).toBe(true);
  expect(trace.markClosed()).toBe(true);
  expect(attempts).toHaveLength(2);
  expect(JSON.parse(attempts[1] ?? "")).toEqual({
    n: 2,
    step: "closed",
    dropped: 1,
  });
});

it("writes armed once and keeps click before a later gate call", () => {
  const seen = open(() => true);
  seen.trace.arm();
  seen.trace.arm();
  seen.trace.click(viewOriginalEvent);
  expect(seen.trace.gate(viewOriginalEvent, 0, "pending")).toBe(3);
  expect(seen.lines.map((line) => line.step)).toEqual([
    "armed",
    "click",
    "gate",
  ]);
  expect(seen.lines.map((line) => line.n)).toEqual([1, 2, 3]);
  expect(seen.lines[1]).toEqual({ n: 2, step: "click", slot: "original" });
});
