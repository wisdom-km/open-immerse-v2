import type { IpcCommandContext, IpcCommandHandler } from "./ipc/ipc-router.js";
import type { ViewMenuGate } from "./view-menu-gate.js";
import type { ViewShape } from "./view-menu-mirror.js";
import type {
  ViewMenuAcceptance,
  ViewMenuEpoch,
  ViewMenuFloorWriter,
} from "./view-menu-epoch.js";

type ViewMenuDeps = {
  readonly epoch: ViewMenuEpoch & ViewMenuFloorWriter;
  readonly gate: ViewMenuGate;
  readonly soleWindow: () => number | undefined;
};

type Rejected = {
  readonly ok: false;
  readonly error: { readonly code: "rejected"; readonly retryable: false };
};

type InvalidPayload = {
  readonly ok: false;
  readonly error: {
    readonly code: "invalid_payload";
    readonly retryable: false;
  };
};

export function createViewMenuHandler(deps: ViewMenuDeps): IpcCommandHandler {
  return (payload, context) => reportViewMenu(deps, payload, context);
}

async function reportViewMenu(
  deps: ViewMenuDeps,
  payload: unknown,
  context: IpcCommandContext,
): Promise<unknown> {
  if (!isRecord(payload)) return invalidPayload();
  if (payload.op === "read") return readViewMenu(deps, context);
  if (payload.op === "submit") return submitViewMenu(deps, payload, context);
  return invalidPayload();
}

function readViewMenu(
  deps: ViewMenuDeps,
  context: IpcCommandContext,
):
  | { readonly ok: true; readonly value: { readonly epoch: number } }
  | Rejected {
  const sender = context.senderWebContentsId;
  if (!windowOpen(deps, sender)) return rejected();
  const slot = deps.epoch.read(sender);
  if (slot === undefined || slot.phase !== "open") return rejected();
  return { ok: true, value: { epoch: slot.epoch } };
}

async function submitViewMenu(
  deps: ViewMenuDeps,
  payload: Record<string, unknown>,
  context: IpcCommandContext,
): Promise<
  | { readonly ok: true; readonly value: { readonly epoch: number } }
  | Rejected
  | InvalidPayload
> {
  const mode = payload.mode;
  const epoch = payload.epoch;
  const generation = payload.generation;
  if (!isMode(mode) || !isGeneration(epoch) || !isGeneration(generation)) {
    return invalidPayload();
  }
  const sender = context.senderWebContentsId;
  if (!windowOpen(deps, sender)) return rejected();
  const slot = deps.epoch.read(sender);
  if (slot === undefined || slot.phase !== "open") return rejected();
  if (epoch !== slot.epoch || generation <= slot.floor) return rejected();
  const record = await deps.gate.submitCandidate({
    shape: mode,
    mark: stageMark(sender, epoch),
    generation,
    stillEligible: () => stillEligible(deps, sender, epoch, generation),
    accept: (probe) =>
      deps.epoch.commitFloor({
        senderWebContentsId: sender,
        epoch,
        generation,
        mode,
        soleWindow: deps.soleWindow,
        seal: probe,
      }),
  });
  if (record === undefined) return rejected();
  return { ok: true, value: { epoch: record.epoch } };
}

function stillEligible(
  deps: ViewMenuDeps,
  sender: number,
  epoch: number,
  generation: number,
): boolean {
  if (!windowOpen(deps, sender)) return false;
  const slot = deps.epoch.read(sender);
  if (slot === undefined || slot.phase !== "open") return false;
  return slot.epoch === epoch && slot.floor < generation;
}

function windowOpen(deps: ViewMenuDeps, sender: number): boolean {
  if (!isSafeId(sender)) return false;
  try {
    return deps.soleWindow() === sender;
  } catch {
    return false;
  }
}

function stageMark(sender: number, epoch: number): string {
  return `${String(sender)}:open:${String(epoch)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMode(
  value: unknown,
): value is ViewMenuAcceptance["mode"] & ViewShape {
  return (
    value === "none" ||
    value === "original" ||
    value === "contrast" ||
    value === "translation"
  );
}

function isGeneration(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function isSafeId(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function rejected(): Rejected {
  return { ok: false, error: { code: "rejected", retryable: false } };
}

function invalidPayload(): InvalidPayload {
  return { ok: false, error: { code: "invalid_payload", retryable: false } };
}
