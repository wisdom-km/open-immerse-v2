import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeEach, expect, it, vi } from "vitest";

import {
  openFileEvent,
  viewBilingualEvent,
  viewOriginalEvent,
  viewTranslationEvent,
} from "../src/main/library-menu.js";
import { startLibrary } from "../src/main/library-wiring.js";

type FakeItem = {
  id?: string;
  label?: string;
  type?: string;
  checked?: boolean;
  click?: () => void | Promise<void>;
  submenu?: { items: FakeItem[] };
  role?: string;
};

type FakeMenu = { items: FakeItem[] };

type Mode =
  | "live"
  | "no-getter"
  | "throw-getter"
  | "other-object"
  | "empty"
  | "drop-slot"
  | "checkbox"
  | "checked"
  | "throw-set";

const control = vi.hoisted(() => ({
  wait: Promise.resolve() as Promise<void>,
  task: Promise.resolve() as Promise<void>,
  noteNone: 0,
  destroyed: 0,
  postChecks: 0,
  rejectWith: null as Error | null,
}));

const shell = vi.hoisted(() => ({
  mode: "live" as Mode,
  template: { items: [] } as FakeMenu,
  built: { items: [] } as FakeMenu,
  current: { items: [] } as FakeMenu,
  scripts: [] as string[],
  quits: [] as Array<() => void>,
  windows: true,
  rejectScript: false,
  sets: 0,
}));

vi.mock("../src/main/view-menu-gate.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/main/view-menu-gate.js")>();
  return {
    ...actual,
    createViewMenuGate(ports: Parameters<typeof actual.createViewMenuGate>[0]) {
      const gate = actual.createViewMenuGate({
        ...ports,
        postCheck: () =>
          control.wait.then(() => {
            control.postChecks += 1;
            return ports.postCheck();
          }),
      });
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
        submit(shape: Parameters<typeof gate.submit>[0], mark: string) {
          if (control.rejectWith !== null) {
            const task = Promise.reject(control.rejectWith);
            control.task = task;
            return task;
          }
          const task = gate.submit(shape, mark);
          control.task = task;
          return task;
        },
        noteNone(mark: string) {
          control.noteNone += 1;
          return gate.noteNone(mark);
        },
        click: (event: string) => gate.click(event),
        setDestroyed(destroyed: boolean) {
          control.destroyed += 1;
          gate.setDestroyed(destroyed);
        },
      };
    },
  };
});

vi.mock("electron", () => ({
  app: {
    on(event: string, listener: () => void) {
      if (event === "will-quit") shell.quits.push(listener);
    },
  },
  BrowserWindow: {
    getAllWindows: () => (shell.windows ? [windowStub()] : []),
  },
  dialog: {},
  Menu: {
    buildFromTemplate(template: readonly TemplateEntry[]) {
      shell.template = fullMenu(template);
      shell.built = shell.mode === "empty" ? { items: [] } : shell.template;
      return shell.built;
    },
    setApplicationMenu(menu: FakeMenu) {
      shell.sets += 1;
      if (shell.mode === "throw-set") throw new Error("set failed");
      shell.current = menu;
    },
    get getApplicationMenu() {
      if (shell.mode === "no-getter") return undefined;
      return () => {
        if (shell.mode === "throw-getter") throw new Error("getter failed");
        if (shell.mode === "other-object") return impostor();
        return shell.current;
      };
    },
  },
  protocol: { handle() {} },
}));

beforeEach(() => {
  control.wait = Promise.resolve();
  control.task = Promise.resolve();
  control.noteNone = 0;
  control.destroyed = 0;
  control.postChecks = 0;
  control.rejectWith = null;
  shell.mode = "live";
  shell.template = { items: [] };
  shell.built = { items: [] };
  shell.current = { items: [] };
  shell.scripts = [];
  shell.quits = [];
  shell.windows = true;
  shell.rejectScript = false;
  shell.sets = 0;
});

it("returns the command map before postCheck and installs plain none", async () => {
  const started = boot();
  try {
    expect(started.handlers.has("library.list")).toBe(true);
    expect(shell.sets).toBe(1);
    expect(control.postChecks).toBe(0);
    expect(shell.current).toBe(shell.built);
    expect(plainSlots(shell.current).map((item) => item.label)).toEqual([
      "原文",
      "对照",
      "译文",
    ]);
    await control.task;
    expect(control.postChecks).toBe(1);
    expect(control.noteNone).toBe(0);
    expect(control.destroyed).toBe(0);
  } finally {
    started.close();
  }
});

it("sends the three view clicks through the gate and leaves other items on dispatch", async () => {
  const started = boot();
  try {
    await control.task;
    await click("原文");
    await click("对照");
    await click("译文");
    expect(shell.scripts).toEqual([
      scriptFor(viewOriginalEvent),
      scriptFor(viewBilingualEvent),
      scriptFor(viewTranslationEvent),
    ]);
    expect(
      plainSlots(shell.current).every((item) => item.checked === false),
    ).toBe(true);
    const sets = shell.sets;
    await click("打开…");
    await click("后退");
    expect(shell.sets).toBe(sets);
    expect(shell.scripts.at(-2)).toBe(scriptFor(openFileEvent));
    expect(shell.scripts.at(-1)).toContain("oi-history-back");
  } finally {
    started.close();
  }
});

it("does not dispatch an early click and does not replay it", async () => {
  const hold = deferred();
  control.wait = hold.promise;
  const started = boot();
  try {
    expect(shell.sets).toBe(1);
    await click("对照");
    expect(shell.scripts).toEqual([]);
    hold.resolve();
    await control.task;
    expect(shell.scripts).toEqual([]);
    await click("对照");
    expect(shell.scripts).toEqual([scriptFor(viewBilingualEvent)]);
  } finally {
    started.close();
  }
});

