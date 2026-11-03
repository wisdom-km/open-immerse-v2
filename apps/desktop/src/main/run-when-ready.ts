export function runWhenReady(
  ready: Promise<void>,
  start: () => void,
  onError: (error: unknown) => void,
): void {
  void ready.then(start).catch(onError);
}
