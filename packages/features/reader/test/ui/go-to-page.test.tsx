// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, expect, it } from "vitest";

import { GoToPage, type GoToHandle } from "../../src/ui/go-to-page.js";
import { navCommands, type ZoomNav } from "../../src/ui/use-bound-nav.js";

afterEach(cleanup);

it("does not jump on 0 and returns focus after a jump or escape", () => {
  const jumped: number[] = [];
  render(
    <GoToPage page={1} pageCount={3} onJump={(page) => jumped.push(page)} />,
  );
  commit("0");
  expect(jumped).toEqual([]);
  expect(screen.getByRole("status").textContent).toBe("共 3 页");
  for (const value of ["1.5", "１", "9"]) commit(value);
  expect(jumped).toEqual([]);
  expect(screen.getByRole("textbox")).toBeTruthy();
  commit("");
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(document.activeElement).toBe(pageButton());
  commit("2");
  expect(jumped).toEqual([2]);
  expect(document.activeElement).toBe(pageButton());
  fireEvent.click(pageButton());
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  expect(document.activeElement).toBe(pageButton());
});

it("back closes the open page box and skips history and leave", () => {
  let go: GoToHandle | undefined;
  const hit = { history: 0, leave: 0 };
  const bind = (handle: GoToHandle | undefined): void => {
    go = handle;
  };
  render(<GoToPage page={4} pageCount={9} onJump={noop} onBindOpen={bind} />);
  fireEvent.click(pageButton());
  act(() => {
    navCommands(
      { canBack: true, back: () => (hit.history += 1), forward: noop },
      () => (hit.leave += 1),
      { current: go },
      { zoomIn: noop } as ZoomNav,
    ).back();
  });
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(document.activeElement).toBe(pageButton());
  expect(hit).toEqual({ history: 0, leave: 0 });
});

const noop = (): void => undefined;

function pageButton(): HTMLElement {
  return screen.getByRole("button", { name: /转到页码/ });
}

function commit(value: string): void {
  if (!screen.queryByRole("textbox")) {
    fireEvent.click(screen.getByRole("button", { name: /转到页码/ }));
  }
  const field = screen.getByRole("textbox");
  fireEvent.change(field, { target: { value } });
  fireEvent.keyDown(field, { key: "Enter" });
}
