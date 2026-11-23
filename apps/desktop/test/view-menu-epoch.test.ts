import { expect, it, vi } from "vitest";

import { createMainWindow } from "../src/main/window.js";
import {
  blankViewMenuSlot,
  createViewMenuEpoch,
  reduceViewMenuSlot,
} from "../src/main/view-menu-epoch.js";

const probe = vi.hoisted(() => ({ menu: 0, sawListener: false }));

vi.mock("electron", () => {
  class BrowserWindow {
    webContents = new Contents();
    on(name: string, listener: Listener): void {
      this.webContents.on(name, listener);
    }
    loadURL(): void {
      const list = this.webContents.list("did-navigate");
      probe.sawListener = list.length > 0;
      for (const listener of list) {
        listener({}, "oi-app://app/index.html", -1, "");
      }
    }
  }
  class Contents {
    id = 7;
    private listeners = new Map<string, Listener[]>();
    on(name: string, listener: Listener): void {
      const list = this.listeners.get(name) ?? [];
      list.push(listener);
      this.listeners.set(name, list);
    }
    list(name: string): Listener[] {
      return this.listeners.get(name) ?? [];
    }
    setWindowOpenHandler(): void {}
  }
  return {
    BrowserWindow,
    Menu: {
      setApplicationMenu() {
        probe.menu += 1;
      },
    },
  };
});

type Listener = (...args: unknown[]) => void;

const appUrl = "oi-app://app/index.html";

function host(id = 4) {
  const names: string[] = [];
  const map = new Map<string, Listener>();
  const on = (name: string, listener: Listener) => {
    names.push(name);
    map.set(name, listener);
  };
  const win = { webContents: { id, on }, on };
  return { win, names, map };
}

function emit(map: Map<string, Listener>, name: string, ...args: unknown[]) {
  map.get(name)?.(...args);
}

it("starts without a slot", () => {
  const epoch = createViewMenuEpoch();
  expect(epoch.read(4)).toBeUndefined();
  expect(probe.menu).toBe(0);
});

it("keeps the first blank unpublished", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, "about:blank");
  expect(epoch.read(4)).toEqual(blankViewMenuSlot());
  expect(page.names).not.toContain("did-finish-load");
  expect(page.names).not.toContain("did-fail-load");
});

it("opens on a committed oi-app navigate before finish", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl, -1, "");
  expect(epoch.read(4)).toEqual({ phase: "open", epoch: 1, floor: 0 });
  emit(page.map, "did-finish-load");
  expect(epoch.read(4)?.phase).toBe("open");
  expect(epoch.read(4)?.epoch).toBe(1);
});

it("retires a blank only after a document was open", () => {
  const before = createViewMenuEpoch();
  const early = host();
  before.attach(early.win as never);
  emit(early.map, "did-navigate", {}, "about:blank");
  expect(before.read(4)?.phase).toBe("unpublished");
  const after = createViewMenuEpoch();
  const page = host();
  after.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "did-navigate", {}, "about:blank");
  emit(page.map, "did-navigate", {}, "about:blank");
  expect(after.read(4)).toEqual({ phase: "retired", epoch: 1, floor: 0 });
});

it("does not republish when finish follows a provisional failure", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "did-fail-provisional-load", {}, -3, "err", appUrl, true);
  expect(epoch.read(4)?.phase).toBe("retired");
  emit(page.map, "did-finish-load");
  expect(epoch.read(4)).toEqual({ phase: "retired", epoch: 1, floor: 0 });
});

it("ignores a subframe provisional failure", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "did-fail-provisional-load", {}, -3, "err", appUrl, false);
  expect(epoch.read(4)?.phase).toBe("open");
});

it("leaves the slot unchanged when a cancel emits did-fail-load", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "did-fail-load", {}, -3, "aborted", appUrl, true);
  expect(page.names).not.toContain("did-fail-load");
  expect(epoch.read(4)).toEqual({ phase: "open", epoch: 1, floor: 0 });
});

it("does not change generation on a same-document navigation", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "did-navigate-in-page", {}, appUrl, true, 1, 1);
  expect(epoch.read(4)).toEqual({ phase: "open", epoch: 1, floor: 0 });
});

it("opens again after retire when a later oi-app navigate commits", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "render-process-gone", {}, { reason: "crashed" });
  expect(epoch.read(4)?.phase).toBe("retired");
  emit(page.map, "did-navigate", {}, appUrl);
  expect(epoch.read(4)).toEqual({ phase: "open", epoch: 2, floor: 0 });
});

it("retires at the safe integer limit without wrapping", () => {
  const next = reduceViewMenuSlot(
    { phase: "open", epoch: Number.MAX_SAFE_INTEGER, floor: 4 },
    { kind: "navigate", url: appUrl },
  );
  expect(next).toEqual({
    phase: "retired",
    epoch: Number.MAX_SAFE_INTEGER,
    floor: 4,
  });
});

