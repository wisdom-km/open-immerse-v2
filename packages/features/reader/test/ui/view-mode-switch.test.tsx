// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { ViewModeSwitch } from "../../src/ui/view-mode-switch.js";

afterEach(() => {
  cleanup();
});

it("keeps exactly one radio selected in the 栏位 group", () => {
  const onSelect = vi.fn();
  const view = render(<ViewModeSwitch mode="original" onSelect={onSelect} />);
  const group = screen.getByRole("radiogroup", { name: "栏位" });
  for (const name of ["原文", "对照", "译文"]) {
    const radio = screen.getByRole("radio", { name });
    expect(group.contains(radio)).toBe(true);
  }
  expect(selected()).toEqual(["原文"]);
  fireEvent.click(screen.getByRole("radio", { name: "对照" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("contrast");
  view.rerender(<ViewModeSwitch mode="contrast" onSelect={onSelect} />);
  expect(selected()).toEqual(["对照"]);
  fireEvent.click(screen.getByRole("radio", { name: "对照" }));
  expect(onSelect).toHaveBeenCalledTimes(1);
});

function selected(): string[] {
  return ["原文", "对照", "译文"].filter((name) => {
    const node = screen.getByRole("radio", { name });
    return node instanceof HTMLInputElement && node.checked;
  });
}
