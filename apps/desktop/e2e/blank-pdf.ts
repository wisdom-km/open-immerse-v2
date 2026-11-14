export function blankPdf(pageCount: number): string {
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];
  const add = (body: string): void => {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"));
    chunks.push(body);
  };
  const kids = Array.from(
    { length: pageCount },
    (_unused, index) => `${String(index + 3)} 0 R`,
  ).join(" ");
  const contentId = pageCount + 3;
  add("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  add(
    `2 0 obj\n<< /Type /Pages /Count ${String(pageCount)} /Kids [${kids}] >>\nendobj\n`,
  );
  for (let index = 0; index < pageCount; index += 1) {
    const id = index + 3;
    add(
      `${String(id)} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 400] /Contents ${String(contentId)} 0 R /Resources << >> >>\nendobj\n`,
    );
  }
  add(
    `${String(contentId)} 0 obj\n<< /Length 0 >>\nstream\nendstream\nendobj\n`,
  );
  const startxref = Buffer.byteLength(chunks.join(""), "utf8");
  const size = contentId + 1;
  let xref = `xref\n0 ${String(size)}\n0000000000 65535 f \n`;
  for (let index = 1; index < size; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  chunks.push(xref);
  chunks.push(
    `trailer\n<< /Size ${String(size)} /Root 1 0 R >>\nstartxref\n${String(startxref)}\n%%EOF\n`,
  );
  return chunks.join("");
}