it("does not treat a failed startup menu as known", async () => {
  for (const mode of [
    "empty",
    "drop-slot",
    "checkbox",
    "checked",
    "throw-getter",
    "no-getter",
    "other-object",
    "throw-set",
  ] as const) {
    shell.mode = mode;
    shell.sets = 0;
    shell.scripts = [];
    const started = boot();
    try {
      await expectHandled();
      await control.task;
      await click("原文");
      expect(shell.scripts).toEqual([]);
    } finally {
      started.close();
    }
  }
});

it("catches a rejected install task from startLibrary", async () => {
  control.rejectWith = new Error("install task rejected");
  const started = boot();
  try {
    expect(started.handlers.has("library.list")).toBe(true);
    expect(shell.sets).toBe(0);
    await expectHandled();
  } finally {
    started.close();
  }
});

it("keeps a view click quiet when executeJavaScript rejects and when no window exists", async () => {
  const started = boot();
  try {
    await control.task;
    shell.rejectScript = true;
    await click("译文");
    expect(shell.scripts).toEqual([scriptFor(viewTranslationEvent)]);
    shell.windows = false;
    shell.scripts = [];
    const sets = shell.sets;
    await click("原文");
    expect(shell.sets).toBe(sets + 1);
    expect(shell.scripts).toEqual([]);
  } finally {
    started.close();
  }
});

it("does not push the gate when the library quit listener runs", async () => {
  const started = boot();
  try {
    await control.task;
    const quits = shell.quits.splice(0);
    for (const quit of quits) quit();
    expect(control.destroyed).toBe(0);
    await click("对照");
    expect(shell.scripts).toEqual([scriptFor(viewBilingualEvent)]);
  } finally {
    started.close();
  }
});

function boot(): {
  handlers: ReturnType<typeof startLibrary>;
  close: () => void;
} {
  const root = mkdtempSync(path.join(tmpdir(), "oitest-view-menu-"));
  const handlers = startLibrary(path.join(root, "data"));
  return {
    handlers,
    close() {
      for (const quit of shell.quits.splice(0)) quit();
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function click(label: string): Promise<void> {
  const found = walk(shell.template).find((item) => item.label === label);
  if (found?.click === undefined) throw new Error(label);
  return Promise.resolve(found.click());
}

function plainSlots(menu: FakeMenu): readonly FakeItem[] {
  return walk(menu).filter((item) => item.id?.startsWith("oi-view-"));
}

function walk(menu: FakeMenu): FakeItem[] {
  const found: FakeItem[] = [];
  for (const item of menu.items) {
    found.push(item);
    if (item.submenu !== undefined) found.push(...walk(item.submenu));
  }
  return found;
}

function scriptFor(eventName: string): string {
  return `window.dispatchEvent(new Event(${JSON.stringify(eventName)}))`;
}

async function expectHandled(): Promise<void> {
  let unhandled = false;
  const onUnhandled = () => {
    unhandled = true;
  };
  process.on("unhandledRejection", onUnhandled);
  await new Promise((resolve) => setImmediate(resolve));
  process.off("unhandledRejection", onUnhandled);
  expect(unhandled).toBe(false);
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: (value?: void) => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve: () => resolve() };
}

function windowStub(): {
  webContents: { executeJavaScript: (script: string) => Promise<void> };
} {
  return {
    webContents: {
      executeJavaScript(script: string) {
        shell.scripts.push(script);
        if (shell.rejectScript) return Promise.reject(new Error("js rejected"));
        return Promise.resolve();
      },
    },
  };
}

type TemplateEntry = {
  readonly role?: string;
  readonly label?: string;
  readonly submenu?: readonly TemplateItem[];
};

type TemplateItem = {
  readonly id?: string;
  readonly label?: string;
  readonly type?: string;
  readonly checked?: boolean;
  readonly click?: () => void | Promise<void>;
};

function fullMenu(template: readonly TemplateEntry[]): FakeMenu {
  return { items: template.map((entry) => shapeEntry(entry)) };
}

function shapeEntry(entry: TemplateEntry): FakeItem {
  if (entry.role !== undefined) return { role: entry.role };
  const submenu = entry.submenu ?? [];
  const shaped: FakeItem = {
    submenu: {
      items: submenu
        .map((item) => shapeItem(item))
        .filter(
          (item) =>
            shell.mode !== "drop-slot" || item.id !== viewTranslationEvent,
        ),
    },
  };
  if (entry.label !== undefined) shaped.label = entry.label;
  return shaped;
}

function shapeItem(item: TemplateItem): FakeItem {
  const view = item.id?.startsWith("oi-view-") === true;
  const shaped: FakeItem = {
    type:
      shell.mode === "checkbox" && view ? "checkbox" : (item.type ?? "normal"),
    checked: shell.mode === "checked" && view ? true : (item.checked ?? false),
  };
  if (item.id !== undefined) shaped.id = item.id;
  if (item.label !== undefined) shaped.label = item.label;
  if (item.click !== undefined) shaped.click = item.click;
  return shaped;
}

function impostor(): FakeMenu {
  return {
    items: [
      { id: viewOriginalEvent, label: "原文", type: "normal", checked: false },
      { id: viewBilingualEvent, label: "对照", type: "normal", checked: false },
      {
        id: viewTranslationEvent,
        label: "译文",
        type: "normal",
        checked: false,
      },
    ],
  };
}
