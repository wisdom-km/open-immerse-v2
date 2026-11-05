import {
  contextBridge,
  ipcRenderer,
  webUtils,
  type IpcRendererEvent,
} from "electron";

import { createOi, type IpcBridge } from "./oi.generated.js";

const bridge: IpcBridge = {
  invoke(channel, payload) {
    return ipcRenderer.invoke(channel, payload);
  },
  invokeDropped(channel, file, payload) {
    const absolutePath = webUtils.getPathForFile(file);
    return ipcRenderer.invoke(channel, payload, absolutePath);
  },
  subscribe(channel, listener) {
    const wrapped = (_event: IpcRendererEvent, payload: unknown): void => {
      listener(payload);
    };
    ipcRenderer.on(channel, wrapped);
    return () => {
      ipcRenderer.removeListener(channel, wrapped);
    };
  },
};

contextBridge.exposeInMainWorld("oi", createOi(bridge));
