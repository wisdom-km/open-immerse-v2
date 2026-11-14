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
      onBack={() => (backs += 1)}
      onForward={() => (forwards += 1)}
    />
  );
  const view = render(draw(false));
  const named = (name: string) => screen.getByRole("button", { name });
  fireEvent.click(named("后退"));
  expect(backs).toBe(0);
  expect(named("后退").title).toBe("后退");
  expect(named("前进").title).toBe("前进");
  expect(named("前进").getAttribute("aria-disabled")).toBe("true");
  view.rerender(draw(true));
  expect(named("前进").getAttribute("aria-disabled")).toBeNull();
  fireEvent.click(named("前进"));
  expect(forwards).toBe(1);
});
