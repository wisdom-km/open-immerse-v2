import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { stderr } from "node:process";

import { beforeEach, expect, it, vi } from "vitest";

import { viewOriginalEvent } from "../src/main/library-menu.js";
import {
  createViewMenuGate,
  type ViewMenuGate,
} from "../src/main/view-menu-gate.js";
import {
  createViewMenuEpoch,
  type ViewMenuEpoch,
} from "../src/main/view-menu-epoch.js";
import { bindViewMenuLifecycle } from "../src/main/view-menu-lifecycle.js";

const boot = vi.hoisted(() => {
  let releaseReady = (): void => undefined;
  const ready = new Promise<void>((done) => {
    releaseReady = done;
  });
  let released = false;
  const state = {
    order: [] as string[],
    notes: [] as string[],
    created: [] as ViewMenuEpoch[],
    logged: [] as Array<ViewMenuEpoch | undefined>,
    attached: [] as ViewMenuEpoch[],
    subscribed: [] as ViewMenuEpoch[],
    ready,
    destroyed: 0,
    menu: 0,
    loadThrows: false,
    userData: "",
    release() {
      if (released) return;
      released = true;
      releaseReady();
    },
  };
  return state;
});

vi.mock("electron", () => ({
  app: {
    getPath() {
      return boot.userData;
    },
    on() {},
    quit() {},
    whenReady() {
      return boot.ready;
    },
  },
  session: {
    defaultSession: {
      setPermissionRequestHandler() {},
      setPermissionCheckHandler() {},
    },
  },
  ipcMain: { handle() {} },
  protocol: {
    registerSchemesAsPrivileged() {},
    handle() {},
  },
  dialog: {},
  BrowserWindow: class {
    webContents = {
      id: 7,
      on(name: string, listener: (...args: unknown[]) => void) {
        const list = this.listeners.get(name) ?? [];
        list.push(listener);
        this.listeners.set(name, list);
      },
      listeners: new Map<string, Array<(...args: unknown[]) => void>>(),
      executeJavaScript() {
        return Promise.resolve();
      },
      setWindowOpenHandler() {},
    };
    on(name: string, listener: (...args: unknown[]) => void) {
      this.webContents.on(name, listener);
    }
    loadURL() {
      boot.order.push("loadURL");
      if (boot.loadThrows) throw new Error("load failed");
      const list = this.webContents.listeners.get("did-navigate") ?? [];
      for (const listener of list) {
        listener({}, "oi-app://app/index.html");
      }
    }
  },
  Menu: {
    buildFromTemplate() {
      return { items: [] };
    },
    setApplicationMenu() {
      boot.menu += 1;
    },
    getApplicationMenu() {
      return undefined;
    },
  },
}));

vi.mock("../src/main/view-menu-epoch.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/main/view-menu-epoch.js")>();
  return {
    ...actual,
    createViewMenuEpoch() {
      const epoch = actual.createViewMenuEpoch();
      const attach = epoch.attach.bind(epoch);
      const subscribe = epoch.subscribe.bind(epoch);
      const wrapped: ViewMenuEpoch = {
        attach(win) {
          boot.order.push("attach");
          boot.attached.push(wrapped);
          attach(win);
        },
        read(id) {
          return epoch.read(id);
        },
        subscribe(listener) {
          boot.order.push("subscribe");
          boot.subscribed.push(wrapped);
          return subscribe(listener);
        },
      };
      boot.created.push(wrapped);
      return wrapped;
    },
  };
});

vi.mock("../src/main/view-menu-gate.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/main/view-menu-gate.js")>();
  return {
    ...actual,
    createViewMenuGate(ports: Parameters<typeof actual.createViewMenuGate>[0]) {
      const gate = actual.createViewMenuGate(ports);
      return {
        get committed() {
          return gate.committed;
        },
        get install() {
          return gate.install;
        },
        get pendingMark() {
          return gate.pendingMark;
        },
        submit: gate.submit.bind(gate),
        click: gate.click.bind(gate),
        noteNone(mark: string) {
          boot.notes.push(mark);
          return gate.noteNone(mark);
        },
        setDestroyed(destroyed: boolean) {
          if (destroyed) boot.destroyed += 1;
          gate.setDestroyed(destroyed);
        },
      };
    },
  };
});

