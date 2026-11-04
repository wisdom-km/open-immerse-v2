const calloutPattern = /^\[!([A-Za-z][\w-]*)\]/;

export function calloutType(opening: string): string | null {
  const matched = calloutPattern.exec(opening.trimStart());
  const type = matched?.[1];
  if (type === undefined) {
    return null;
  }
  return type;
}
