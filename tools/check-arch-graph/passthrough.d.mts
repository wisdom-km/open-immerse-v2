export function isFeatureIndex(ref: string): boolean;

export function classifyFeatureIndex(
  text: string,
):
  | { readonly kind: "passthrough" }
  | { readonly kind: "impure"; readonly line: number };