vi.mock("../src/main/composition-root.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/main/composition-root.js")>();
  return {
    ...actual,
    startMainLogger(epoch?: ViewMenuEpoch) {
      boot.logged.push(epoch);
      actual.startMainLogger(epoch);
    },
  };
});

import { startDesktop } from "../src/main/index.js";

const appUrl = "oi-app://app/index.html";

beforeEach(() => {
  boot.order.length = 0;
  boot.notes.length = 0;
  boot.created.length = 0;
  boot.logged.length = 0;
  boot.attached.length = 0;
  boot.subscribed.length = 0;
  boot.destroyed = 0;
  boot.menu = 0;
  boot.loadThrows = false;
  boot.userData = mkdtempSync(path.join(tmpdir(), "oitest-life-"));
});

it("N1 passes one epoch from startup into the logger and the window", () => {
  startDesktop();
  const epoch = boot.created[0];
  expect(boot.created).toHaveLength(1);
  expect(boot.logged[0]).toBe(epoch);
  expect(boot.attached[0]).toBe(epoch);
  expect(boot.subscribed[0]).toBe(epoch);
  expect(epoch?.read(7)).toEqual({ phase: "open", epoch: 1, floor: 0 });
});

it("N2 subscribes before loadURL and notes the first open commit", () => {
  startDesktop();
  expect(boot.order.indexOf("subscribe")).toBeGreaterThanOrEqual(0);
  expect(boot.order.indexOf("subscribe")).toBeLessThan(
    boot.order.indexOf("attach"),
  );
  expect(boot.order.indexOf("attach")).toBeLessThan(
    boot.order.indexOf("loadURL"),
  );
  expect(boot.created[0]?.read(7)?.epoch).toBe(1);
  expect(boot.notes).toEqual(["7:open:1"]);
});

it("reports a synchronous loadURL throw through the ready failure path", async () => {
  boot.loadThrows = true;
  const written: string[] = [];
  const spy = vi.spyOn(stderr, "write").mockImplementation((chunk) => {
    written.push(String(chunk));
    return true;
  });
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason);
  };
  process.on("unhandledRejection", onUnhandled);
  boot.release();
  await new Promise((resolve) => setImmediate(resolve));
  process.off("unhandledRejection", onUnhandled);
  spy.mockRestore();
  expect(written.join("")).toContain("load failed");
  expect(unhandled).toEqual([]);
});

it("N4 ignores an unbound foreign id and still binds the next attached id", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  bindViewMenuLifecycle(epoch, gate.gate);
  const foreign = manualWindow(1.5);
  epoch.attach(foreign.win as never);
  foreign.emit("did-navigate", {}, appUrl);
  foreign.emit("closed");
  expect(gate.notes).toEqual([]);
  expect(gate.destroyed).toBe(0);
  const page = manualWindow(4);
  epoch.attach(page.win as never);
  page.emit("did-navigate", {}, appUrl);
  expect(gate.notes).toEqual(["4:open:1"]);
  page.emit("closed");
  expect(gate.destroyed).toBe(1);
});

it("N4 ignores a different id after the owner is bound", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  bindViewMenuLifecycle(epoch, gate.gate);
  const page = manualWindow(4);
  const other = manualWindow(8);
  epoch.attach(page.win as never);
  epoch.attach(other.win as never);
  other.emit("did-navigate", {}, appUrl);
  other.emit("closed");
  expect(gate.notes).toEqual([]);
  expect(gate.destroyed).toBe(0);
  page.emit("did-navigate", {}, appUrl);
  expect(gate.notes).toEqual(["4:open:1"]);
});

it("N4 skips a stale slot when an earlier listener moves the epoch", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  const page = manualWindow(4);
  epoch.subscribe((notice) => {
    if (notice.kind === "slot" && notice.epoch === 1) {
      page.emit("did-navigate", {}, "about:blank");
    }
  });
  bindViewMenuLifecycle(epoch, gate.gate);
  epoch.attach(page.win as never);
  page.emit("did-navigate", {}, appUrl);
  expect(gate.notes).toEqual(["4:retired:1"]);
});

