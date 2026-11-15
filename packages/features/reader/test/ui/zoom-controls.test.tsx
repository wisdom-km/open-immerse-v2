// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, type ReactElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { useZoom } from "../../src/ui/use-zoom.js";
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

it("disables zoom out at 25% and zoom in at 400%", () => {
  render(<Harness />);
  const zoomOut = () => screen.getByRole("button", { name: "缩小" });
  const zoomIn = () => screen.getByRole("button", { name: "放大" });
  for (let index = 0; index < 8; index += 1) fireEvent.click(zoomOut());
  expect(zoomOut().hasAttribute("disabled")).toBe(true);
  expect(spoken()).toBe("25%");
  fireEvent.click(zoomOut());
  expect(spoken()).toBe("25%");
  for (let index = 0; index < 16; index += 1) fireEvent.click(zoomIn());
  expect(zoomIn().hasAttribute("disabled")).toBe(true);
  expect(spoken()).toBe("400%");
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
  useAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36");
  const view = render(<Harness />);
  expect(screen.getByRole("button", { name: "放大" }).title).toBe(
    "放大（Ctrl+=）",
  );
  expect(screen.getByRole("button", { name: "缩小" }).title).toBe(
    "缩小（Ctrl+−）",
  );
  expect(screen.getByRole("option", { name: "实际大小" }).title).toBe(
    "实际大小（Ctrl+0）",
  );
  expect(screen.getByRole("option", { name: "适合宽度" }).title).toBe(
    "适合宽度（Ctrl+Alt+0）",
  );
  view.unmount();
  useAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
  render(<Harness />);
  expect(screen.getByRole("button", { name: "放大" }).title).toBe("放大（⌘=）");
  expect(screen.getByRole("button", { name: "缩小" }).title).toBe("缩小（⌘−）");
  expect(screen.getByRole("option", { name: "实际大小" }).title).toBe(
    "实际大小（⌘0）",
  );
  expect(screen.getByRole("option", { name: "适合宽度" }).title).toBe(
    "适合宽度（⌥⌘0）",
  );
});

function Harness(props: { readonly active?: boolean }): ReactElement {
  const column = useRef<HTMLDivElement | null>(null);
  const zoom = useZoom(props.active ?? true, "paper", { columnRef: column });
  return <ZoomControls active={props.active ?? true} zoom={zoom} />;
}

function spoken(): string {
  return screen.getByRole("status").textContent;
}

function useAgent(agent: string): void {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(agent);
}
