import type { PageBox } from "./render-scale.js";

export type Pair = {
  readonly id: string;
  readonly generation: number;
};

export type PdfPaint = (
  page: number,
  canvas: HTMLCanvasElement,
) => Promise<void>;

export type PdfCancel = (canvas: HTMLCanvasElement) => void;

export type OpenedPdf = {
  readonly pageCount: number;
  readonly boxes?: readonly PageBox[];
  paint: PdfPaint;
  cancel: PdfCancel;
  close(): Promise<void>;
};

export type ReaderClient = {
  openDocument(id: string): Promise<{ ok: true } | { ok: false; code: string }>;
  bind(
    id: string,
  ): Promise<
    | { ok: true; assetId: string; generation: number; id: string }
    | { ok: false; code: string }
  >;
  readPage(
    id: string,
    generation: number,
  ): Promise<
    | {
        ok: true;
        id: string;
        generation: number;
        progressPage: number | null;
      }
    | { ok: false; code: string }
  >;
  writePage(id: string, generation: number, page: number): Promise<void>;
  revoke(id: string, generation: number): Promise<void>;
  openPdf(url: string): Promise<OpenedPdf | undefined>;
};

export function assetUrl(assetId: string): string {
  return `oi-asset://asset/${assetId}`;
}
