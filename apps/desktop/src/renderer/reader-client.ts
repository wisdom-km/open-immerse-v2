import { loadAssetPdf, type ReaderClient } from "@oi/feature-reader/ui";

type CommandResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: string } };

type DesktopOi = {
  readonly ingest: {
    openDocument(input: {
      readonly id: string;
    }): Promise<CommandResult<{ readonly jobId: string }>>;
  };
  readonly library: {
    bindReadingAsset(input: { readonly id: string }): Promise<
      CommandResult<{
        readonly id: string;
        readonly assetId: string;
        readonly generation: number;
      }>
    >;
    getProgressPage(input: {
      readonly id: string;
      readonly generation: number;
    }): Promise<
      CommandResult<{
        readonly id: string;
        readonly generation: number;
        readonly progressPage: number | null;
      }>
    >;
    setProgressPage(input: {
      readonly id: string;
      readonly generation: number;
      readonly progressPage: number;
    }): Promise<unknown>;
    revokeReadingAsset(input: {
      readonly id: string;
      readonly generation: number;
    }): Promise<unknown>;
  };
};

export function desktopReaderClient(): ReaderClient {
  const oi = (window as unknown as { readonly oi: DesktopOi }).oi;
  return {
    async openDocument(id) {
      const result = await oi.ingest.openDocument({ id });
      if (!result.ok) {
        return { ok: false, code: result.error.code };
      }
      return { ok: true };
    },
    async bind(id) {
      const result = await oi.library.bindReadingAsset({ id });
      if (!result.ok) {
        return { ok: false, code: result.error.code };
      }
      return {
        ok: true,
        id: result.value.id,
        assetId: result.value.assetId,
        generation: result.value.generation,
      };
    },
    async readPage(id, generation) {
      const result = await oi.library.getProgressPage({ id, generation });
      if (!result.ok) {
        return { ok: false, code: result.error.code };
      }
      return { ok: true, ...result.value };
    },
    async writePage(id, generation, progressPage) {
      await oi.library.setProgressPage({ id, generation, progressPage });
    },
    async revoke(id, generation) {
      await oi.library.revokeReadingAsset({ id, generation });
    },
    openPdf: loadAssetPdf,
  };
}
