// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import {
  VIEW_EMPTY_COPY,
  VIEW_ORIGINAL_LINK_MAC,
  VIEW_ORIGINAL_LINK_WIN,
} from "../../src/ui/copy.js";
import { ViewModeEmpty } from "../../src/ui/view-mode-empty.js";

afterEach(() => {
  cleanup();
  setAgent("");
});

it("uses the approved Windows sentence and a text link", () => {
  setAgent("Windows");
  const onOriginal = vi.fn();
  render(<ViewModeEmpty onOriginal={onOriginal} />);
  const region = emptyRegion();
  expect(region.textContent).toContain(VIEW_EMPTY_COPY);
  expect(
    region.querySelector("[data-slot='view-mode-empty-degrade']")?.textContent,
  ).toBe("");
  expect(region.querySelectorAll("button")).toHaveLength(0);
  expect(screen.queryByRole("button", { name: "开始翻译" })).toBeNull();
  expect(screen.queryByText("去设置")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: VIEW_ORIGINAL_LINK_WIN }));
  expect(onOriginal).toHaveBeenCalledTimes(1);
});

it("uses the approved mac link sentence", () => {
  setAgent("Mac");
  render(<ViewModeEmpty onOriginal={() => undefined} />);
  expect(
    screen.getByRole("link", { name: VIEW_ORIGINAL_LINK_MAC }),
  ).toBeTruthy();
  expect(
    screen.queryByRole("link", { name: VIEW_ORIGINAL_LINK_WIN }),
  ).toBeNull();
});

function emptyRegion(): HTMLElement {
  const node = document.querySelector(".oi-reader-view-empty");
  if (!(node instanceof HTMLElement)) {
    throw new Error("empty");
  }
  return node;
}

function setAgent(value: string): void {
  const host = window as Window & {
    happyDOM?: { settings: { navigator: { userAgent: string } } };
  };
  if (host.happyDOM !== undefined) {
    host.happyDOM.settings.navigator.userAgent = value;
  }
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    get: () => value,
  });
}
