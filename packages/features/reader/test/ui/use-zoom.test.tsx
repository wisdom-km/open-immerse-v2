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
  repeat(api, "zoomOut", 12);
  expect(api.current?.percent).toBe(25);
  zoom(api, "zoomOut");
  expect(api.current?.percent).toBe(25);
  repeat(api, "zoomIn", 20);
  expect(api.current?.percent).toBe(400);
  zoom(api, "zoomIn");
  expect(api.current?.percent).toBe(400);
});

it("ignores commands before the page can be shown", () => {
  const api = hold();
  render(<Probe api={api} active={false} id="paper" />);
  zoom(api, "zoomIn");
  zoom(api, "zoomFitWidth");
  expect(api.current?.percent).toBe(100);
  expect(screen.queryByRole("status")).toBeNull();
});

it("floors fit width so the page is not wider than the column", () => {
  const wide = { width: 612, height: 792 };
  const column = document.createElement("div");
  Object.defineProperty(column, "clientWidth", { value: 1370 });
  Object.defineProperty(column, "clientHeight", { value: 800 });
  column.getBoundingClientRect = () =>
    ({ top: 0, bottom: 100, height: 100 }) as DOMRect;
  const article = document.createElement("article");
  article.dataset.page = "2";
  article.style.borderLeft = "1px solid";
  article.style.borderRight = "1px solid";
  article.getBoundingClientRect = () =>
    ({ top: 0, bottom: 40, height: 40 }) as DOMRect;
  column.append(article);
  const api = hold();
  render(
    <Probe
      api={api}
      active
      id="paper"
      boxes={[{ width: 100, height: 200 }, wide]}
      column={column}
      page={1}
    />,
  );
  zoom(api, "zoomFitWidth");
  const percent = api.current?.percent ?? 0;
  article.style.boxSizing = "content-box";
  article.style.width = `${String((wide.width * percent) / 100)}px`;
  expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
  expect(percent).toBe(223);
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
type Box = { readonly width: number; readonly height: number };

function Probe(props: {
  readonly api: Api;
  readonly active: boolean;
  readonly id: string;
  readonly boxes?: readonly Box[];
  readonly column?: HTMLDivElement;
  readonly page?: number;
}): ReactElement | null {
  const column = useRef<HTMLDivElement | null>(props.column ?? null);
  const zoom = useZoom(
    props.active,
    props.id,
    props.boxes === undefined ? undefined : { boxes: props.boxes },
    { shownPage: props.page, columnRef: column },
  );
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
