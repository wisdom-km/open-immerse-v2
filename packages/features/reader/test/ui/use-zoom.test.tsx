// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useRef, type ReactElement } from "react";
import { afterEach, expect, it } from "vitest";

import { resolveZoomPercent } from "../../src/pure.js";
import { useZoom, type ZoomState } from "../../src/ui/use-zoom.js";

afterEach(() => {
  cleanup();
});

it("announces the next step once when zooming in", () => {
  const api = hold();
  render(<Probe api={api} active id="paper" />);
  zoom(api, "zoomIn");
  expect(api.current?.percent).toBe(110);
  expect(screen.getByRole("status").textContent).toBe("110%");
  expect(screen.getAllByRole("status")).toHaveLength(1);
});

it("does nothing at 25% and at 400%", () => {
  const api = hold();
  render(<Probe api={api} active id="paper" />);
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
});

it("returns to 100% for actual size", () => {
  const api = hold();
  render(<Probe api={api} active id="paper" />);
  zoom(api, "zoomIn");
  zoom(api, "zoomActual");
  expect(api.current?.percent).toBe(100);
  expect(screen.getByRole("status").textContent).toBe("100%");
});

it("ignores commands before the page can be shown", () => {
  const api = hold();
  render(<Probe api={api} active={false} id="paper" />);
  zoom(api, "zoomIn");
  zoom(api, "zoomFitWidth");
  expect(api.current?.percent).toBe(100);
  expect(screen.queryByRole("status")).toBeNull();
});

it("uses resolveZoomPercent for fit width", () => {
  const page = { width: 200, height: 400 };
  const column = document.createElement("div");
  Object.defineProperty(column, "clientWidth", { value: 100 });
  Object.defineProperty(column, "clientHeight", { value: 800 });
  const api = hold();
  render(
    <Probe api={api} active id="paper" box={page} column={column} page={1} />,
  );
  zoom(api, "zoomFitWidth");
  expect(api.current?.percent).toBe(
    resolveZoomPercent("fit-width", page, { width: 100, height: 800 }),
  );
});

it("does not keep the previous percent after another document opens", () => {
  const api = hold();
  const view = render(<Probe api={api} active id="first" />);
  zoom(api, "zoomIn");
  expect(api.current?.percent).toBe(110);
  act(() => {
    view.rerender(<Probe api={api} active id="second" />);
  });
  expect(api.current?.percent).toBe(100);
  expect(screen.queryByRole("status")).toBeNull();
});

function Probe(props: {
  readonly api: { current: ZoomState | undefined };
  readonly active: boolean;
  readonly id: string;
  readonly box?: { readonly width: number; readonly height: number };
  readonly column?: HTMLDivElement;
  readonly page?: number;
}): ReactElement {
  const column = useRef<HTMLDivElement | null>(props.column ?? null);
  const zoom = useZoom(
    props.active,
    props.id,
    props.box === undefined ? undefined : { boxes: [props.box] },
    { shownPage: props.page, columnRef: column },
  );
  props.api.current = zoom;
  return props.active && zoom.spoken !== "" ? (
    <p role="status">{zoom.spoken}</p>
  ) : null;
}

function hold(): { current: ZoomState | undefined } {
  return { current: undefined };
}

function zoom(
  api: { current: ZoomState | undefined },
  key: "zoomIn" | "zoomOut" | "zoomActual" | "zoomFitWidth",
): void {
  act(() => {
    api.current?.commands[key]();
  });
}

function repeat(
  api: { current: ZoomState | undefined },
  key: "zoomIn" | "zoomOut",
  times: number,
): void {
  for (let index = 0; index < times; index += 1) {
    zoom(api, key);
  }
}
