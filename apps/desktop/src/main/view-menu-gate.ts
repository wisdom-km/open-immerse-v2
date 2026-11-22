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
};

export type ViewMenuGate = {
  readonly committed: ViewShape | null;
  readonly install: InstallStatus;
  readonly pendingMark: StageMark | null;
  submit(shape: ViewShape, mark: StageMark): Promise<void>;
  noteNone(mark: StageMark): Promise<void>;
  click(requestedEvent: string): Promise<number>;
  setDestroyed(destroyed: boolean): void;
};

type Outcome = "ok" | "failed";

type PendingNone = {
  readonly mark: StageMark;
};

type GateState = {
  committed: ViewShape | null;
  install: InstallStatus;
  pending: PendingNone | null;
  currentMark: StageMark | null;
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

export function createViewMenuGate(ports: ViewMenuGatePorts): ViewMenuGate {
  const state: GateState = {
    committed: null,
    install: "unknown",
    pending: null,
    currentMark: null,
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
  const gate: ViewMenuGate = {
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
    noteNone: (mark) => noteNone(state, gate, ports, mark),
    click: (requestedEvent) => click(state, gate, ports, requestedEvent),
    setDestroyed: (destroyed) => {
      state.destroyed = destroyed;
    },
  };
  return sync(state, gate);
}

async function noteNone(
  state: GateState,
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
  mark: StageMark,
): Promise<void> {
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
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
  shape: ViewShape,
  mark: StageMark,
): Promise<void> {
  if (state.destroyed || state.busyAttempt !== 0) return;
  if (state.pending?.mark === mark) state.pending = null;
  state.currentMark = mark;
  sync(state, gate);
  const budget = repairBudget();
  await operate(state, gate, async (committedBeforeOperation) => {
    const outcome = await replaceShape(state, ports, shape);
    const candidate = snapshotCandidate(state, shape, mark, outcome);
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
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
  requestedEvent: string,
): Promise<number> {
  if (state.destroyed || state.busyAttempt !== 0) return 0;
  const budget = repairBudget();
  if (matchingPending(state)) {
    await operate(state, gate, async (committedBeforeOperation) => {
      await settle(state, gate, ports, null, committedBeforeOperation, budget);
    });
    return 0;
  }
  const shapeAtStart = state.committed;
  const markAtStart = state.currentMark;
  if (shapeAtStart === null || !slotHasEvent(shapeAtStart, requestedEvent)) {
    return 0;
  }
  let dispatched = 0;
  await operate(state, gate, async (committedBeforeOperation) => {
    dispatched = await rebuildAndDispatch(
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
  return dispatched;
}

async function rebuildAndDispatch(
  state: GateState,
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
  shapeAtStart: ViewShape,
  markAtStart: StageMark | null,
  requestedEvent: string,
  committedBeforeOperation: ViewShape | null,
  budget: RepairBudget,
): Promise<number> {
  const outcome = await replaceShape(state, ports, shapeAtStart);
  const candidate = clickCandidate(state, shapeAtStart, markAtStart, outcome);
  await settle(state, gate, ports, candidate, committedBeforeOperation, budget);
  const dispatched = await dispatchRequested(
    state,
    ports,
    shapeAtStart,
    requestedEvent,
    outcome,
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
  gate: ViewMenuGate,
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
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
  candidate: ViewShape | null,
  committedBeforeOperation: ViewShape | null,
  budget: RepairBudget,
): Promise<void> {
  if (destroyedNow(state)) return;
  if (!matchingPending(state)) {
    commitCandidate(state, gate, candidate, committedBeforeOperation);
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
  const outcome = await replaceShape(state, ports, "none");
  if (destroyedNow(state)) return;
  if (state.pendingWrites.current() !== pendingWrite || pendingNow(state)) {
    keepUnknown(state, gate, committedBeforeOperation);
    return;
  }
  if (outcome === "ok") {
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
  gate: ViewMenuGate,
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
  gate: ViewMenuGate,
  committedBeforeOperation: ViewShape | null,
): void {
  state.committed = committedBeforeOperation;
  state.install = "unknown";
  sync(state, gate);
}

async function replaceShape(
  state: GateState,
  ports: ViewMenuGatePorts,
  shape: ViewShape,
): Promise<Outcome> {
  if (destroyedNow(state)) return "failed";
  const attempt = state.attempts.next();
  try {
    await ports.replace(viewSlotDescriptions(shape));
  } catch {
    return "failed";
  }
  if (!attemptCurrent(state, attempt)) return "failed";
  try {
    const passed = await ports.postCheck();
    if (!attemptCurrent(state, attempt)) return "failed";
    return passed ? "ok" : "failed";
  } catch {
    return "failed";
  }
}

async function dispatchRequested(
  state: GateState,
  ports: ViewMenuGatePorts,
  shapeAtStart: ViewShape,
  requestedEvent: string,
  outcome: Outcome,
): Promise<number> {
  if (!dispatchAllowed(state, shapeAtStart, requestedEvent, outcome)) return 0;
  try {
    await ports.dispatch(requestedEvent);
  } catch {
    return 0;
  }
  if (destroyedNow(state)) return 0;
  return 1;
}

async function closePendingAfterDispatch(
  state: GateState,
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
  committedBeforeOperation: ViewShape | null,
  budget: RepairBudget,
  dispatched: number,
): Promise<number> {
  if (!matchingPending(state)) return dispatched;
  if (destroyedNow(state)) return 0;
  if (budget.used) {
    keepUnknown(state, gate, committedBeforeOperation);
    return 0;
  }
  await settle(state, gate, ports, null, committedBeforeOperation, budget);
  if (destroyedNow(state)) return 0;
  if (matchingPending(state) || state.install !== "known") return 0;
  return dispatched;
}

function dispatchAllowed(
  state: GateState,
  shapeAtStart: ViewShape,
  requestedEvent: string,
  outcome: Outcome,
): boolean {
  if (destroyedNow(state) || outcome !== "ok") return false;
  if (state.committed !== shapeAtStart || state.install !== "known")
    return false;
  if (pendingNow(state)) return false;
  return slotHasEvent(shapeAtStart, requestedEvent);
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

function sync(state: GateState, gate: ViewMenuGate): ViewMenuGate {
  state.published.committed = state.committed;
  state.published.install = state.install;
  state.published.pendingMark = state.pending?.mark ?? null;
  return gate;
}
