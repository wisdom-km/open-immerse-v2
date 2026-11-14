export const openFileEvent = "oi-open-file";
export const returnLibraryEvent = "oi-return-library";
export const historyBackEvent = "oi-history-back";
export const historyForwardEvent = "oi-history-forward";
export const goToPageEvent = "oi-go-to-page";

export const readerMenuEvents = [
  historyBackEvent,
  historyForwardEvent,
  goToPageEvent,
] as const;
