// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act, useRef, type ReactElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { useZoom, type ZoomState } from "../../src/ui/use-zoom.js";
import { ZoomControls } from "../../src/ui/zoom-controls.js";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

it("announces the new percent as soon as a button or the menu changes it", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "放大" }));
  expect(spoken()).toBe("110%");
  fireEvent.change(screen.getByRole("combobox", { name: "缩放" }), {
    target: { value: "actual" },
  });
  expect(spoken()).toBe("100%");
});

it("keeps focus on the percent menu and shows the new percent", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "放大" }));
  const menu = screen.getByRole("combobox", { name: "缩放" });
  menu.focus();
  fireEvent.change(menu, { target: { value: "actual" } });
  expect(document.activeElement).toBe(menu);
  expect(menu).toBeInstanceOf(HTMLSelectElement);
  expect((menu as HTMLSelectElement).selectedOptions[0]?.textContent).toBe(
    "100%",
  );
});

it("keeps focus at 25% and 400% and ignores another click or shortcut", () => {
  const api: { current: ZoomState | undefined } = { current: undefined };
  render(<Harness api={api} />);
  holdBound(api, "缩小", "zoomOut", 8, "25%");
  holdBound(api, "放大", "zoomIn", 16, "400%");
});

it("does not run a command from a closed-menu key", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "放大" }));
  const menu = screen.getByRole("combobox", { name: "缩放" });
  const init = { bubbles: true, cancelable: true };
  const k = "ArrowUp,ArrowDown,ArrowLeft,ArrowRight,Home,End,PageUp,PageDown";
  for (const key of k.split(",")) {
    const event = new KeyboardEvent("keydown", { ...init, key });
    menu.dispatchEvent(event);
    if (!event.defaultPrevented)
      fireEvent.change(menu, { target: { value: "actual" } });
    expect(spoken()).toBe("110%");
  }
  const alt = { ...init, altKey: true, key: "ArrowDown" };
  expect(menu.dispatchEvent(new KeyboardEvent("keydown", alt))).toBe(true);
});

it("does not render the controls before the page can be shown", () => {
  render(<Harness active={false} />);
  expect(screen.queryByRole("button", { name: "缩小" })).toBeNull();
  expect(screen.queryByRole("button", { name: "放大" })).toBeNull();
  expect(screen.queryByRole("combobox", { name: "缩放" })).toBeNull();
  expect(spoken()).toBe("");
});

it("keeps fit page and the footer inside the percent menu", () => {
  render(<Harness />);
  expect(screen.queryByRole("button", { name: "适合页面" })).toBeNull();
  expect(screen.getByRole("option", { name: "适合页面" }).title).toBe("");
  const footer = screen.getByRole("option", {
    name: "只缩放 PDF 原文栏；界面跟随系统缩放",
  });
  expect(footer.hasAttribute("disabled")).toBe(true);
});

it("shows Windows and linux shortcuts, and mac shortcuts on a Mac", () => {
  const rows = [
    ["button", "放大", "放大（Ctrl+=）", "放大（⌘=）"],
    ["button", "缩小", "缩小（Ctrl+−）", "缩小（⌘−）"],
    ["option", "实际大小", "实际大小（Ctrl+0）", "实际大小（⌘0）"],
    ["option", "适合宽度", "适合宽度（Ctrl+Alt+0）", "适合宽度（⌥⌘0）"],
  ] as const;
  for (const [agent, slot] of [
    ["Mozilla/5.0 (X11; Linux x86_64)", 2],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 3],
  ] as const) {
    useAgent(agent);
    const view = render(<Harness />);
    for (const row of rows) {
      expect(screen.getByRole(row[0], { name: row[1] }).title).toBe(row[slot]);
    }
    view.unmount();
  }
});

function Harness(props: {
  readonly active?: boolean;
  readonly api?: { current: ZoomState | undefined };
}): ReactElement {
  const column = useRef<HTMLDivElement | null>(null);
  const zoom = useZoom(props.active ?? true, "paper", { columnRef: column });
  if (props.api) props.api.current = zoom;
  return <ZoomControls active={props.active ?? true} zoom={zoom} />;
}

function holdBound(
  api: { current: ZoomState | undefined },
  name: "缩小" | "放大",
  key: "zoomOut" | "zoomIn",
  times: number,
  text: string,
): void {
  const button = () => screen.getByRole("button", { name });
  button().focus();
  for (let index = 0; index < times; index += 1) fireEvent.click(button());
  expect(button().getAttribute("aria-disabled")).toBe("true");
  expect(document.activeElement).toBe(button());
  fireEvent.click(button());
  act(() => {
    api.current?.commands[key]();
  });
  expect(spoken()).toBe(text);
}

function spoken(): string {
  return screen.getByRole("status").textContent;
}

function useAgent(agent: string): void {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(agent);
}
