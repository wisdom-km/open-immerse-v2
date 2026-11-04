export type IpcSenderFrame = {
  readonly url: string;
};

export type IpcInvokeEvent = {
  readonly senderFrame: IpcSenderFrame | null;
  readonly sender: {
    readonly id: number;
  };
};

export type AppWindow = {
  readonly senderId: number;
  readonly mainFrame: IpcSenderFrame;
};

export function isAppSender(
  event: IpcInvokeEvent,
  windows: readonly AppWindow[],
): boolean {
  const frame = event.senderFrame;
  if (frame === null || !isOiAppUrl(frame.url)) {
    return false;
  }
  return windows.some(
    (win) => win.senderId === event.sender.id && win.mainFrame === frame,
  );
}

function isOiAppUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "oi-app:";
  } catch {
    return false;
  }
}
