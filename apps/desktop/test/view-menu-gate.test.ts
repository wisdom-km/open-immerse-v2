import { expect, it } from "vitest";

import { viewOriginalEvent } from "../src/main/library-menu.js";
import {
  createViewMenuGate,
  type StageMark,
  type ViewMenuCandidateGate,
} from "../src/main/view-menu-gate.js";
import {
  viewSlotDescriptions,
  type ViewShape,
  type ViewSlotDescription,
} from "../src/main/view-menu-mirror.js";

type FailMode = "throw" | "reject";

type ReplaceScript = {
  onReplace?: (
    descriptions: readonly ViewSlotDescription[],
    index: number,
  ) => Promise<void>;
  fail?: (
    descriptions: readonly ViewSlotDescription[],
    index: number,
  ) => FailMode | undefined;
  postCheck?: (
    descriptions: readonly ViewSlotDescription[],
    index: number,
  ) => boolean;
  onPostCheck?: (
    descriptions: readonly ViewSlotDescription[],
    index: number,
  ) => void | Promise<void>;
  onDispatch?: (event: string) => void | Promise<void>;
};

type Opened = {
  readonly gate: ViewMenuCandidateGate;
  readonly calls: ViewSlotDescription[][];
  readonly dispatches: string[];
};

function openGate(script: ReplaceScript = {}): Opened {
  const calls: ViewSlotDescription[][] = [];
  const dispatches: string[] = [];
  const gate = createViewMenuGate({
    replace: async (descriptions) => {
      const copy = descriptions.map((slot) => ({ ...slot }));
      calls.push(copy);
      const index = calls.length;
      if (script.onReplace) await script.onReplace(copy, index);
      const mode = script.fail?.(copy, index);
      if (mode === "throw") throw new Error("replace failed");
      if (mode === "reject") {
        await Promise.reject(new Error("replace rejected"));
      }
    },
    postCheck: async () => {
      const last = calls.at(-1);
      const index = calls.length;
      if (last && script.onPostCheck) await script.onPostCheck(last, index);
      if (!last || !script.postCheck) return true;
      return script.postCheck(last, index);
    },
    dispatch: async (event) => {
      dispatches.push(event);
      if (script.onDispatch) await script.onDispatch(event);
    },
  });
  return { gate, calls, dispatches };
}

function same(
  descriptions: readonly ViewSlotDescription[],
  shape: ViewShape,
): boolean {
  const expected = viewSlotDescriptions(shape);
  if (descriptions.length !== expected.length) return false;
  return descriptions.every((slot, index) => {
    const other = expected[index];
    if (!other) return false;
    if (slot.label !== other.label || slot.event !== other.event) return false;
    if ("type" in slot !== "type" in other) return false;
    if ("type" in slot && "type" in other) {
      return slot.checked === other.checked;
    }
    return true;
  });
}

function checkedEvent(shape: ViewShape): string {
  const slot = viewSlotDescriptions(shape).find(
    (item) => "checked" in item && item.checked,
  );
  if (!slot) throw new Error(`no checked slot for ${shape}`);
  return slot.event;
}

async function acceptShape(
  opened: Opened,
  shape: Exclude<ViewShape, "none">,
  mark: StageMark,
): Promise<void> {
  await opened.gate.submit(shape, mark);
  expect(opened.gate.committed).toBe(shape);
  expect(opened.gate.install).toBe("known");
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions(shape));
}

it("B3 commits the consumed pending none as known when the snapshot replace succeeds", async () => {
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "contrast")) await opened.gate.noteNone("s");
    },
  });
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  await opened.gate.submit("contrast", "s");
  expect(opened.calls.length - before).toBe(2);
  expect(opened.calls.at(-2)).toEqual(viewSlotDescriptions("contrast"));
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

it("B4 commits the consumed pending none as known when the snapshot replace throws", async () => {
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "contrast")) await opened.gate.noteNone("s");
    },
    fail: (descriptions) =>
      same(descriptions, "contrast") ? "throw" : undefined,
  });
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  await expect(opened.gate.submit("contrast", "s")).resolves.toBeUndefined();
  expect(opened.calls.length - before).toBe(2);
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.committed).not.toBe("contrast");
  expect(opened.gate.install).toBe("known");
  await acceptShape(opened, "original", "s");
});

