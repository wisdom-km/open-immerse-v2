import { expect, it } from "vitest";

import { createViewMenuHandler } from "../src/main/view-menu-handler.js";
import { createViewMenuEpoch } from "../src/main/view-menu-epoch.js";
import { createViewMenuGate } from "../src/main/view-menu-gate.js";
import {
  viewSlotDescriptions,
  type ViewShape,
} from "../src/main/view-menu-mirror.js";

type Listener = (...args: unknown[]) => void;

function host(id: number) {
  const map = new Map<string, Listener>();
  const on = (name: string, listener: Listener) => {
    map.set(name, listener);
  };
  return {
    win: { webContents: { id, on }, on },
    emit(name: string, ...args: unknown[]) {
      map.get(name)?.(...args);
    },
  };
}

function openEpoch(id = 4) {
  const epoch = createViewMenuEpoch();
  const page = host(id);
  epoch.attach(page.win as never);
  page.emit("did-navigate", {}, "oi-app://app/index.html");
  return { epoch, page };
}

function harness(sole: () => number | undefined = () => 4) {
  const replaces: ViewShape[] = [];
  let release = (): void => undefined;
  let hold = false;
  const gate = createViewMenuGate({
    replace: (descriptions) => {
      const shape = descriptions.some((slot) => "type" in slot)
        ? checkedShape(descriptions)
        : "none";
      replaces.push(shape);
      if (!hold) return undefined;
      return new Promise<void>((done) => {
        release = done;
      });
    },
    postCheck: () => true,
    dispatch: () => undefined,
  });
  const { epoch, page } = openEpoch();
  const handler = createViewMenuHandler({
    epoch,
    gate,
    soleWindow: sole,
  });
  return {
    epoch,
    page,
    gate,
    handler,
    replaces,
    holdNext() {
      hold = true;
    },
    release() {
      const done = release;
      hold = false;
      done();
    },
  };
}

function checkedShape(
  descriptions: readonly { event: string; checked?: boolean }[],
): ViewShape {
  const hit = descriptions.find((slot) => slot.checked === true);
  if (hit?.event.endsWith("original")) return "original";
  if (hit?.event.endsWith("bilingual")) return "contrast";
  return "translation";
}

function context(id = 4) {
  return { requestId: "r", senderWebContentsId: id };
}

it("reads the open epoch without touching the menu or the floor", async () => {
  const box = harness();
  await expect(box.handler({ op: "read" }, context())).resolves.toEqual({
    ok: true,
    value: { epoch: 1 },
  });
  expect(box.replaces).toEqual([]);
  expect(box.epoch.read(4)?.floor).toBe(0);
  expect(box.gate.committed).toBeNull();
});

it("rejects a read or submit from the wrong window before any replace", async () => {
  const box = harness(() => 9);
  await expect(box.handler({ op: "read" }, context())).resolves.toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  await expect(
    box.handler(submit("original", 1, 1), context()),
  ).resolves.toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  expect(box.replaces).toEqual([]);
  expect(box.epoch.read(4)?.floor).toBe(0);
});

it("accepts one submit and then rejects the same generation", async () => {
  const box = harness();
  await expect(
    box.handler(submit("original", 1, 1), context()),
  ).resolves.toEqual({ ok: true, value: { epoch: 1 } });
  expect(box.epoch.read(4)).toEqual({ phase: "open", epoch: 1, floor: 1 });
  expect(box.gate.committed).toBe("original");
  expect(box.gate.install).toBe("known");
  expect(box.replaces).toEqual(["original"]);
  const seen = box.replaces.length;
  await expect(
    box.handler(submit("original", 1, 1), context()),
  ).resolves.toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  expect(box.replaces).toHaveLength(seen);
  expect(box.epoch.read(4)?.floor).toBe(1);
});

it("rejects a busy same-value submit without taking the first acceptance", async () => {
  const box = harness();
  box.holdNext();
  const first = box.handler(submit("original", 1, 2), context());
  await waitFor(box.replaces, 1);
  const second = await box.handler(submit("original", 1, 2), context());
  expect(second).toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  expect(box.replaces).toEqual(["original"]);
  box.release();
  await expect(first).resolves.toEqual({ ok: true, value: { epoch: 1 } });
  expect(box.epoch.read(4)?.floor).toBe(2);
  expect(box.gate.committed).toBe("original");
  expect(box.replaces).toEqual(["original"]);
});

it("rejects invalid numbers before replace and keeps the floor", async () => {
  const box = harness();
  for (const generation of [0, 1.5, Number.NaN]) {
    await expect(
      box.handler(submit("original", 1, generation), context()),
    ).resolves.toEqual({
      ok: false,
      error: { code: "invalid_payload", retryable: false },
    });
  }
  await expect(
    box.handler(submit("original", 0, 1), context()),
  ).resolves.toEqual({
    ok: false,
    error: { code: "invalid_payload", retryable: false },
  });
  expect(box.replaces).toEqual([]);
  expect(box.epoch.read(4)?.floor).toBe(0);
});

it("rejects a retired, closed, or old epoch without replacing the menu", async () => {
  const retired = harness();
  retired.page.emit("did-navigate", {}, "about:blank");
  await expect(
    retired.handler(submit("contrast", 1, 1), context()),
  ).resolves.toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  expect(retired.replaces).toEqual([]);
  expect(retired.epoch.read(4)?.phase).toBe("retired");

  const closed = harness();
  closed.page.emit("closed");
  await expect(
    closed.handler(submit("original", 1, 1), context()),
  ).resolves.toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  expect(closed.replaces).toEqual([]);
  expect(closed.epoch.read(4)).toBeUndefined();

  const stale = harness();
  stale.page.emit("did-navigate", {}, "oi-app://app/index.html");
  await expect(
    stale.handler(submit("original", 1, 1), context()),
  ).resolves.toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  expect(stale.replaces).toEqual([]);
  expect(stale.epoch.read(4)).toEqual({ phase: "open", epoch: 2, floor: 0 });
});

it("does not treat a known none repair as this submit", async () => {
  const box = harness();
  const replaces: ViewShape[] = [];
  const racing = createViewMenuGate({
    replace: async (descriptions) => {
      replaces.push(shapeOf(descriptions));
      if (shapeOf(descriptions) === "original") {
        await racing.noteNone("4:open:1");
      }
    },
    postCheck: () => true,
    dispatch: () => undefined,
  });
  const handler = createViewMenuHandler({
    epoch: box.epoch,
    gate: racing,
    soleWindow: () => 4,
  });
  await expect(handler(submit("original", 1, 1), context())).resolves.toEqual({
    ok: false,
    error: { code: "rejected", retryable: false },
  });
  expect(box.epoch.read(4)?.floor).toBe(0);
  expect(racing.committed).toBe("none");
  expect(racing.install).toBe("known");
  expect(replaces).toEqual(["original", "none"]);
});

function submit(mode: string, epoch: number, generation: number) {
  return { op: "submit", mode, epoch, generation };
}

function shapeOf(
  descriptions: ReturnType<typeof viewSlotDescriptions>,
): ViewShape {
  const hit = descriptions.find((slot) => "checked" in slot && slot.checked);
  if (hit === undefined) return "none";
  if (hit.event.endsWith("original")) return "original";
  if (hit.event.endsWith("bilingual")) return "contrast";
  return "translation";
}

async function waitFor(replaces: readonly ViewShape[], count: number) {
  for (let i = 0; i < 20 && replaces.length < count; i += 1) {
    await Promise.resolve();
  }
  expect(replaces).toHaveLength(count);
}
