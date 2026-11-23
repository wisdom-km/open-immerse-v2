// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { ViewModeEmpty } from "../../src/ui/view-mode-empty.js";

const APPROVED_EMPTY = "本阶段暂不提供译文，请先阅读原文。";
const APPROVED_WIN = "切到原文（Ctrl+1）";
const APPROVED_MAC = "切到原文（⌘1）";

afterEach(() => {
  cleanup();
  setAgent("");
});

it("uses the approved Windows sentence and a text link", () => {
  setAgent("Windows");
  const onOriginal = vi.fn();
  render(<ViewModeEmpty onOriginal={onOriginal} />);
  const region = emptyRegion();
  expect(copyText(region)).toBe(APPROVED_EMPTY);
  expect(
    region.querySelector("[data-slot='view-mode-empty-degrade']")?.textContent,
  ).toBe("");
  expect(region.querySelectorAll("button")).toHaveLength(0);
  expect(screen.queryByRole("button", { name: "开始翻译" })).toBeNull();
  expect(screen.queryByText("去设置")).toBeNull();
  const link = screen.getByRole("link", { name: APPROVED_WIN });
  expect(link.textContent).toBe(APPROVED_WIN);
  fireEvent.click(link);
  expect(onOriginal).toHaveBeenCalledTimes(1);
});

it("uses the approved mac link sentence", () => {
  setAgent("Mac");
  render(<ViewModeEmpty onOriginal={() => undefined} />);
  const region = emptyRegion();
  expect(copyText(region)).toBe(APPROVED_EMPTY);
  const link = screen.getByRole("link", { name: APPROVED_MAC });
  expect(link.textContent).toBe(APPROVED_MAC);
  expect(screen.queryByRole("link", { name: APPROVED_WIN })).toBeNull();
});

function copyText(region: HTMLElement): string | null | undefined {
  return region.querySelector("[data-slot='view-mode-empty-copy']")
    ?.textContent;
}

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
