import { useCallback, useState } from "react";

export type ReaderViewMode = "original" | "contrast" | "translation";

export function useViewMode(documentId: string): {
  readonly mode: ReaderViewMode;
  readonly select: (mode: ReaderViewMode) => void;
} {
  const [mode, setMode] = useState<ReaderViewMode>("original");
  const [seenId, setSeenId] = useState(documentId);
  if (seenId !== documentId) {
    setSeenId(documentId);
    setMode("original");
  }
  const select = useCallback((next: ReaderViewMode) => {
    setMode(next);
  }, []);
  return { mode, select };
}
