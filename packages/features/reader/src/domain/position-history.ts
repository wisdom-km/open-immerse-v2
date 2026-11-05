export const POSITION_HISTORY_LIMIT = 50;

export type ReaderJump = {
  readonly page: number;
};

export type PositionHistory = {
  readonly back: readonly ReaderJump[];
  readonly current: ReaderJump | undefined;
  readonly forward: readonly ReaderJump[];
};

export function emptyPositionHistory(): PositionHistory {
  return { back: [], current: undefined, forward: [] };
}

/**
 * 跳到与当前相同的页时栈不变。普通滚动不调用本函数。
 * 后退最多 50 条，不持久化。
 */
export function recordJump(
  history: PositionHistory,
  page: ReaderJump,
): PositionHistory {
  if (!Number.isInteger(page.page) || page.page < 1) {
    return history;
  }
  if (history.current?.page === page.page) {
    return history;
  }
  if (history.current === undefined) {
    return { back: [], current: page, forward: [] };
  }
  return {
    back: trimBack([...history.back, history.current]),
    current: page,
    forward: [],
  };
}

export function goBack(history: PositionHistory): PositionHistory {
  const previous = history.back[history.back.length - 1];
  if (previous === undefined || history.current === undefined) {
    return history;
  }
  return {
    back: history.back.slice(0, -1),
    current: previous,
    forward: [history.current, ...history.forward],
  };
}

export function goForward(history: PositionHistory): PositionHistory {
  const next = history.forward[0];
  if (next === undefined || history.current === undefined) {
    return history;
  }
  return {
    back: [...history.back, history.current],
    current: next,
    forward: history.forward.slice(1),
  };
}

function trimBack(back: readonly ReaderJump[]): readonly ReaderJump[] {
  if (back.length <= POSITION_HISTORY_LIMIT) {
    return back;
  }
  return back.slice(back.length - POSITION_HISTORY_LIMIT);
}
