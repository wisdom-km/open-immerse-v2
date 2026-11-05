import { expect, it } from "vitest";

import {
  emptyPositionHistory,
  goBack,
  goForward,
  POSITION_HISTORY_LIMIT,
  recordJump,
} from "../../src/pure.js";

it("keeps the stack when recordJump repeats the current page", () => {
  const current = recordJump(emptyPositionHistory(), { page: 2 });
  expect(recordJump(current, { page: 2 })).toBe(current);
});

it("returns the same history when goBack is called with an empty back stack", () => {
  const current = recordJump(emptyPositionHistory(), { page: 1 });
  expect(goBack(current)).toBe(current);
});

it("drops the oldest jump when the back stack already holds 50", () => {
  let history = emptyPositionHistory();
  for (let page = 1; page <= POSITION_HISTORY_LIMIT + 2; page += 1) {
    history = recordJump(history, { page });
  }
  expect(history.back).toHaveLength(POSITION_HISTORY_LIMIT);
  expect(history.back[0]).toEqual({ page: 2 });
  expect(history.current).toEqual({ page: POSITION_HISTORY_LIMIT + 2 });
  expect(history.forward).toEqual([]);
});

it("moves the current page onto the forward stack when goBack is called", () => {
  const jumped = recordJump(recordJump(emptyPositionHistory(), { page: 1 }), {
    page: 4,
  });
  const back = goBack(jumped);
  expect(back.current).toEqual({ page: 1 });
  expect(back.forward).toEqual([{ page: 4 }]);
  expect(goForward(back).current).toEqual({ page: 4 });
});
