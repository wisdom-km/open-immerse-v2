import {
  viewBilingualEvent,
  viewOriginalEvent,
  viewTranslationEvent,
} from "./library-menu.js";

export type ViewShape = "none" | "original" | "contrast" | "translation";

export type PlainViewSlot = {
  readonly label: string;
  readonly event: string;
};

export type RadioViewSlot = {
  readonly label: string;
  readonly event: string;
  readonly type: "radio";
  readonly checked: boolean;
};

export type ViewSlotDescription = PlainViewSlot | RadioViewSlot;

const slots = [
  { label: "原文", event: viewOriginalEvent },
  { label: "对照", event: viewBilingualEvent },
  { label: "译文", event: viewTranslationEvent },
] as const;

export function viewSlotDescriptions(
  shape: ViewShape,
): readonly ViewSlotDescription[] {
  if (shape === "none") {
    return slots.map((slot) => ({ label: slot.label, event: slot.event }));
  }
  const active = checkedEvent(shape);
  return slots.map((slot) => ({
    label: slot.label,
    event: slot.event,
    type: "radio",
    checked: slot.event === active,
  }));
}

function checkedEvent(shape: Exclude<ViewShape, "none">): string {
  if (shape === "original") return viewOriginalEvent;
  if (shape === "contrast") return viewBilingualEvent;
  return viewTranslationEvent;
}
