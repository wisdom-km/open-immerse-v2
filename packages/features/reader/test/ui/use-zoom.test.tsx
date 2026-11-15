// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useRef, type ReactElement } from "react";
import { afterEach, expect, it } from "vitest";

import { useZoom, type ZoomState } from "../../src/ui/use-zoom.js";

afterEach(cleanup);

it("announces each step and stops at 25% and 400%", () => {
  const api = hold();
  render(<Probe api={api} active id="paper" />);
  zoom(api, "zoomIn");
  expect(api.current?.percent).toBe(110);
  expect(screen.getByRole("status").textContent).toBe("110%");
  expect(screen.getAllByRole("status")).toHaveLength(1);
  zoom(api, "zoomActual");
  expect(api.current?.percent).toBe(100);
  expect(screen.getByRole("status").textContent).toBe("100%");
  repeat(api, "zoomOut", 12);
  expect(api.current?.percent).toBe(25);
  expect(screen.getByRole("status").textContent).toBe("25%");
  zoom(api, "zoomOut");
  expect(api.current?.percent).toBe(25);
  expect(screen.getByRole("status").textContent).toBe("25%");
  repeat(api, "zoomIn", 20);
  expect(api.current?.percent).toBe(400);
  expect(screen.getByRole("status").textContent).toBe("400%");
  zoom(api, "zoomIn");
  expect(api.current?.percent).toBe(400);
  expect(screen.getByRole("status").textContent).toBe("400%");
});

it("ignores commands before the page can be shown", () => {
  const api = hold();
  render(<Probe api={api} active={false} id="paper" />);
  zoom(api, "zoomIn");
  zoom(api, "zoomFitWidth");
  expect(api.current?.percent).toBe(100);
  expect(screen.queryByRole("status")).toBeNull();
});

it("does not keep the previous percent after another document opens", () => {
  const api = hold();
  const view = render(<Probe api={api} active id="first" />);
  zoom(api, "zoomIn");
  act(() => {
    view.rerender(<Probe api={api} active id="second" />);
  });
  expect(api.current?.percent).toBe(100);
  expect(screen.queryByRole("status")).toBeNull();
});

type Api = { current: ZoomState | undefined };

function Probe(props: {
  readonly api: Api;
  readonly active: boolean;
  readonly id: string;
}): ReactElement | null {
  const column = useRef<HTMLDivElement | null>(null);
  const zoom = useZoom(props.active, props.id, { columnRef: column });
  props.api.current = zoom;
  return props.active && zoom.spoken !== "" ? (
    <p role="status">{zoom.spoken}</p>
  ) : null;
}

function hold(): Api {
  return { current: undefined };
}

function zoom(api: Api, key: keyof ZoomState["commands"]): void {
  act(() => {
    api.current?.commands[key]();
  });
}

function repeat(api: Api, key: "zoomIn" | "zoomOut", times: number): void {
  for (let index = 0; index < times; index += 1) zoom(api, key);
}
