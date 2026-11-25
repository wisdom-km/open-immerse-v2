import type {
  ViewShortcutReason,
  ViewShortcutTrace,
} from "./view-shortcut-trace.js";
import {
  viewSlotDescriptions,
  type ViewShape,
  type ViewSlotDescription,
} from "./view-menu-mirror.js";

export type InstallStatus = "known" | "unknown";

export type StageMark = string;

export type ViewMenuGatePorts = {
  readonly replace: (
    descriptions: readonly ViewSlotDescription[],
  ) => void | Promise<void>;
  readonly postCheck: () => boolean | Promise<boolean>;
  readonly dispatch: (event: string) => void | Promise<void>;
  readonly trace?: ViewShortcutTrace;
};

export type SealProbe = {
  readonly mode: ViewShape;
  readonly generation: number;
  readonly mark: string;
};

export type SubmitCandidateInput<T> = {
  readonly shape: ViewShape;
  readonly mark: StageMark;
  readonly generation: number;
  readonly stillEligible: () => boolean;
  readonly accept: (probe: () => SealProbe | undefined) => T | undefined;
};

export type ViewMenuGate = {
  readonly committed: ViewShape | null;
  readonly install: InstallStatus;
  readonly pendingMark: StageMark | null;
  submit(shape: ViewShape, mark: StageMark): Promise<void>;
  submitCandidate?<T>(input: SubmitCandidateInput<T>): Promise<T | undefined>;
  noteNone(mark: StageMark): Promise<void>;
  click(requestedEvent: string): Promise<number>;
  setDestroyed(destroyed: boolean): void;
};

export type ViewMenuCandidateGate = ViewMenuGate & {
  submitCandidate<T>(input: SubmitCandidateInput<T>): Promise<T | undefined>;
};

type Outcome = "ok" | "failed";

type ShapeReplacement =
  | { readonly outcome: "ok" }
  | { readonly outcome: "failed"; readonly failure: ViewShortcutReason };

type ClickFinish = {
  readonly result: 0 | 1;
  readonly reason: ViewShortcutReason;
};

type PendingNone = {
  readonly mark: StageMark;
};

type CandidateSeal = {
  readonly token: object;
  readonly mode: ViewShape;
  readonly generation: number;
  readonly mark: string;
};

type GateState = {
  committed: ViewShape | null;
  install: InstallStatus;
  pending: PendingNone | null;
  currentMark: StageMark | null;
  seal: CandidateSeal | undefined;
  destroyed: boolean;
  /** In-flight public operation. Zero means idle. Not a lifecycle owner. */
  busyAttempt: number;
  /** Increments once per replace attempt. Not a lifecycle owner. */
  attempts: AttemptCounter;
  /** Bumps when pending is written. Not a lifecycle owner. */
  pendingWrites: AttemptCounter;
  /** Readonly observation copy. Not a second lifecycle owner. */
  published: Published;
};

type Published = {
  committed: ViewShape | null;
  install: InstallStatus;
  pendingMark: StageMark | null;
};

/** One extra native replace is allowed for the whole public operation. */
type RepairBudget = {
  used: boolean;
};

export function createViewMenuGate(
  ports: ViewMenuGatePorts,
): ViewMenuCandidateGate {
  const state: GateState = {
    committed: null,
    install: "unknown",
    pending: null,
    currentMark: null,
    seal: undefined,
    destroyed: false,
    busyAttempt: 0,
    attempts: new AttemptCounter(),
    pendingWrites: new AttemptCounter(),
    published: {
      committed: null,
      install: "unknown",
      pendingMark: null,
    },
  };
  const gate: ViewMenuCandidateGate = {
    get committed() {
      return state.published.committed;
    },
    get install() {
      return state.published.install;
    },
    get pendingMark() {
      return state.published.pendingMark;
    },
    submit: (shape, mark) => submit(state, gate, ports, shape, mark),
    submitCandidate: (input) => runSubmitCandidate(state, gate, ports, input),
    noteNone: (mark) => noteNone(state, gate, ports, mark),
    click: (requestedEvent) => click(state, gate, ports, requestedEvent),
    setDestroyed: (destroyed) => {
      state.destroyed = destroyed;
      clearSeal(state);
    },
  };
  return sync(state, gate);
}

async function noteNone(
  state: GateState,
  gate: ViewMenuCandidateGate,
  ports: ViewMenuGatePorts,
  mark: StageMark,
): Promise<void> {
  clearSeal(state);
  if (state.destroyed) return;
  state.currentMark = mark;
  rememberPending(state, mark);
  sync(state, gate);
  if (state.busyAttempt !== 0) return;
  const budget = repairBudget();
  await operate(state, gate, async (committedBeforeOperation) => {
    await settle(state, gate, ports, null, committedBeforeOperation, budget);
  });
}

