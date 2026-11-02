import type { AssetId } from "./ids.js";

export type FormulaCropDisplay = "inline" | "block";

export type MdFormulaCrop =
  | Readonly<{
      type: "formula_crop";
      display: FormulaCropDisplay;
      assetId: AssetId;
      fragmentId: string;
    }>
  | Readonly<{
      type: "formula_crop";
      display: FormulaCropDisplay;
      kind: "page_link";
      page: number;
      fragmentId: string;
    }>;