it("B5 commits the consumed pending none as known when the snapshot post-check fails", async () => {
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "contrast")) await opened.gate.noteNone("s");
    },
    postCheck: (descriptions) => !same(descriptions, "contrast"),
  });
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  await opened.gate.submit("contrast", "s");
  expect(opened.calls.length - before).toBe(2);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
});

it("B6 keeps the latest pending unknown and lets the next event consume it", async () => {
  let sawExtra = false;
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "contrast")) await opened.gate.noteNone("s");
      if (same(descriptions, "none") && !sawExtra) {
        sawExtra = true;
        await opened.gate.noteNone("s2");
      }
    },
  });
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  await opened.gate.submit("contrast", "s");
  expect(opened.calls.length - before).toBe(2);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("unknown");
  expect(opened.gate.pendingMark).toBe("s2");
  const held = opened.calls.length;
  await opened.gate.noteNone("s2");
  expect(opened.calls.length - held).toBe(1);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

it("B7 clears the same-mark pending and replaces only contrast", async () => {
  const opened = await leavePending();
  const before = opened.calls.length;
  await opened.gate.submit("contrast", "s2");
  expect(opened.calls.length - before).toBe(1);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("contrast"));
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

it("B8 does not commit the old snapshot when a newer none arrives during replace", async () => {
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "contrast")) await opened.gate.noteNone("next");
    },
    postCheck: (descriptions) => !same(descriptions, "contrast"),
  });
  await acceptShape(opened, "original", "old");
  const before = opened.calls.length;
  await opened.gate.submit("contrast", "old");
  expect(opened.calls.length - before).toBe(2);
  expect(opened.calls.at(-2)).toEqual(viewSlotDescriptions("contrast"));
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.committed).not.toBe("contrast");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

it("B9 does not replace when the window is already destroyed", async () => {
  const opened = openGate();
  await acceptShape(opened, "original", "s");
  const calls = opened.calls.length;
  const committed = opened.gate.committed;
  const install = opened.gate.install;
  opened.gate.setDestroyed(true);
  await opened.gate.submit("contrast", "s");
  await opened.gate.noteNone("s");
  expect(await opened.gate.click(checkedEvent("original"))).toBe(0);
  expect(opened.calls.length).toBe(calls);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe(committed);
  expect(opened.gate.install).toBe(install);
});

it("B10 dispatches nothing while the gate is busy and does not cover pending", async () => {
  let clickResult = -1;
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (!same(descriptions, "contrast")) return;
      await opened.gate.noteNone("s");
      clickResult = await opened.gate.click(checkedEvent("translation"));
      expect(opened.gate.pendingMark).toBe("s");
    },
  });
  await acceptShape(opened, "original", "s");
  await opened.gate.submit("contrast", "s");
  expect(clickResult).toBe(0);
  expect(opened.dispatches).toEqual([]);
});

it("B10 dispatches the checked event once when an idle rebuild succeeds", async () => {
  const opened = openGate();
  await acceptShape(opened, "contrast", "s");
  const before = opened.calls.length;
  expect(await opened.gate.click(checkedEvent("contrast"))).toBe(1);
  expect(opened.calls.length - before).toBe(1);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("contrast"));
  expect(opened.dispatches).toEqual([checkedEvent("contrast")]);
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("known");
});

it("B10 dispatches nothing when the idle rebuild throws", async () => {
  let armed = false;
  const opened = openGate({
    fail: (descriptions) =>
      armed && same(descriptions, "contrast") ? "throw" : undefined,
  });
  await acceptShape(opened, "contrast", "s");
  armed = true;
  const before = opened.calls.length;
  expect(await opened.gate.click(checkedEvent("contrast"))).toBe(0);
  expect(opened.calls.length - before).toBe(1);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("unknown");
});

it("B10 dispatches nothing when the idle rebuild post-check fails", async () => {
  let armed = false;
  const opened = openGate({
    postCheck: (descriptions) => !(armed && same(descriptions, "contrast")),
  });
  await acceptShape(opened, "contrast", "s");
  armed = true;
  expect(await opened.gate.click(checkedEvent("contrast"))).toBe(0);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("unknown");
});