async function submit(
  state: GateState,
  gate: ViewMenuCandidateGate,
  ports: ViewMenuGatePorts,
  shape: ViewShape,
  mark: StageMark,
): Promise<void> {
  if (state.destroyed || state.busyAttempt !== 0) return;
  clearSeal(state);
  if (state.pending?.mark === mark) state.pending = null;
  state.currentMark = mark;
  sync(state, gate);
  const budget = repairBudget();
  await operate(state, gate, async (committedBeforeOperation) => {
    const replaced = await replaceShape(state, ports, shape);
    const candidate = snapshotCandidate(state, shape, mark, replaced.outcome);
    await settle(
      state,
      gate,
      ports,
      candidate,
      committedBeforeOperation,
      budget,
    );
  });
}

async function click(
  state: GateState,
  gate: ViewMenuCandidateGate,
  ports: ViewMenuGatePorts,
  requestedEvent: string,
): Promise<number> {
  // destroyed 为真时不再读 busy。两条判断之间没有 await。
  if (state.destroyed) {
    return tracedClick(ports, requestedEvent, 0, "destroyed");
  }
  if (state.busyAttempt !== 0) {
    return tracedClick(ports, requestedEvent, 0, "busy");
  }
  clearSeal(state);
  const budget = repairBudget();
  if (matchingPending(state)) {
    await operate(state, gate, async (committedBeforeOperation) => {
      await settle(state, gate, ports, null, committedBeforeOperation, budget);
    });
    return tracedClick(ports, requestedEvent, 0, "pending");
  }
  const shapeAtStart = state.committed;
  const markAtStart = state.currentMark;
  // 形状为 null 时不调用槽位包含判断。两条判断之间没有 await。
  if (shapeAtStart === null) {
    return tracedClick(ports, requestedEvent, 0, "uncommitted");
  }
  if (!slotHasEvent(shapeAtStart, requestedEvent)) {
    return tracedClick(ports, requestedEvent, 0, "event-absent");
  }
  const box: { done: ClickFinish } = {
    done: { result: 0, reason: "destroyed" },
  };
  await operate(state, gate, async (committedBeforeOperation) => {
    box.done = await rebuildAndDispatch(
      state,
      gate,
      ports,
      shapeAtStart,
      markAtStart,
      requestedEvent,
      committedBeforeOperation,
      budget,
    );
  });
  return tracedClick(ports, requestedEvent, box.done.result, box.done.reason);
}

async function rebuildAndDispatch(
  state: GateState,
  gate: ViewMenuCandidateGate,
  ports: ViewMenuGatePorts,
  shapeAtStart: ViewShape,
  markAtStart: StageMark | null,
  requestedEvent: string,
  committedBeforeOperation: ViewShape | null,
  budget: RepairBudget,
): Promise<ClickFinish> {
  const replaced = await replaceShape(state, ports, shapeAtStart);
  const candidate = clickCandidate(
    state,
    shapeAtStart,
    markAtStart,
    replaced.outcome,
  );
  await settle(state, gate, ports, candidate, committedBeforeOperation, budget);
  const dispatched = await dispatchRequested(
    state,
    ports,
    shapeAtStart,
    markAtStart,
    requestedEvent,
    replaced,
  );
  return closePendingAfterDispatch(
    state,
    gate,
    ports,
    committedBeforeOperation,
    budget,
    dispatched,
  );
}

function snapshotCandidate(
  state: GateState,
  shape: ViewShape,
  mark: StageMark,
  outcome: Outcome,
): ViewShape | null {
  if (outcome !== "ok" || state.destroyed) return null;
  if (state.currentMark !== mark) return null;
  return shape;
}

function clickCandidate(
  state: GateState,
  shape: ViewShape,
  markAtStart: StageMark | null,
  outcome: Outcome,
): ViewShape | null {
  if (outcome !== "ok" || state.destroyed) return null;
  if (state.currentMark !== markAtStart) return null;
  return shape;
}

async function operate(
  state: GateState,
  gate: ViewMenuCandidateGate,
  work: (committedBeforeOperation: ViewShape | null) => Promise<void>,
): Promise<void> {
  const committedBeforeOperation = state.committed;
  state.busyAttempt += 1;
  try {
    await work(committedBeforeOperation);
  } finally {
    state.busyAttempt = 0;
    sync(state, gate);
  }
}

