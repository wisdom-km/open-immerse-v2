export const WHEEL_NOTCH_PX = 100;

type Step = (later?: true) => void;

export type WheelSteps = {
  readonly zoomIn: Step;
  readonly zoomOut: Step;
};

export function attachColumnWheel(
  column: HTMLElement,
  steps: { readonly current: WheelSteps },
): () => void {
  let rest = 0;
  const onWheel = (event: Event): void => {
    if (!(event instanceof WheelEvent)) return;
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    if (event.deltaMode !== 0 || !Number.isFinite(event.deltaY)) return;
    rest = takeWheelSteps(rest, event.deltaY, steps.current);
  };
  column.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    column.removeEventListener("wheel", onWheel);
  };
}

function takeWheelSteps(
  rest: number,
  deltaY: number,
  steps: WheelSteps,
): number {
  const sign = Math.sign(deltaY);
  const base = rest !== 0 && sign !== 0 && sign !== Math.sign(rest) ? 0 : rest;
  if (Math.abs(deltaY) >= WHEEL_NOTCH_PX) {
    if (sign > 0) steps.zoomOut(true);
    else if (sign < 0) steps.zoomIn(true);
    return 0;
  }
  return accumulateWheel(base + deltaY, steps);
}

function accumulateWheel(rest: number, steps: WheelSteps): number {
  let left = rest;
  while (left >= WHEEL_NOTCH_PX) {
    left -= WHEEL_NOTCH_PX;
    steps.zoomOut(true);
  }
  while (left <= -WHEEL_NOTCH_PX) {
    left += WHEEL_NOTCH_PX;
    steps.zoomIn(true);
  }
  return left;
}
