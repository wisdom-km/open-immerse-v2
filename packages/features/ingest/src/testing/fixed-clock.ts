import type { Clock } from "@oi/kernel";

export type FixedClock = Clock & {
  readonly calls: () => number;
};

export function createFixedClock(times: readonly number[]): FixedClock {
  let cursor = 0;
  let calls = 0;
  return {
    calls() {
      return calls;
    },
    nowMs() {
      calls += 1;
      const value = times[cursor];
      cursor += 1;
      if (value === undefined) {
        throw new Error("clock");
      }
      return value;
    },
  };
}
