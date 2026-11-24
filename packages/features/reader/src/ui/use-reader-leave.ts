import { useCallback, useLayoutEffect, useRef } from "react";

export function useReaderLeave(
  leaveSession: () => void,
  onBindLeave: ((leave: (() => void) | undefined) => void) | undefined,
): {
  readonly leave: () => void;
  readonly releasePixels: { current: boolean };
} {
  const releasePixels = useRef(true);
  const leave = useCallback(() => {
    releasePixels.current = false;
    leaveSession();
    queueMicrotask(() => {
      releasePixels.current = true;
    });
  }, [leaveSession]);
  useLayoutEffect(() => {
    onBindLeave?.(leave);
    return () => {
      onBindLeave?.(undefined);
    };
  }, [onBindLeave, leave]);
  return { leave, releasePixels };
}