it("N5 destroys on a slotless closed and ignores a later navigate", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  bindViewMenuLifecycle(epoch, gate.gate);
  const page = manualWindow(4);
  epoch.attach(page.win as never);
  page.emit("closed");
  expect(epoch.read(4)).toBeUndefined();
  expect(gate.destroyed).toBe(1);
  expect(gate.notes).toEqual([]);
  expect(gate.dispatches).toEqual([]);
  page.emit("did-navigate", {}, appUrl);
  expect(epoch.read(4)).toBeUndefined();
  expect(gate.notes).toEqual([]);
  expect(gate.replaces).toBe(0);
});

it("N5 blocks a reentered navigate and still destroys", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  const page = manualWindow(4);
  epoch.subscribe((notice) => {
    if (notice.kind !== "closed") return;
    page.emit("did-navigate", {}, appUrl);
  });
  bindViewMenuLifecycle(epoch, gate.gate);
  epoch.attach(page.win as never);
  page.emit("did-navigate", {}, appUrl);
  expect(gate.notes).toEqual(["4:open:1"]);
  page.emit("closed");
  expect(epoch.read(4)).toBeUndefined();
  expect(gate.destroyed).toBe(1);
  expect(gate.notes).toEqual(["4:open:1"]);
  expect(gate.dispatches).toEqual([]);
  page.emit("did-navigate", {}, appUrl);
  expect(gate.notes).toEqual(["4:open:1"]);
});

it("N5 flushes closed from a leading attached listener before any later menu", async () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  let release = (): void => undefined;
  const hold = new Promise<void>((done) => {
    release = done;
  });
  gate.holdPostCheck = hold;
  const installing = gate.gate.submit("none", "unbound");
  const page = manualWindow(4);
  epoch.subscribe((notice) => {
    if (notice.kind === "attached") page.emit("closed");
  });
  bindViewMenuLifecycle(epoch, gate.gate);
  epoch.attach(page.win as never);
  expect(gate.destroyed).toBe(1);
  expect(gate.notes).toEqual([]);
  const replaces = gate.replaces;
  release();
  await installing;
  expect(gate.destroyed).toBe(1);
  expect(gate.replaces).toBe(replaces);
  await expect(gate.gate.click(viewOriginalEvent)).resolves.toBe(0);
  expect(gate.dispatches).toEqual([]);
});

it("N5 returns 0 for an old click when close reuses the open mark", async () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  bindViewMenuLifecycle(epoch, gate.gate);
  const page = manualWindow(4);
  epoch.attach(page.win as never);
  page.emit("did-navigate", {}, appUrl);
  await new Promise((resolve) => setImmediate(resolve));
  expect(gate.gate.install).toBe("known");
  let release = (): void => undefined;
  const hold = new Promise<void>((done) => {
    release = done;
  });
  gate.holdPostCheck = hold;
  const clicking = gate.gate.click(viewOriginalEvent);
  page.emit("closed");
  page.emit("did-navigate", {}, appUrl);
  expect(epoch.read(4)).toBeUndefined();
  release();
  await expect(clicking).resolves.toBe(0);
  expect(gate.dispatches).toEqual([]);
});

it("N12 keeps the initial provisional failure out of noteNone and still closes", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  bindViewMenuLifecycle(epoch, gate.gate);
  const page = manualWindow(4);
  epoch.attach(page.win as never);
  page.emit("did-fail-provisional-load", {}, -3, "err", appUrl, true);
  expect(epoch.read(4)).toEqual({ phase: "retired", epoch: 0, floor: 0 });
  expect(gate.notes).toEqual([]);
  expect(gate.replaces).toBe(0);
  page.emit("closed");
  expect(gate.destroyed).toBe(1);
  expect(gate.notes).toEqual([]);
  expect(gate.dispatches).toEqual([]);
});

