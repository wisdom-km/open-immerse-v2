// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useRef, type ReactElement } from "react";
import { afterEach, expect, it } from "vitest";

import {
  useZoom,
  type ZoomSession,
  type ZoomState,
} from "../../src/ui/use-zoom.js";

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
  zoom(api, "zoomFitPage");
  expect(api.current?.percent).toBe(100);
  expect(screen.queryByRole("status")).toBeNull();
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

it("floors fit width to 223% from the visible page", () => {
  const column = fitColumn({
    clientWidth: 1370,
    clientHeight: 900,
    paddingLeft: "0px",
    paddingRight: "0px",
    pages: [
      { page: 1, width: 100, top: 2000, bottom: 2100, border: "0px" },
      { page: 2, width: 612, top: 0, bottom: 900, border: "1px" },
    ],
  });
  const api = hold();
  render(
    <Probe
      api={api}
      active
      id="paper"
      session={fitSession(column, [
        { width: 100, height: 100 },
        { width: 612, height: 792 },
      ])}
    />,
  );
  zoom(api, "zoomFitWidth");
  expect(api.current?.percent).toBe(223);
  expect(screen.getByRole("status").textContent).toBe("223%");
  column.remove();
});

it("subtracts the visible page chrome before flooring fit width", () => {
  const column = fitColumn({
    clientWidth: 800,
    clientHeight: 600,
    paddingLeft: "30px",
    paddingRight: "20px",
    pages: [
      { page: 1, width: 50, top: 2000, bottom: 2100, border: "40px" },
      { page: 2, width: 400, top: 0, bottom: 600, border: "5px" },
    ],
  });
  const api = hold();
  render(
    <Probe
      api={api}
      active
      id="paper"
      session={fitSession(column, [
        { width: 50, height: 50 },
        { width: 400, height: 400 },
      ])}
    />,
  );
  zoom(api, "zoomFitWidth");
  expect(api.current?.percent).toBe(185);
  column.remove();
});

it("floors fit page after subtracting padding and border", () => {
  const column = fitColumn({
    clientWidth: 269,
    clientHeight: 400,
    paddingLeft: "10px",
    paddingRight: "10px",
    pages: [{ page: 1, width: 250, top: 0, bottom: 400, border: "5px" }],
  });
  const api = hold();
  render(
    <Probe
      api={api}
      active
      id="paper"
      session={fitSession(column, [{ width: 250, height: 200 }])}
    />,
  );
  zoom(api, "zoomFitPage");
  expect(api.current?.percent).toBe(95);
  expect(screen.getByRole("status").textContent).toBe("95%");
  column.remove();
});

type Api = { current: ZoomState | undefined };

function Probe(props: {
  readonly api: Api;
  readonly active: boolean;
  readonly id: string;
  readonly session?: ZoomSession;
}): ReactElement | null {
  const column = useRef<HTMLDivElement | null>(null);
  const zoom = useZoom(
    props.active,
    props.id,
    props.session ?? { columnRef: column },
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

function fitSession(
  column: HTMLDivElement,
  boxes: readonly { width: number; height: number }[],
): ZoomSession {
  const session = {
    columnRef: { current: column },
    shownPage: 1,
    phase: { kind: "view" as const, reading: { boxes } },
  };
  return session;
}

function fitColumn(input: {
  readonly clientWidth: number;
  readonly clientHeight: number;
  readonly paddingLeft: string;
  readonly paddingRight: string;
  readonly pages: readonly {
    readonly page: number;
    readonly width: number;
    readonly top: number;
    readonly bottom: number;
    readonly border: string;
  }[];
}): HTMLDivElement {
  const column = document.createElement("div");
  column.style.paddingLeft = input.paddingLeft;
  column.style.paddingRight = input.paddingRight;
  column.style.paddingTop = "0px";
  column.style.paddingBottom = "0px";
  Object.defineProperty(column, "clientWidth", {
    configurable: true,
    value: input.clientWidth,
  });
  Object.defineProperty(column, "clientHeight", {
    configurable: true,
    value: input.clientHeight,
  });
  stubRect(column, 0, input.clientHeight);
  for (const page of input.pages) {
    const article = document.createElement("article");
    article.dataset.page = String(page.page);
    article.style.borderStyle = "solid";
    article.style.borderWidth = "0px";
    article.style.borderLeftWidth = page.border;
    article.style.borderRightWidth = page.border;
    article.style.padding = "0px";
    stubRect(article, page.top, page.bottom);
    column.append(article);
  }
  document.body.append(column);
  return column;
}

function stubRect(node: HTMLElement, top: number, bottom: number): void {
  node.getBoundingClientRect = () => ({
    x: 0,
    y: top,
    top,
    bottom,
    left: 0,
    right: 100,
    width: 100,
    height: bottom - top,
    toJSON() {
      return {};
    },
  });
}
