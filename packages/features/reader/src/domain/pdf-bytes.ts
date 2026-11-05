const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d];

/** 只认 %PDF- 头。不读路径。 */
export function looksLikePdf(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_HEADER.length) {
    return false;
  }
  return PDF_HEADER.every((byte, index) => bytes[index] === byte);
}