it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1])(
  "retires illegal epoch %s and does not take the increment",
  (epoch) => {
    const next = reduceViewMenuSlot(
      { phase: "open", epoch, floor: 4 },
      { kind: "navigate", url: appUrl },
    );
    expect(next.phase).toBe("retired");
    expect(next.epoch).toBe(epoch);
    expect(next.floor).toBe(4);
    expect(next).not.toEqual({
      phase: "open",
      epoch: epoch + 1,
      floor: 0,
    });
  },
);

it("drops the readable slot on closed and does not rebuild it", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "closed");
  expect(epoch.read(4)).toBeUndefined();
  emit(page.map, "did-navigate", {}, appUrl);
  expect(epoch.read(4)).toBeUndefined();
  expect(probe.menu).toBe(0);
});

it("registers handlers before attached and ignores a duplicate attach", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  const seen: string[] = [];
  epoch.subscribe(() => {
    seen.push("attached");
    expect(page.names).toContain("did-navigate");
    expect(page.names).toContain("closed");
  });
  epoch.attach(page.win as never);
  epoch.attach(page.win as never);
  expect(seen).toEqual(["attached"]);
  expect(page.names.filter((name) => name === "did-navigate")).toHaveLength(1);
  expect(page.names.filter((name) => name === "closed")).toHaveLength(1);
});

it("rejects a sealed reattach without another attached notice", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  const seen: string[] = [];
  epoch.subscribe((notice) => {
    seen.push(notice.kind);
  });
  epoch.attach(page.win as never);
  const names = page.names.length;
  emit(page.map, "closed");
  epoch.attach(page.win as never);
  expect(epoch.read(4)).toBeUndefined();
  expect(page.names).toHaveLength(names);
  expect(seen.filter((kind) => kind === "attached")).toEqual(["attached"]);
});

it("flushes one closed notice when close happens during attached", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  let windowClosed = 0;
  const seen: string[] = [];
  epoch.subscribe((notice) => {
    seen.push(notice.kind);
    if (notice.kind !== "attached") return;
    windowClosed += 1;
    emit(page.map, "closed");
  });
  epoch.attach(page.win as never);
  expect(windowClosed).toBe(1);
  expect(seen.filter((kind) => kind === "closed")).toHaveLength(2);
  emit(page.map, "closed");
  expect(seen.filter((kind) => kind === "closed")).toHaveLength(2);
  expect(epoch.read(4)).toBeUndefined();
});

it("still flushes closed when an attached listener throws", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  const seen: string[] = [];
  epoch.subscribe((notice) => {
    if (notice.kind === "attached") {
      emit(page.map, "closed");
      throw new Error("listener failed");
    }
    seen.push(notice.kind);
  });
  epoch.subscribe((notice) => {
    seen.push(notice.kind);
  });
  expect(() => {
    epoch.attach(page.win as never);
  }).not.toThrow();
  expect(seen.filter((kind) => kind === "attached")).toEqual(["attached"]);
  expect(
    seen.filter((kind) => kind === "closed").length,
  ).toBeGreaterThanOrEqual(2);
  expect(probe.menu).toBe(0);
});

it("does not announce a menu slot for the initial provisional failure", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  const seen: string[] = [];
  epoch.subscribe((notice) => {
    seen.push(notice.kind);
  });
  epoch.attach(page.win as never);
  emit(page.map, "did-fail-provisional-load", {}, -3, "err", appUrl, true);
  expect(epoch.read(4)).toEqual({ phase: "retired", epoch: 0, floor: 0 });
  expect(seen).toEqual(["attached"]);
});

it("does not announce a menu slot for the initial renderer gone", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  const seen: string[] = [];
  epoch.subscribe((notice) => {
    seen.push(notice.kind);
  });
  epoch.attach(page.win as never);
  emit(page.map, "render-process-gone", {}, { reason: "crashed" });
  expect(epoch.read(4)).toEqual({ phase: "retired", epoch: 0, floor: 0 });
  expect(seen).toEqual(["attached"]);
});

it("announces open and later retired slots", () => {
  const epoch = createViewMenuEpoch();
  const page = host();
  const seen: string[] = [];
  epoch.subscribe((notice) => {
    if (notice.kind === "slot") {
      seen.push(`${notice.phase}:${String(notice.epoch)}`);
    }
  });
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  emit(page.map, "did-navigate-in-page", {}, appUrl, true);
  emit(page.map, "did-navigate", {}, "about:blank");
  expect(seen).toEqual(["open:1", "retired:1"]);
});