async function settle(
  state: GateState,
  gate: ViewMenuCandidateGate,
  ports: ViewMenuGatePorts,
  candidate: ViewShape | null,
  committedBeforeOperation: ViewShape | null,
  budget: RepairBudget,
  onThisCommit?: () => void,
): Promise<void> {
  if (destroyedNow(state)) return;
  if (!matchingPending(state)) {
    commitCandidate(state, gate, candidate, committedBeforeOperation);
    onThisCommit?.();
    return;
  }
  if (budget.used) {
    keepUnknown(state, gate, committedBeforeOperation);
    return;
  }
  budget.used = true;
  const pendingWrite = state.pendingWrites.current();
  state.pending = null;
  sync(state, gate);
  const replaced = await replaceShape(state, ports, "none");
  if (destroyedNow(state)) return;
  if (state.pendingWrites.current() !== pendingWrite || pendingNow(state)) {
    keepUnknown(state, gate, committedBeforeOperation);
    return;
  }
  if (replaced.outcome === "ok") {
    clearSeal(state);
    state.committed = "none";
    state.install = "known";
    sync(state, gate);
    return;
  }
  keepUnknown(state, gate, committedBeforeOperation);
}

function matchingPending(state: GateState): boolean {
  return state.pending !== null && state.pending.mark === state.currentMark;
}

function commitCandidate(
  state: GateState,
  gate: ViewMenuCandidateGate,
  candidate: ViewShape | null,
  committedBeforeOperation: ViewShape | null,
): void {
  if (candidate !== null) {
    state.committed = candidate;
    state.install = "known";
  } else {
    state.committed = committedBeforeOperation;
    state.install = "unknown";
  }
  sync(state, gate);
}

function keepUnknown(
  state: GateState,
  gate: ViewMenuCandidateGate,
  committedBeforeOperation: ViewShape | null,
): void {
  clearSeal(state);
  state.committed = committedBeforeOperation;
  state.install = "unknown";
  sync(state, gate);
}

async function runSubmitCandidate<T>(
  state: GateState,
  gate: ViewMenuCandidateGate,
  ports: ViewMenuGatePorts,
  input: SubmitCandidateInput<T>,
): Promise<T | undefined> {
  if (state.destroyed || state.busyAttempt !== 0) return undefined;
  const token: object = {};
  if (state.pending?.mark === input.mark) state.pending = null;
  state.currentMark = input.mark;
  sync(state, gate);
  const budget = repairBudget();
  const box: { result: T | undefined } = { result: undefined };
  await operate(state, gate, async (committedBeforeOperation) => {
    const replaced = await replaceShape(state, ports, input.shape);
    const eligible = readEligibility(input);
    const candidate = eligible
      ? snapshotCandidate(state, input.shape, input.mark, replaced.outcome)
      : null;
    await settle(
      state,
      gate,
      ports,
      candidate,
      committedBeforeOperation,
      budget,
      () => {
        box.result = acceptOwned(
          state,
          gate,
          input,
          token,
          candidate,
          committedBeforeOperation,
        );
      },
    );
  });
  return box.result;
}

function readEligibility<T>(input: SubmitCandidateInput<T>): boolean {
  try {
    return input.stillEligible();
  } catch {
    return false;
  }
}

function acceptOwned<T>(
  state: GateState,
  gate: ViewMenuCandidateGate,
  input: SubmitCandidateInput<T>,
  token: object,
  candidate: ViewShape | null,
  committedBeforeOperation: ViewShape | null,
): T | undefined {
  if (!candidateArmed(state, input, candidate)) return undefined;
  state.seal = {
    token,
    mode: input.shape,
    generation: input.generation,
    mark: input.mark,
  };
  const record = readAcceptance(state, input, token);
  if (ownsSeal(state, token) && record !== undefined) {
    clearSeal(state);
    sync(state, gate);
    return record;
  }
  if (ownsSeal(state, token)) {
    state.committed = committedBeforeOperation;
    state.install = "unknown";
    clearSeal(state);
    sync(state, gate);
  }
  return undefined;
}

function candidateArmed<T>(
  state: GateState,
  input: SubmitCandidateInput<T>,
  candidate: ViewShape | null,
): boolean {
  return (
    candidate !== null &&
    state.committed === input.shape &&
    state.install === "known" &&
    state.currentMark === input.mark &&
    !state.destroyed &&
    !matchingPending(state)
  );
}

function readAcceptance<T>(
  state: GateState,
  input: SubmitCandidateInput<T>,
  token: object,
): T | undefined {
  try {
    const record = input.accept(() => probeSeal(state, token));
    if (isThenable(record)) return undefined;
    return record;
  } catch {
    return undefined;
  }
}

function probeSeal(state: GateState, token: object): SealProbe | undefined {
  const seal = state.seal;
  if (seal === undefined || !Object.is(seal.token, token)) return undefined;
  return { mode: seal.mode, generation: seal.generation, mark: seal.mark };
}

function ownsSeal(state: GateState, token: object): boolean {
  return state.seal !== undefined && Object.is(state.seal.token, token);
}

function isThenable(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
}

function clearSeal(state: GateState): void {
  state.seal = undefined;
}