it("N13 keeps the initial renderer gone out of noteNone and still closes", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  bindViewMenuLifecycle(epoch, gate.gate);
  const page = manualWindow(4);
  epoch.attach(page.win as never);
  page.emit("render-process-gone", {}, { reason: "crashed" });
  expect(epoch.read(4)).toEqual({ phase: "retired", epoch: 0, floor: 0 });
  expect(gate.notes).toEqual([]);
  expect(gate.replaces).toBe(0);
  page.emit("closed");
  expect(gate.destroyed).toBe(1);
  expect(gate.notes).toEqual([]);
});

it("observes the original noteNone rejection without a derived rejection", async () => {
  const epoch = createViewMenuEpoch();
  let original = Promise.resolve();
  const gate = {
    committed: null,
    install: "unknown" as const,
    pendingMark: null,
    submit() {
      return Promise.resolve();
    },
    noteNone() {
      original = Promise.reject(new Error("menu failed"));
      return original;
    },
    click() {
      return Promise.resolve(0);
    },
    setDestroyed() {},
  };
  bindViewMenuLifecycle(epoch, gate);
  const page = manualWindow(4);
  epoch.attach(page.win as never);
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason);
  };
  process.on("unhandledRejection", onUnhandled);
  page.emit("did-navigate", {}, appUrl);
  await new Promise((resolve) => setImmediate(resolve));
  process.off("unhandledRejection", onUnhandled);
  expect(unhandled).toEqual([]);
  await expect(original).rejects.toThrow("menu failed");
  expect(gate.install).toBe("unknown");
});

it("N11 does not submit an active view shape", () => {
  const epoch = createViewMenuEpoch();
  const gate = countingGate();
  bindViewMenuLifecycle(epoch, gate.gate);
  const page = manualWindow(4);
  epoch.attach(page.win as never);
  page.emit("did-navigate", {}, appUrl);
  expect(gate.shapes.every((shape) => shape === "none")).toBe(true);
  expect(gate.shapes).not.toContain("active");
});

function countingGate(): {
  gate: ViewMenuGate;
  notes: string[];
  dispatches: string[];
  shapes: string[];
  destroyed: number;
  replaces: number;
  holdPostCheck: Promise<void> | undefined;
} {
  const notes: string[] = [];
  const dispatches: string[] = [];
  const shapes: string[] = [];
  const record = {
    destroyed: 0,
    replaces: 0,
    hold: undefined as Promise<void> | undefined,
  };
  const gate = createViewMenuGate({
    replace(descriptions) {
      record.replaces += 1;
      shapes.push(
        descriptions.some((slot) => "type" in slot) ? "active" : "none",
      );
    },
    async postCheck() {
      if (record.hold) await record.hold;
      return true;
    },
    dispatch(event) {
      dispatches.push(event);
    },
  });
  return {
    gate: {
      get committed() {
        return gate.committed;
      },
      get install() {
        return gate.install;
      },
      get pendingMark() {
        return gate.pendingMark;
      },
      submit(shape, mark) {
        return gate.submit(shape, mark);
      },
      noteNone(mark) {
        notes.push(mark);
        return gate.noteNone(mark);
      },
      click(event) {
        return gate.click(event);
      },
      setDestroyed(destroyed) {
        if (destroyed) record.destroyed += 1;
        gate.setDestroyed(destroyed);
      },
    },
    notes,
    dispatches,
    shapes,
    get destroyed() {
      return record.destroyed;
    },
    get replaces() {
      return record.replaces;
    },
    set holdPostCheck(hold: Promise<void> | undefined) {
      record.hold = hold;
    },
    get holdPostCheck() {
      return record.hold;
    },
  };
}

function manualWindow(id: number): {
  win: { webContents: { id: number; on: On }; on: On };
  emit: (name: string, ...args: unknown[]) => void;
} {
  const map = new Map<string, (...args: unknown[]) => void>();
  const on: On = (name, listener) => {
    map.set(name, listener);
  };
  return {
    win: { webContents: { id, on }, on },
    emit(name, ...args) {
      map.get(name)?.(...args);
    },
  };
}

type On = (name: string, listener: (...args: unknown[]) => void) => void;