it("attaches before loadURL so the first commit is open", () => {
  const epoch = createViewMenuEpoch();
  createMainWindow(epoch);
  expect(probe.sawListener).toBe(true);
  expect(epoch.read(7)).toEqual({ phase: "open", epoch: 1, floor: 0 });
  expect(probe.menu).toBe(0);
});

function openReader(id = 4) {
  const epoch = createViewMenuEpoch();
  const page = host(id);
  const notices: string[] = [];
  epoch.subscribe((notice) => {
    notices.push(notice.kind);
  });
  epoch.attach(page.win as never);
  emit(page.map, "did-navigate", {}, appUrl);
  notices.length = 0;
  return { epoch, page, notices };
}

function floorOf(
  id: number,
  generation: number,
  mode: "none" | "original" | "contrast" | "translation" = "original",
) {
  return {
    senderWebContentsId: id,
    epoch: 1,
    generation,
    mode,
    soleWindow: () => id,
    seal: () => ({
      mode,
      generation,
      mark: `${String(id)}:open:1`,
    }),
  };
}

it("writes the floor only after the seal matches and does not announce", () => {
  const reader = openReader();
  const record = reader.epoch.commitFloor(floorOf(4, 3));
  expect(record).toEqual({
    mode: "original",
    epoch: 1,
    generation: 3,
    mark: "4:open:1",
  });
  expect(reader.epoch.read(4)).toEqual({ phase: "open", epoch: 1, floor: 3 });
  expect(reader.notices).toEqual([]);
  expect(reader.epoch.commitFloor(floorOf(4, 3))).toBeUndefined();
  expect(reader.epoch.read(4)?.floor).toBe(3);
});

it("rejects an equal or older generation before writing", () => {
  const reader = openReader();
  expect(reader.epoch.commitFloor(floorOf(4, 2))).toMatchObject({
    generation: 2,
  });
  let seals = 0;
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 2),
      seal: () => {
        seals += 1;
        return { mode: "original", generation: 2, mark: "4:open:1" };
      },
    }),
  ).toBeUndefined();
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      seal: () => {
        seals += 1;
        return { mode: "original", generation: 1, mark: "4:open:1" };
      },
    }),
  ).toBeUndefined();
  expect(seals).toBe(0);
  expect(reader.epoch.read(4)?.floor).toBe(2);
});

it("rejects the wrong window, a throwing probe, or a seal that does not match", () => {
  const reader = openReader();
  let seals = 0;
  const countSeal = () => {
    seals += 1;
    return { mode: "original", generation: 1, mark: "4:open:1" };
  };
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      soleWindow: () => 9,
      seal: countSeal,
    }),
  ).toBeUndefined();
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      soleWindow: () => undefined,
      seal: countSeal,
    }),
  ).toBeUndefined();
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      soleWindow: () => {
        throw new Error("windows");
      },
      seal: countSeal,
    }),
  ).toBeUndefined();
  expect(seals).toBe(0);
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      seal: () => undefined,
    }),
  ).toBeUndefined();
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      seal: () => {
        throw new Error("seal");
      },
    }),
  ).toBeUndefined();
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      seal: () => ({ mode: "contrast", generation: 1, mark: "4:open:1" }),
    }),
  ).toBeUndefined();
  expect(
    reader.epoch.commitFloor({
      ...floorOf(4, 1),
      epoch: 2,
      seal: () => ({ mode: "original", generation: 1, mark: "4:open:2" }),
    }),
  ).toBeUndefined();
  expect(reader.epoch.read(4)?.floor).toBe(0);
  expect(reader.notices).toEqual([]);
});

it("does not write a retired, closed, or previous generation", () => {
  const retired = openReader();
  expect(retired.epoch.commitFloor(floorOf(4, 4))?.generation).toBe(4);
  emit(retired.page.map, "render-process-gone");
  expect(retired.epoch.read(4)).toEqual({
    phase: "retired",
    epoch: 1,
    floor: 4,
  });
  expect(retired.epoch.commitFloor(floorOf(4, 5))).toBeUndefined();
  expect(retired.epoch.read(4)?.floor).toBe(4);

  const closed = openReader();
  emit(closed.page.map, "closed");
  expect(closed.epoch.read(4)).toBeUndefined();
  expect(closed.epoch.commitFloor(floorOf(4, 1))).toBeUndefined();

  const next = openReader();
  expect(next.epoch.commitFloor(floorOf(4, 6))?.generation).toBe(6);
  emit(next.page.map, "did-navigate", {}, appUrl);
  expect(next.epoch.read(4)).toEqual({ phase: "open", epoch: 2, floor: 0 });
  expect(next.epoch.commitFloor(floorOf(4, 7))).toBeUndefined();
  expect(next.epoch.read(4)?.floor).toBe(0);
});
