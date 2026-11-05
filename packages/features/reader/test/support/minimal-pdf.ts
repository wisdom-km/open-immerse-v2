export function minimalPdf(): Uint8Array {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 400] >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(byteLength(body));
    body += `${String(index + 1)} 0 obj\n${object}\nendobj\n`;
  }
  const xrefAt = byteLength(body);
  body += `xref\n0 ${String(objects.length + 1)}\n`;
  body += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${String(objects.length + 1)} /Root 1 0 R >>\n`;
  body += `startxref\n${String(xrefAt)}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}
