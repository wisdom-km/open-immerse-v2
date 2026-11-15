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
    rest += event.deltaY;
    while (rest >= WHEEL_NOTCH_PX) {
      rest -= WHEEL_NOTCH_PX;
      steps.current.zoomOut(true);
    }
    while (rest <= -WHEEL_NOTCH_PX) {
      rest += WHEEL_NOTCH_PX;
      steps.current.zoomIn(true);
    }
  };
  column.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    column.removeEventListener("wheel", onWheel);
  };
}
