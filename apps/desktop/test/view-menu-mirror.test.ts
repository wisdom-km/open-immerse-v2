import { expect, it } from "vitest";

import {
  viewBilingualEvent,
  viewOriginalEvent,
  viewTranslationEvent,
} from "../src/main/library-menu.js";
import {
  viewSlotDescriptions,
  type RadioViewSlot,
  type ViewShape,
  type ViewSlotDescription,
} from "../src/main/view-menu-mirror.js";

const labels = ["原文", "对照", "译文"] as const;
const events = [
  viewOriginalEvent,
  viewBilingualEvent,
  viewTranslationEvent,
] as const;

it("omits checked on all three slots when the shape is none", () => {
  const slots = viewSlotDescriptions("none");
  expect(slots.map((slot) => slot.label)).toEqual([...labels]);
  expect(slots.map((slot) => slot.event)).toEqual([...events]);
  for (const slot of slots) {
    expect(slot).not.toHaveProperty("checked");
    expect(slot).not.toHaveProperty("type");
  }
});

it("checks only the original radio when the shape is original", () => {
  expectOneRadio("original", viewOriginalEvent);
});

it("checks only the contrast radio when the shape is contrast", () => {
  expectOneRadio("contrast", viewBilingualEvent);
});

it("checks only the translation radio when the shape is translation", () => {
  expectOneRadio("translation", viewTranslationEvent);
});

function expectOneRadio(
  shape: Exclude<ViewShape, "none">,
  event: string,
): void {
  const slots = viewSlotDescriptions(shape);
  expect(slots).toHaveLength(3);
  const radios = slots.filter(isRadio);
  expect(radios).toHaveLength(3);
  const checked = radios.filter((slot) => slot.checked);
  expect(checked.map((slot) => slot.event)).toEqual([event]);
  expect(radios.filter((slot) => !slot.checked)).toHaveLength(2);
}

function isRadio(slot: ViewSlotDescription): slot is RadioViewSlot {
  return "type" in slot;
}
