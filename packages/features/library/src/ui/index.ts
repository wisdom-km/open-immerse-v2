import type { ComponentType } from "react";

import { LibraryApp } from "./library-app.js";

export type SlotContribution = {
  readonly slot: "home.library";
  readonly order: number;
  readonly component: ComponentType;
};

export const libraryContribution: SlotContribution = {
  slot: "home.library",
  order: 0,
  component: LibraryApp,
};
