export const PDF_WORKER_SRC = "oi-app://app/pdf.worker.js";

export const PDF_WASM_URL = "oi-app://app/";

export function assignWorkerSrc(pdf: {
  readonly GlobalWorkerOptions: { workerSrc: string };
}): void {
  pdf.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
}