it("B10 dispatches nothing when pending changes the mirror during rebuild", async () => {
  let armed = false;
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (armed && same(descriptions, "contrast")) {
        await opened.gate.noteNone("s");
      }
    },
  });
  await acceptShape(opened, "contrast", "s");
  armed = true;
  const before = opened.calls.length;
  expect(await opened.gate.click(checkedEvent("translation"))).toBe(0);
  expect(opened.calls.length - before).toBe(2);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
});

it("B10 catches a rejected replace promise from an idle rebuild", async () => {
  let armed = false;
  const opened = openGate({
    fail: (descriptions) =>
      armed && same(descriptions, "contrast") ? "reject" : undefined,
  });
  await acceptShape(opened, "contrast", "s");
  armed = true;
  await expect(opened.gate.click(checkedEvent("contrast"))).resolves.toBe(0);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("unknown");
});

it("dispatches the requested event when it differs from the committed mirror", async () => {
  const opened = openGate();
  await acceptShape(opened, "original", "s");
  const requested = checkedEvent("translation");
  const before = opened.calls.length;
  expect(await opened.gate.click(requested)).toBe(1);
  expect(opened.calls.length - before).toBe(1);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("original"));
  expect(opened.dispatches).toEqual([requested]);
  expect(requested).not.toBe(checkedEvent("original"));
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("known");
});

it("does not dispatch the requested event when the idle rebuild throws", async () => {
  let armed = false;
  const opened = openGate({
    fail: (descriptions) =>
      armed && same(descriptions, "original") ? "throw" : undefined,
  });
  await acceptShape(opened, "original", "s");
  armed = true;
  expect(await opened.gate.click(checkedEvent("translation"))).toBe(0);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("unknown");
});

it("does not dispatch an event that is absent from the committed mirror", async () => {
  const opened = openGate();
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  expect(await opened.gate.click("not-a-view-event")).toBe(0);
  expect(opened.calls.length).toBe(before);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("known");
});

it("installs none noted while a resolved dispatch is still waiting", async () => {
  const opened = openGate({
    onDispatch: async (event) => {
      expect(event).toBe(checkedEvent("translation"));
      await opened.gate.noteNone("next");
    },
  });
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  expect(await opened.gate.click(checkedEvent("translation"))).toBe(1);
  expect(opened.calls.length - before).toBe(2);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.dispatches).toEqual([checkedEvent("translation")]);
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

it("installs none noted while a rejected dispatch is still waiting", async () => {
  const opened = openGate({
    onDispatch: async () => {
      await opened.gate.noteNone("next");
      await Promise.reject(new Error("executeJavaScript rejected"));
    },
  });
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  await expect(opened.gate.click(checkedEvent("translation"))).resolves.toBe(0);
  expect(opened.calls.length - before).toBe(2);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.dispatches).toEqual([checkedEvent("translation")]);
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
  await acceptShape(opened, "contrast", "later");
});

it("keeps the newest pending unknown when none changes again during dispatch closeout", async () => {
  let sawNone = false;
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "none") && !sawNone) {
        sawNone = true;
        await opened.gate.noteNone("s2");
      }
    },
    onDispatch: async () => {
      await opened.gate.noteNone("s");
    },
  });
  await acceptShape(opened, "original", "s");
  const before = opened.calls.length;
  expect(await opened.gate.click(checkedEvent("translation"))).toBe(0);
  expect(opened.calls.length - before).toBe(2);
  expect(opened.dispatches).toEqual([checkedEvent("translation")]);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("unknown");
  expect(opened.gate.pendingMark).toBe("s2");
  const held = opened.calls.length;
  await opened.gate.noteNone("s2");
  expect(opened.calls.length - held).toBe(1);
  expect(opened.calls.at(-1)).toEqual(viewSlotDescriptions("none"));
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

it("does not dispatch when the window is destroyed during the rebuild post-check", async () => {
  let arm = false;
  const opened = openGate({
    onPostCheck: (descriptions) => {
      if (arm && same(descriptions, "original")) opened.gate.setDestroyed(true);
    },
  });
  await acceptShape(opened, "original", "s");
  arm = true;
  const before = opened.calls.length;
  expect(await opened.gate.click(checkedEvent("translation"))).toBe(0);
  expect(opened.calls.length - before).toBe(1);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("known");
  opened.gate.setDestroyed(false);
  await acceptShape(opened, "contrast", "later");
});

