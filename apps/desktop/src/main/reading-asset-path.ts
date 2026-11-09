import type { LibraryMain } from "@oi/feature-library/main";
import {
  dataRootLayout,
  librarySourcePath,
  type DataRootLayout,
} from "@oi/platform-node";

import type { ReadingAssetPort } from "./reading-asset-protocol.js";

type AssetLocator = Pick<LibraryMain, "locate">;

export function createReadingAssetPath(
  main: AssetLocator,
  dataRoot: string,
): ReadingAssetPort {
  const layout = dataRootLayout(dataRoot);
  return (assetId) => sourceFor(main, layout, assetId);
}

function sourceFor(
  main: AssetLocator,
  layout: DataRootLayout,
  assetId: string,
): string | undefined {
  const id = main.locate(assetId);
  if (id === undefined) {
    return undefined;
  }
  const located = librarySourcePath(layout, id);
  if (!located.ok) {
    return undefined;
  }
  return located.value;
}
