import type { ViewMenuEpoch, ViewMenuNotice } from "./view-menu-epoch.js";
import type { ViewMenuGate } from "./view-menu-gate.js";

type Owner = {
  id: number | undefined;
};

export function bindViewMenuLifecycle(
  epoch: ViewMenuEpoch,
  gate: ViewMenuGate,
): () => void {
  const owner: Owner = { id: undefined };
  let unsubscribe = (): void => undefined;
  let left = false;
  const leave = (): void => {
    if (left) return;
    left = true;
    unsubscribe();
  };
  unsubscribe = epoch.subscribe((notice) => {
    onNotice(epoch, gate, owner, leave, notice);
  });
  return leave;
}

function onNotice(
  epoch: ViewMenuEpoch,
  gate: ViewMenuGate,
  owner: Owner,
  leave: () => void,
  notice: ViewMenuNotice,
): void {
  if (notice.kind === "attached") {
    takeOwner(owner, notice.webContentsId);
    return;
  }
  if (notice.kind === "closed") {
    closeOwner(gate, owner.id, notice.webContentsId, leave);
    return;
  }
  noteSlot(epoch, gate, owner.id, notice);
}

function takeOwner(owner: Owner, webContentsId: number): void {
  if (owner.id !== undefined) return;
  if (!Number.isSafeInteger(webContentsId)) return;
  owner.id = webContentsId;
}

function closeOwner(
  gate: ViewMenuGate,
  ownerId: number | undefined,
  webContentsId: number,
  leave: () => void,
): void {
  if (ownerId === undefined || ownerId !== webContentsId) return;
  try {
    gate.setDestroyed(true);
  } finally {
    leave();
  }
}

function noteSlot(
  epoch: ViewMenuEpoch,
  gate: ViewMenuGate,
  ownerId: number | undefined,
  notice: Extract<ViewMenuNotice, { kind: "slot" }>,
): void {
  if (!slotBelongs(epoch, ownerId, notice)) return;
  observeOriginal(gate.noteNone(stageMark(notice)));
}

function slotBelongs(
  epoch: ViewMenuEpoch,
  ownerId: number | undefined,
  notice: Extract<ViewMenuNotice, { kind: "slot" }>,
): boolean {
  if (ownerId === undefined || notice.webContentsId !== ownerId) return false;
  if (notice.phase === "retired" && notice.epoch === 0) return false;
  const slot = epoch.read(notice.webContentsId);
  if (slot === undefined) return false;
  return slot.phase === notice.phase && slot.epoch === notice.epoch;
}

function stageMark(notice: Extract<ViewMenuNotice, { kind: "slot" }>): string {
  return `${String(notice.webContentsId)}:${notice.phase}:${String(notice.epoch)}`;
}

function observeOriginal(pending: Promise<void>): void {
  void pending.then(keepRejection, keepRejection);
}

function keepRejection(): void {
  return undefined;
}
