import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", {
    loadCache: () => ipcRenderer.invoke("vault:loadCache"),
    fullSearch: () => ipcRenderer.invoke("vault:fullSearch"),
    pathToFileUrl: (absPath) => ipcRenderer.invoke("vault:pathToFileUrl", absPath),
    chooseDir: () => ipcRenderer.invoke("vault:chooseDir")
});
