// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useRef, type ReactElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { useZoom, type ZoomState } from "../../src/ui/use-zoom.js";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

it("leaves the percent alone when the wheel has neither ctrl nor meta", () => {
  const api = mount();
  const event = wheel(120);
  act(() => {
    column().dispatchEvent(event);
  });
  expect(event.defaultPrevented).toBe(false);
  expect(api.current?.percent).toBe(100);
  expect(screen.queryByRole("status")).toBeNull();
});

it("steps one notch on ctrl or meta and cancels the browser zoom", () => {
  const api = mount();
  const down = wheel(100, "ctrlKey");
  act(() => {
    column().dispatchEvent(down);
  });
  expect(down.defaultPrevented).toBe(true);
  expect(api.current?.percent).toBe(90);
  const up = wheel(-100, "metaKey");
  act(() => {
    column().dispatchEvent(up);
  });
  expect(up.defaultPrevented).toBe(true);
  expect(api.current?.percent).toBe(100);
});

it("takes one step for a wide wheel and five steps for five 133.33px notches", () => {
  const api = mount();
  act(() => {
    column().dispatchEvent(wheel(120, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(90);
  act(() => {
    column().dispatchEvent(wheel(-200, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(100);
  act(() => {
    const node = column();
    for (let index = 0; index < 5; index += 1)
      node.dispatchEvent(wheel(133.33, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(50);
});

it("clears a pinch remainder when the next wheel is already one notch", () => {
  const api = mount();
  act(() => {
    const node = column();
    for (const deltaY of [-60, -133.33, -40])
      node.dispatchEvent(wheel(deltaY, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(110);
});

it("clears the pinch remainder when the next small delta reverses", () => {
  const api = mount();
  act(() => {
    const node = column();
    for (const deltaY of [-30, -30, -30])
      node.dispatchEvent(wheel(deltaY, "ctrlKey"));
    node.dispatchEvent(wheel(20, "ctrlKey"));
    node.dispatchEvent(wheel(90, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(90);
});

it("waits until pinch deltas add up to one notch", () => {
  const api = mount();
  act(() => {
    const node = column();
    for (const deltaY of [-30, -30, -30])
      node.dispatchEvent(wheel(deltaY, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(100);
  act(() => {
    column().dispatchEvent(wheel(-30, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(110);
});

it("ignores a non-pixel or non-finite ctrl wheel after cancelling it", () => {
  const api = mount();
  const line = wheel(1, "ctrlKey", 1);
  const huge = wheel(Number.POSITIVE_INFINITY, "ctrlKey");
  act(() => {
    column().dispatchEvent(line);
    column().dispatchEvent(huge);
  });
  expect(line.defaultPrevented).toBe(true);
  expect(huge.defaultPrevented).toBe(true);
  expect(api.current?.percent).toBe(100);
});

it("announces the final percent once, 300ms after the last wheel", () => {
  vi.useFakeTimers();
  const api = mount();
  act(() => {
    column().dispatchEvent(wheel(-100, "ctrlKey"));
  });
  act(() => {
    vi.advanceTimersByTime(200);
    column().dispatchEvent(wheel(-100, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(125);
  expect(screen.queryByRole("status")).toBeNull();
  act(() => {
    vi.advanceTimersByTime(299);
  });
  expect(screen.queryByRole("status")).toBeNull();
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.getByRole("status").textContent).toBe("125%");
  expect(screen.getAllByRole("status")).toHaveLength(1);
  act(() => {
    api.current?.commands.zoomOut();
  });
  expect(screen.getByRole("status").textContent).toBe("110%");
});

it("clears the announcement timer when active becomes false or the view unmounts", () => {
  vi.useFakeTimers();
  const held = mount();
  act(() => {
    column().dispatchEvent(wheel(-100, "ctrlKey"));
  });
  act(() => {
    held.view.rerender(<Probe api={held} active={false} id="paper" />);
  });
  act(() => {
    vi.advanceTimersByTime(300);
  });
  expect(held.current?.percent).toBe(110);
  expect(held.current?.spoken).toBe("");
  act(() => {
    held.view.rerender(<Probe api={held} active id="again" />);
  });
  expect(held.current?.percent).toBe(100);
  act(() => {
    column().dispatchEvent(wheel(-100, "ctrlKey"));
  });
  act(() => {
    held.view.unmount();
  });
  act(() => {
    vi.advanceTimersByTime(300);
  });
});

it("does not move 25% or 400% or rewrite that announcement", () => {
  vi.useFakeTimers();
  const api = mount();
  act(() => {
    for (let index = 0; index < 7; index += 1) api.current?.commands.zoomOut();
  });
  expect(api.current?.percent).toBe(25);
  act(() => {
    column().dispatchEvent(wheel(100, "ctrlKey"));
    vi.advanceTimersByTime(300);
  });
  expect(api.current?.percent).toBe(25);
  expect(screen.getByRole("status").textContent).toBe("25%");
  act(() => {
    for (let index = 0; index < 20; index += 1) api.current?.commands.zoomIn();
  });
  expect(api.current?.percent).toBe(400);
  act(() => {
    column().dispatchEvent(wheel(-100, "ctrlKey"));
    vi.advanceTimersByTime(300);
  });
  expect(api.current?.percent).toBe(400);
  expect(screen.getByRole("status").textContent).toBe("400%");
});

it("does not attach before the page is shown and resets on the next document", () => {
  vi.useFakeTimers();
  const api = hold();
  const opened = render(<Probe api={api} active={false} id="first" />);
  act(() => {
    column().dispatchEvent(wheel(-100, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(100);
  act(() => {
    opened.rerender(<Probe api={api} active id="first" />);
  });
  act(() => {
    column().dispatchEvent(wheel(-100, "ctrlKey"));
  });
  expect(api.current?.percent).toBe(110);
  act(() => {
    opened.rerender(<Probe api={api} active id="second" />);
  });
  act(() => {
    vi.advanceTimersByTime(300);
  });
  expect(api.current?.percent).toBe(100);
  expect(api.current?.spoken).toBe("");
  act(() => {
    api.current?.commands.zoomIn();
  });
  expect(api.current?.percent).toBe(110);
});

type Api = { current: ZoomState | undefined };
type Held = Api & { view: ReturnType<typeof render> };

function mount(): Held {
  const api = hold() as Held;
  api.view = render(<Probe api={api} active id="paper" />);
  return api;
}

function hold(): Api {
  return { current: undefined };
}

function Probe(props: {
  readonly api: Api;
  readonly active: boolean;
  readonly id: string;
}): ReactElement {
  const columnRef = useRef<HTMLDivElement | null>(null);
  const zoom = useZoom(props.active, props.id, { columnRef });
  props.api.current = zoom;
  return (
    <div ref={columnRef} data-testid="column">
      {zoom.spoken === "" ? null : <p role="status">{zoom.spoken}</p>}
    </div>
  );
}

function column(): HTMLElement {
  const node = document.querySelector("[data-testid=column]");
  if (!(node instanceof HTMLElement)) throw new Error("column");
  return node;
}

function wheel(
  deltaY: number,
  key?: "ctrlKey" | "metaKey",
  deltaMode = 0,
): WheelEvent {
  const event = new WheelEvent("wheel", {
    deltaY,
    deltaMode,
    cancelable: true,
  });
  // happy-dom 的 WheelEvent 不继承 MouseEvent，构造参数里的 ctrlKey / metaKey 不会留在事件上。
  Object.defineProperty(event, "ctrlKey", { value: key === "ctrlKey" });
  Object.defineProperty(event, "metaKey", { value: key === "metaKey" });
  return event;
}
