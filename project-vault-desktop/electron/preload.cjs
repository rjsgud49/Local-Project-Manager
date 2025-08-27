// CommonJS preload: Electron이 항상 잘 로드함
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    loadCache: () => ipcRenderer.invoke("vault:loadCache"),
    fullSearch: () => ipcRenderer.invoke("vault:fullSearch"),
    pathToFileUrl: (absPath) => ipcRenderer.invoke("vault:pathToFileUrl", absPath),
    chooseDir: () => ipcRenderer.invoke("vault:chooseDir"),

    // 진행률/결과 이벤트
    onSearchProgress: (cb) => ipcRenderer.on("vault:searchProgress", (_e, p) => cb(p)),
    onSearchResult: (cb) => ipcRenderer.on("vault:searchResult", (_e, r) => cb(r)),
    startFullSearch: () => ipcRenderer.send("vault:startFullSearch"),
});