async function replaceShape(
  state: GateState,
  ports: ViewMenuGatePorts,
  shape: ViewShape,
): Promise<ShapeReplacement> {
  if (destroyedNow(state)) return failedReplacement("destroyed");
  const attempt = state.attempts.next();
  try {
    await ports.replace(viewSlotDescriptions(shape));
  } catch {
    return failedReplacement("replace-threw");
  }
  if (!attemptCurrent(state, attempt)) {
    return failedReplacement("replace-stale");
  }
  try {
    const passed = await ports.postCheck();
    if (!attemptCurrent(state, attempt)) {
      return failedReplacement("replace-stale");
    }
    if (!passed) return failedReplacement("post-check-false");
    return { outcome: "ok" };
  } catch {
    return failedReplacement("post-check-threw");
  }
}

function failedReplacement(failure: ViewShortcutReason): ShapeReplacement {
  return { outcome: "failed", failure };
}

async function dispatchRequested(
  state: GateState,
  ports: ViewMenuGatePorts,
  shapeAtStart: ViewShape,
  markAtStart: StageMark | null,
  requestedEvent: string,
  replaced: ShapeReplacement,
): Promise<ClickFinish> {
  const blocked = dispatchBlock(state, shapeAtStart, requestedEvent, replaced);
  if (blocked !== undefined) return { result: 0, reason: blocked };
  if (state.currentMark !== markAtStart) {
    return { result: 0, reason: "mark-changed" };
  }
  try {
    await ports.dispatch(requestedEvent);
  } catch {
    return { result: 0, reason: "dispatch-threw" };
  }
  if (destroyedNow(state)) {
    return { result: 0, reason: "destroyed-after-dispatch" };
  }
  return { result: 1, reason: "accepted" };
}

async function closePendingAfterDispatch(
  state: GateState,
  gate: ViewMenuCandidateGate,
  ports: ViewMenuGatePorts,
  committedBeforeOperation: ViewShape | null,
  budget: RepairBudget,
  dispatched: ClickFinish,
): Promise<ClickFinish> {
  if (!matchingPending(state)) return dispatched;
  if (destroyedNow(state)) return keepZero(dispatched, "destroyed");
  if (budget.used) {
    keepUnknown(state, gate, committedBeforeOperation);
    return keepZero(dispatched, "pending-budget");
  }
  await settle(state, gate, ports, null, committedBeforeOperation, budget);
  if (destroyedNow(state)) return keepZero(dispatched, "destroyed");
  if (matchingPending(state) || state.install !== "known") {
    return keepZero(dispatched, "pending-after");
  }
  if (dispatched.result === 0) return dispatched;
  return { result: 1, reason: "accepted" };
}

function keepZero(
  dispatched: ClickFinish,
  reason: ViewShortcutReason,
): ClickFinish {
  if (dispatched.result === 0) return dispatched;
  return { result: 0, reason };
}

function dispatchBlock(
  state: GateState,
  shapeAtStart: ViewShape,
  requestedEvent: string,
  replaced: ShapeReplacement,
): ViewShortcutReason | undefined {
  if (destroyedNow(state)) return "destroyed";
  if (replaced.outcome !== "ok") return replaced.failure;
  if (state.committed !== shapeAtStart) return "committed-mismatch";
  if (state.install !== "known") return "install-unknown";
  if (pendingNow(state)) return "pending";
  if (!slotHasEvent(shapeAtStart, requestedEvent)) return "event-absent";
  return undefined;
}

function tracedClick(
  ports: ViewMenuGatePorts,
  event: string,
  result: 0 | 1,
  reason: ViewShortcutReason,
): number {
  try {
    ports.trace?.gate(event, result, reason);
  } catch {
    return result;
  }
  return result;
}

function slotHasEvent(shape: ViewShape, event: string): boolean {
  for (const slot of viewSlotDescriptions(shape)) {
    if (slot.event === event) return true;
  }
  return false;
}

class AttemptCounter {
  private value = 0;

  next(): number {
    this.value += 1;
    return this.value;
  }

  current(): number {
    return this.value;
  }
}

function repairBudget(): RepairBudget {
  return { used: false };
}

function rememberPending(state: GateState, mark: StageMark): void {
  state.pending = { mark };
  state.pendingWrites.next();
}

function pendingNow(state: GateState): boolean {
  return state.pending !== null;
}

function destroyedNow(state: GateState): boolean {
  return state.destroyed;
}

function attemptCurrent(state: GateState, attempt: number): boolean {
  return !destroyedNow(state) && state.attempts.current() === attempt;
}

function sync(
  state: GateState,
  gate: ViewMenuCandidateGate,
): ViewMenuCandidateGate {
  state.published.committed = state.committed;
  state.published.install = state.install;
  state.published.pendingMark = state.pending?.mark ?? null;
  return gate;
}
