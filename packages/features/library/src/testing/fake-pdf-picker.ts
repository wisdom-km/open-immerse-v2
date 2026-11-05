import type { PdfPick, PdfPicker } from "../application/ports/pdf-picker.js";

export function createFakePdfPicker(picks: readonly PdfPick[]): PdfPicker & {
  readonly calls: () => number;
} {
  const state = { index: 0 };
  return {
    calls() {
      return state.index;
    },
    pick() {
      const next = picks[state.index] ?? { kind: "cancelled" };
      state.index += 1;
      return next;
    },
  };
}
