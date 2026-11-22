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
  committed: ViewShape | null;
  install: InstallStatus;
  pendingMark: StageMark | null;
  submit(shape: ViewShape, mark: StageMark): Promise<void>;
  noteNone(mark: StageMark): Promise<void>;
  click(): Promise<number>;
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
  };
  const gate: ViewMenuGate = {
    committed: null,
    install: "unknown",
    pendingMark: null,
    submit: (shape, mark) => submit(state, gate, ports, shape, mark),
    noteNone: (mark) => noteNone(state, gate, ports, mark),
    click: () => click(state, gate, ports),
    setDestroyed: (destroyed) => {
      state.destroyed = destroyed;
    },
  };
  return gate;
}

function publish(state: GateState, gate: ViewMenuGate): void {
  gate.committed = state.committed;
  gate.install = state.install;
  gate.pendingMark = state.pending?.mark ?? null;
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
  publish(state, gate);
  if (state.busyAttempt !== 0) return;
  await operate(state, gate, async (committedBeforeOperation) => {
    await settle(state, gate, ports, null, committedBeforeOperation);
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
  publish(state, gate);
  await operate(state, gate, async (committedBeforeOperation) => {
    const outcome = await replaceShape(state, ports, shape);
    const candidate = snapshotCandidate(state, shape, mark, outcome);
    await settle(state, gate, ports, candidate, committedBeforeOperation);
  });
}

async function click(
  state: GateState,
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
): Promise<number> {
  if (state.destroyed || state.busyAttempt !== 0) return 0;
  if (matchingPending(state)) {
    await operate(state, gate, async (committedBeforeOperation) => {
      await settle(state, gate, ports, null, committedBeforeOperation);
    });
    return 0;
  }
  const shapeAtStart = state.committed;
  const markAtStart = state.currentMark;
  if (shapeAtStart === null) return 0;
  let dispatched = 0;
  await operate(state, gate, async (committedBeforeOperation) => {
    const outcome = await replaceShape(state, ports, shapeAtStart);
    const candidate = clickCandidate(state, shapeAtStart, markAtStart, outcome);
    await settle(state, gate, ports, candidate, committedBeforeOperation);
    dispatched = await dispatchIfFinal(state, ports, shapeAtStart, outcome);
  });
  return dispatched;
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
    publish(state, gate);
  }
}

async function settle(
  state: GateState,
  gate: ViewMenuGate,
  ports: ViewMenuGatePorts,
  candidate: ViewShape | null,
  committedBeforeOperation: ViewShape | null,
): Promise<void> {
  if (state.destroyed) return;
  if (!matchingPending(state)) {
    commitCandidate(state, gate, candidate, committedBeforeOperation);
    return;
  }
  const pendingWrite = state.pendingWrites.current();
  state.pending = null;
  publish(state, gate);
  const outcome = await replaceShape(state, ports, "none");
  if (state.pendingWrites.current() !== pendingWrite || pendingNow(state)) {
    keepUnknown(state, gate, committedBeforeOperation);
    return;
  }
  if (outcome === "ok" && !destroyedNow(state)) {
    state.committed = "none";
    state.install = "known";
    publish(state, gate);
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
  publish(state, gate);
}

function keepUnknown(
  state: GateState,
  gate: ViewMenuGate,
  committedBeforeOperation: ViewShape | null,
): void {
  state.committed = committedBeforeOperation;
  state.install = "unknown";
  publish(state, gate);
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
  if (destroyedNow(state) || state.attempts.current() !== attempt) {
    return "failed";
  }
  try {
    const passed = await ports.postCheck();
    return passed ? "ok" : "failed";
  } catch {
    return "failed";
  }
}

async function dispatchIfFinal(
  state: GateState,
  ports: ViewMenuGatePorts,
  shapeAtStart: ViewShape,
  outcome: Outcome,
): Promise<number> {
  if (outcome !== "ok") return 0;
  if (state.committed !== shapeAtStart || state.install !== "known") return 0;
  if (state.pending !== null) return 0;
  const event = checkedEvent(shapeAtStart);
  if (event === null) return 0;
  try {
    await ports.dispatch(event);
  } catch {
    return 0;
  }
  return 1;
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

function checkedEvent(shape: ViewShape): string | null {
  for (const slot of viewSlotDescriptions(shape)) {
    if ("checked" in slot && slot.checked) return slot.event;
  }
  return null;
}
