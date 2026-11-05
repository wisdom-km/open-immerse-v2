export type PdfPick =
  | { readonly kind: "chosen"; readonly filePath: string }
  | { readonly kind: "cancelled" };

/** main 注入。切片里不导入 electron。 */
export type PdfPicker = {
  pick(): PdfPick;
};
