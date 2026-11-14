import { expect, it } from "vitest";

import {
  emptyPositionHistory,
  goBack,
  goForward,
  POSITION_HISTORY_LIMIT,
  recordJump,
  replaceCurrent,
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

it("replaces current without pushing the old page or clearing forward", () => {
  const opened = recordJump(emptyPositionHistory(), { page: 3 });
  const jumped = recordJump(opened, { page: 9 });
  const backed = goBack(jumped);
  const replaced = replaceCurrent(backed, { page: 7 });
  expect(replaced.current).toEqual({ page: 7 });
  expect(replaced.back).toBe(backed.back);
  expect(replaced.back).toEqual([]);
  expect(replaced.forward).toBe(backed.forward);
  expect(replaced.forward).toEqual([{ page: 9 }]);
});

it("returns the same history when replaceCurrent repeats the current page", () => {
  const current = recordJump(emptyPositionHistory(), { page: 4 });
  expect(replaceCurrent(current, { page: 4 })).toBe(current);
});

it("returns the same history when replaceCurrent is given a page that is not a positive integer", () => {
  const current = recordJump(emptyPositionHistory(), { page: 4 });
  expect(replaceCurrent(current, { page: 0 })).toBe(current);
  expect(replaceCurrent(current, { page: 1.5 })).toBe(current);
  expect(replaceCurrent(current, { page: -2 })).toBe(current);
});

it("sets current on an empty history without creating a back entry", () => {
  const replaced = replaceCurrent(emptyPositionHistory(), { page: 6 });
  expect(replaced.current).toEqual({ page: 6 });
  expect(replaced.back).toEqual([]);
  expect(replaced.forward).toEqual([]);
});

it("lets the next recordJump push the replaced page", () => {
  const opened = recordJump(emptyPositionHistory(), { page: 2 });
  const seen = replaceCurrent(opened, { page: 8 });
  const jumped = recordJump(seen, { page: 12 });
  expect(jumped.back).toEqual([{ page: 8 }]);
  expect(jumped.current).toEqual({ page: 12 });
  expect(jumped.forward).toEqual([]);
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
