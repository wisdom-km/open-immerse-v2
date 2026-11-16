import type { BrowserWindow } from "electron";

export type ViewMenuPhase = "unpublished" | "open" | "retired";

export type ViewMenuSlot = {
  readonly phase: ViewMenuPhase;
  readonly epoch: number;
  readonly floor: number;
};

export type ViewMenuEpoch = {
  readonly attach: (win: BrowserWindow) => void;
  readonly read: (webContentsId: number) => ViewMenuSlot | undefined;
};

type ViewMenuEvent =
  | { readonly kind: "navigate"; readonly url: string }
  | { readonly kind: "same-document" }
  | { readonly kind: "provisional-failure"; readonly isMainFrame: boolean }
  | { readonly kind: "renderer-gone" };

type ListenerArgs = readonly unknown[];

export function createViewMenuEpoch(): ViewMenuEpoch {
  const slots = new Map<number, ViewMenuSlot>();
  return {
    attach(win) {
      attachWindow(slots, win);
    },
    read(webContentsId) {
      return slots.get(webContentsId);
    },
  };
}

export function reduceViewMenuSlot(
  slot: ViewMenuSlot,
  event: ViewMenuEvent,
): ViewMenuSlot {
  switch (event.kind) {
    case "navigate":
      return onNavigate(slot, event.url);
    case "same-document":
      return slot;
    case "provisional-failure":
      return onProvisionalFailure(slot, event.isMainFrame);
    case "renderer-gone":
      return retire(slot);
  }
}

export function blankViewMenuSlot(): ViewMenuSlot {
  return { phase: "unpublished", epoch: 0, floor: 0 };
}

function attachWindow(
  slots: Map<number, ViewMenuSlot>,
  win: BrowserWindow,
): void {
  const id = win.webContents.id;
  win.webContents.on("did-navigate", (_event, url) => {
    store(slots, id, { kind: "navigate", url });
  });
  win.webContents.on("did-navigate-in-page", () => {
    store(slots, id, { kind: "same-document" });
  });
  win.webContents.on("did-fail-provisional-load", (...args: ListenerArgs) => {
    const isMainFrame = args[4];
    if (typeof isMainFrame !== "boolean") {
      return;
    }
    store(slots, id, { kind: "provisional-failure", isMainFrame });
  });
  win.webContents.on("render-process-gone", () => {
    store(slots, id, { kind: "renderer-gone" });
  });
  win.on("closed", () => {
    slots.delete(id);
  });
}

function store(
  slots: Map<number, ViewMenuSlot>,
  id: number,
  event: ViewMenuEvent,
): void {
  const current = slots.get(id) ?? blankViewMenuSlot();
  slots.set(id, reduceViewMenuSlot(current, event));
}

function onNavigate(slot: ViewMenuSlot, url: string): ViewMenuSlot {
  if (!isOiAppUrl(url)) {
    return slot.phase === "open" ? retire(slot) : slot;
  }
  return openNext(slot);
}

function onProvisionalFailure(
  slot: ViewMenuSlot,
  isMainFrame: boolean,
): ViewMenuSlot {
  if (!isMainFrame) {
    return slot;
  }
  return retire(slot);
}

function openNext(slot: ViewMenuSlot): ViewMenuSlot {
  if (!Number.isSafeInteger(slot.epoch) || slot.epoch < 0) {
    return retire(slot);
  }
  if (slot.epoch >= Number.MAX_SAFE_INTEGER) {
    return retire(slot);
  }
  return { phase: "open", epoch: slot.epoch + 1, floor: 0 };
}

function retire(slot: ViewMenuSlot): ViewMenuSlot {
  return { phase: "retired", epoch: slot.epoch, floor: slot.floor };
}

function isOiAppUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "oi-app:";
  } catch {
    return false;
  }
}
