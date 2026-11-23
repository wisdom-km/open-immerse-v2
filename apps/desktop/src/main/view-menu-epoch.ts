import type { BrowserWindow } from "electron";

export type ViewMenuPhase = "unpublished" | "open" | "retired";

export type ViewMenuSlot = {
  readonly phase: ViewMenuPhase;
  readonly epoch: number;
  readonly floor: number;
};

export type ViewMenuNotice =
  | {
      readonly kind: "attached";
      readonly webContentsId: number;
    }
  | {
      readonly kind: "slot";
      readonly webContentsId: number;
      readonly phase: ViewMenuPhase;
      readonly epoch: number;
    }
  | {
      readonly kind: "closed";
      readonly webContentsId: number;
    };

export type ViewMenuEpoch = {
  readonly attach: (win: BrowserWindow) => void;
  readonly read: (webContentsId: number) => ViewMenuSlot | undefined;
  readonly subscribe: (
    listener: (notice: ViewMenuNotice) => void,
  ) => () => void;
};

type ViewMenuEvent =
  | { readonly kind: "navigate"; readonly url: string }
  | { readonly kind: "same-document" }
  | { readonly kind: "provisional-failure"; readonly isMainFrame: boolean }
  | { readonly kind: "renderer-gone" };

type ListenerArgs = readonly unknown[];

type NoticeListener = (notice: ViewMenuNotice) => void;

type SlotEntry = { readonly kind: "slot"; readonly slot: ViewMenuSlot };

type SealedEntry = { readonly kind: "sealed" };

type Entry = SlotEntry | SealedEntry;

type Handshake = {
  publishingAttached: boolean;
  owedClosed: boolean;
};

type HandshakeHolder = {
  current: Handshake | undefined;
};

export function createViewMenuEpoch(): ViewMenuEpoch {
  const entries = new Map<number, Entry>();
  const listeners: NoticeListener[] = [];
  const registered = new Set<number>();
  return {
    attach(win) {
      attachWindow(entries, listeners, registered, win);
    },
    read(webContentsId) {
      return readSlot(entries, webContentsId);
    },
    subscribe(listener) {
      return subscribe(listeners, listener);
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
  entries: Map<number, Entry>,
  listeners: NoticeListener[],
  registered: Set<number>,
  win: BrowserWindow,
): void {
  const id = win.webContents.id;
  if (entries.get(id)?.kind === "sealed") return;
  if (registered.has(id)) return;
  registered.add(id);
  const holder = holdHandshake();
  listen(entries, listeners, holder, win, id);
  finishHandshake(listeners, holder, id);
}

function holdHandshake(): HandshakeHolder {
  return {
    current: { publishingAttached: true, owedClosed: false },
  };
}

function listen(
  entries: Map<number, Entry>,
  listeners: NoticeListener[],
  holder: HandshakeHolder,
  win: BrowserWindow,
  id: number,
): void {
  win.webContents.on("did-navigate", (_event, url) => {
    store(entries, listeners, id, { kind: "navigate", url });
  });
  win.webContents.on("did-navigate-in-page", () => {
    store(entries, listeners, id, { kind: "same-document" });
  });
  win.webContents.on("did-fail-provisional-load", (...args: ListenerArgs) => {
    const isMainFrame = args[4];
    if (typeof isMainFrame !== "boolean") return;
    store(entries, listeners, id, { kind: "provisional-failure", isMainFrame });
  });
  win.webContents.on("render-process-gone", () => {
    store(entries, listeners, id, { kind: "renderer-gone" });
  });
  win.on("closed", () => {
    onWindowClosed(entries, listeners, id, holder.current);
  });
}

function finishHandshake(
  listeners: NoticeListener[],
  holder: HandshakeHolder,
  id: number,
): void {
  try {
    publish(listeners, { kind: "attached", webContentsId: id });
  } finally {
    const owed = holder.current?.owedClosed === true;
    clearHandshake(holder);
    if (owed) publish(listeners, { kind: "closed", webContentsId: id });
  }
}

function clearHandshake(holder: HandshakeHolder): void {
  if (holder.current !== undefined) {
    holder.current.publishingAttached = false;
    holder.current.owedClosed = false;
  }
  holder.current = undefined;
}

function onWindowClosed(
  entries: Map<number, Entry>,
  listeners: NoticeListener[],
  id: number,
  active: Handshake | undefined,
): void {
  if (entries.get(id)?.kind === "sealed") return;
  entries.set(id, { kind: "sealed" });
  if (active?.publishingAttached === true) active.owedClosed = true;
  publish(listeners, { kind: "closed", webContentsId: id });
}

function store(
  entries: Map<number, Entry>,
  listeners: NoticeListener[],
  id: number,
  event: ViewMenuEvent,
): void {
  if (entries.get(id)?.kind === "sealed") return;
  const current = readSlot(entries, id) ?? blankViewMenuSlot();
  const next = reduceViewMenuSlot(current, event);
  entries.set(id, { kind: "slot", slot: next });
  if (!announcesMenu(current, next)) return;
  publish(listeners, {
    kind: "slot",
    webContentsId: id,
    phase: next.phase,
    epoch: next.epoch,
  });
}

function announcesMenu(previous: ViewMenuSlot, next: ViewMenuSlot): boolean {
  if (previous.phase === next.phase && previous.epoch === next.epoch) {
    return false;
  }
  if (next.phase === "unpublished") return false;
  if (next.phase === "retired" && next.epoch === 0) return false;
  return true;
}

function readSlot(
  entries: Map<number, Entry>,
  id: number,
): ViewMenuSlot | undefined {
  const entry = entries.get(id);
  if (entry === undefined || entry.kind === "sealed") return undefined;
  return entry.slot;
}

function subscribe(
  listeners: NoticeListener[],
  listener: NoticeListener,
): () => void {
  listeners.push(listener);
  return () => {
    removeListener(listeners, listener);
  };
}

function removeListener(
  listeners: NoticeListener[],
  listener: NoticeListener,
): void {
  const index = listeners.indexOf(listener);
  if (index < 0) return;
  listeners.splice(index, 1);
}

function publish(listeners: NoticeListener[], notice: ViewMenuNotice): void {
  const snapshot = listeners.slice();
  for (const listener of snapshot) {
    try {
      listener(notice);
    } catch {
      // 隔离这一个监听。不回滚槽或终态，也不把菜单记成已恢复。
    }
  }
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
  if (!isMainFrame) return slot;
  return retire(slot);
}

function openNext(slot: ViewMenuSlot): ViewMenuSlot {
  if (!Number.isSafeInteger(slot.epoch) || slot.epoch < 0) return retire(slot);
  if (slot.epoch >= Number.MAX_SAFE_INTEGER) return retire(slot);
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