it("does not dispatch when the window is destroyed during the extra none post-check", async () => {
  let arm = false;
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (arm && same(descriptions, "contrast"))
        await opened.gate.noteNone("s");
    },
    onPostCheck: (descriptions) => {
      if (arm && same(descriptions, "none")) opened.gate.setDestroyed(true);
    },
  });
  await acceptShape(opened, "contrast", "s");
  arm = true;
  const before = opened.calls.length;
  expect(await opened.gate.click(checkedEvent("translation"))).toBe(0);
  expect(opened.calls.length - before).toBe(2);
  expect(opened.dispatches).toEqual([]);
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("known");
  opened.gate.setDestroyed(false);
  await acceptShape(opened, "original", "later");
});

it("B10 catches a rejected dispatch promise and accepts the next snapshot", async () => {
  const opened = openGate({
    onDispatch: async () => {
      await Promise.reject(new Error("executeJavaScript rejected"));
    },
  });
  await acceptShape(opened, "original", "s");
  await expect(opened.gate.click(checkedEvent("translation"))).resolves.toBe(0);
  expect(opened.dispatches).toEqual([checkedEvent("translation")]);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("known");
  await acceptShape(opened, "contrast", "later");
});

it("keeps the observation fields readonly from the outside", () => {
  const opened = openGate();
  expect(() => {
    (opened.gate as { committed: ViewShape | null }).committed = "none";
  }).toThrow(TypeError);
  expect(opened.gate.committed).toBeNull();
  expect(opened.gate.install).toBe("unknown");
});

it("B10 catches a synchronous dispatch throw and accepts the next snapshot", async () => {
  const opened = openGate({
    onDispatch: () => {
      throw new Error("dispatch threw");
    },
  });
  await acceptShape(opened, "contrast", "s");
  await expect(opened.gate.click(checkedEvent("original"))).resolves.toBe(0);
  expect(opened.dispatches).toEqual([checkedEvent("original")]);
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("known");
  await acceptShape(opened, "translation", "later");
});

it("N6 returns 0 when a newer none becomes known during the click post-check", async () => {
  let phase = "install";
  const opened = openGate({
    onPostCheck: () => {
      if (phase !== "click") return;
      phase = "repair";
      void opened.gate.noteNone("B");
    },
  });
  await opened.gate.noteNone("A");
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  phase = "click";
  const before = opened.calls.length;
  await expect(opened.gate.click(viewOriginalEvent)).resolves.toBe(0);
  expect(opened.dispatches).toEqual([]);
  expect(opened.calls.length - before).toBe(2);
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

it("N7 keeps the newest pending unknown when none changes during the repair", async () => {
  let posts = 0;
  const opened = openGate({
    onPostCheck: () => {
      posts += 1;
      if (posts === 2) void opened.gate.noteNone("B");
      if (posts === 3) void opened.gate.noteNone("C");
    },
  });
  await opened.gate.noteNone("A");
  const before = opened.calls.length;
  await expect(opened.gate.click(viewOriginalEvent)).resolves.toBe(0);
  expect(opened.dispatches).toEqual([]);
  expect(opened.calls.length - before).toBe(2);
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("unknown");
  expect(opened.gate.pendingMark).toBe("C");
});

it("N8 keeps the port call when the mark changes after dispatch has started", async () => {
  const opened = openGate({
    onDispatch: () => {
      void opened.gate.noteNone("B");
    },
  });
  await opened.gate.noteNone("A");
  await expect(opened.gate.click(viewOriginalEvent)).resolves.toBe(1);
  expect(opened.dispatches).toEqual([viewOriginalEvent]);
  expect(opened.gate.install).toBe("known");
  expect(opened.gate.pendingMark).toBeNull();
});

async function leavePending(): Promise<Opened> {
  let sawExtra = false;
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "translation")) await opened.gate.noteNone("s");
      if (same(descriptions, "none") && !sawExtra) {
        sawExtra = true;
        await opened.gate.noteNone("s2");
      }
    },
  });
  await acceptShape(opened, "original", "s");
  await opened.gate.submit("translation", "s");
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("unknown");
  expect(opened.gate.pendingMark).toBe("s2");
  return opened;
}

