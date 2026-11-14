// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { GoToPage } from "../../src/ui/go-to-page.js";

afterEach(cleanup);

it("does not jump on 0 and returns focus after a jump or escape", () => {
  const jumped: number[] = [];
  render(
    <GoToPage
      page={1}
      pageCount={3}
      onJump={(page) => {
        jumped.push(page);
      }}
    />,
  );
  commit("0");
  expect(jumped).toEqual([]);
  expect(screen.getByRole("status").textContent).toBe("共 3 页");
  for (const value of ["1.5", "１"]) {
    fireEvent.change(screen.getByRole("textbox"), { target: { value } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(jumped).toEqual([]);
    expect(screen.getByRole("textbox")).toBeTruthy();
  }
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(jumped).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: /转到页码/ }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "9" } });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  expect(jumped).toEqual([]);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "2" } });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
  const button = screen.getByRole("button", { name: /转到页码/ });
  expect(jumped).toEqual([2]);
  expect(document.activeElement).toBe(button);
  fireEvent.click(button);
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: /转到页码/ }),
  );
});

function commit(value: string): void {
  fireEvent.click(screen.getByRole("button", { name: /转到页码/ }));
  const field = screen.getByRole("textbox");
  fireEvent.change(field, { target: { value } });
  fireEvent.keyDown(field, { key: "Enter" });
}
