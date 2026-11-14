// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { HistoryControls } from "../../src/ui/history-controls.js";

afterEach(cleanup);

it("ignores an empty back and steps forward once that side is enabled", () => {
  let backs = 0;
  let forwards = 0;
  const draw = (forward: boolean) => (
    <HistoryControls
      canBack={false}
      canForward={forward}
      onBack={() => {
        backs += 1;
      }}
      onForward={() => {
        forwards += 1;
      }}
    />
  );
  const view = render(draw(false));
  fireEvent.click(screen.getByRole("button", { name: "后退" }));
  expect(backs).toBe(0);
  expect(
    screen.getByRole("button", { name: "前进" }).getAttribute("aria-disabled"),
  ).toBe("true");
  view.rerender(draw(true));
  const next = screen.getByRole("button", { name: "前进" });
  expect(next.getAttribute("aria-disabled")).toBeNull();
  fireEvent.click(next);
  expect(forwards).toBe(1);
});

it("puts the platform shortcut in the tooltip", () => {
  const rows = [
    ["MacIntel", "后退（⌘[）", "前进（⌘]）"],
    ["Win32", "后退（Alt+←）", "前进（Alt+→）"],
  ] as const;
  for (const [platform, back, forward] of rows) {
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      value: platform,
    });
    render(
      <HistoryControls
        canBack={false}
        canForward={false}
        onBack={() => undefined}
        onForward={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "后退" }).title).toBe(back);
    expect(screen.getByRole("button", { name: "前进" }).title).toBe(forward);
    cleanup();
  }
});