function candidateInput<T>(
  accept: () => T | undefined,
  shape: ViewShape = "original",
  generation = 1,
  mark = "4:open:1",
) {
  return {
    shape,
    mark,
    generation,
    stillEligible: () => true,
    accept,
  };
}

it("returns the acceptance only from the call that armed the seal", async () => {
  let release = (): void => undefined;
  const entered = deferred();
  const opened = openGate({
    onReplace: () => {
      entered.resolve();
      return new Promise<void>((done) => {
        release = done;
      });
    },
  });
  let firstAccepts = 0;
  const first = opened.gate.submitCandidate(
    candidateInput(() => {
      firstAccepts += 1;
      return { who: "A" };
    }),
  );
  await entered.promise;
  let secondAccepts = 0;
  const second = opened.gate.submitCandidate(
    candidateInput(() => {
      secondAccepts += 1;
      return { who: "B" };
    }),
  );
  await expect(second).resolves.toBeUndefined();
  expect(secondAccepts).toBe(0);
  expect(opened.calls).toHaveLength(1);
  release();
  await expect(first).resolves.toEqual({ who: "A" });
  expect(firstAccepts).toBe(1);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("known");
  expect(opened.calls).toHaveLength(1);
});

it("does not call accept when postCheck fails and restores the previous shape", async () => {
  const opened = openGate({
    postCheck: (descriptions) => !same(descriptions, "contrast"),
  });
  await acceptShape(opened, "original", "s");
  let accepts = 0;
  const before = opened.calls.length;
  await expect(
    opened.gate.submitCandidate({
      ...candidateInput(() => {
        accepts += 1;
        return { ok: true };
      }, "contrast"),
      mark: "s",
    }),
  ).resolves.toBeUndefined();
  expect(accepts).toBe(0);
  expect(opened.calls.length - before).toBe(1);
  expect(opened.gate.committed).toBe("original");
  expect(opened.gate.install).toBe("unknown");
});

it("leaves a winning pending none in place when the submit is superseded", async () => {
  const opened = openGate({
    onReplace: async (descriptions) => {
      if (same(descriptions, "original")) await opened.gate.noteNone("m");
    },
  });
  let accepts = 0;
  await expect(
    opened.gate.submitCandidate(
      candidateInput(
        () => {
          accepts += 1;
          return { ok: true };
        },
        "original",
        2,
        "m",
      ),
    ),
  ).resolves.toBeUndefined();
  expect(accepts).toBe(0);
  expect(opened.gate.committed).toBe("none");
  expect(opened.gate.install).toBe("known");
  const later = await opened.gate.submitCandidate(
    candidateInput(() => ({ ok: true }), "contrast", 3, "later"),
  );
  expect(later).toEqual({ ok: true });
  expect(opened.gate.committed).toBe("contrast");
  expect(opened.gate.install).toBe("known");
});

it("rolls back only the call whose seal is still current when accept fails", async () => {
  const opened = openGate();
  await expect(
    opened.gate.submitCandidate(candidateInput(() => undefined)),
  ).resolves.toBeUndefined();
  expect(opened.gate.committed).toBeNull();
  expect(opened.gate.install).toBe("unknown");
  const kept = await opened.gate.submitCandidate(
    candidateInput(() => ({ ok: true }), "translation", 4, "keep"),
  );
  expect(kept).toEqual({ ok: true });
  expect(opened.gate.committed).toBe("translation");
  await expect(
    opened.gate.submitCandidate({
      ...candidateInput(() => {
        throw new Error("floor");
      }, "contrast"),
      mark: "keep",
      generation: 5,
    }),
  ).resolves.toBeUndefined();
  expect(opened.gate.committed).toBe("translation");
  expect(opened.gate.install).toBe("unknown");
});

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let finish = (): void => undefined;
  const promise = new Promise<void>((done) => {
    finish = done;
  });
  return {
    promise,
    resolve() {
      finish();
    },
  };
}
