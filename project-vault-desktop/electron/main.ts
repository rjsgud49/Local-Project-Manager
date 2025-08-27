// electron/main.ts
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const electron = require("electron");
const { app, BrowserWindow, ipcMain, dialog, protocol } = electron;

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ProtocolRequest, ProtocolResponse } from "electron";

// ✅ NodeNext 모드에서는 .js 확장자 필요
// 꼭 .js 확장자!
import { fullSystemSearch } from "./search.js";
import { loadCache, saveCache } from "./cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win: import("electron").BrowserWindow | null = null;
const isDev = process.env.VITE_DEV_SERVER === "true";

async function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true
        },
        title: "Project Vault"
    });

    protocol.registerFileProtocol(
        "safe-file",
        (req: ProtocolRequest, cb: (resp: ProtocolResponse) => void) => {
            const url = req.url.replace("safe-file://", "");
            cb({ path: url });
        }
    );

    const w = win!; // ✅ 생성 직후라 non-null 단언

    if (isDev) {
        await w.loadURL("http://localhost:5173");
        w.webContents.openDevTools({ mode: "detach" });
    } else {
        const indexPath = path.join(__dirname, "../dist/index.html");
        await w.loadFile(indexPath);
    }

    w.on("closed", () => { win = null; });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle("vault:loadCache", async () => {
    return await loadCache();
});

ipcMain.handle("vault:fullSearch", async () => {
    const results = await fullSystemSearch();
    await saveCache(results);
    return results;
});

ipcMain.handle("vault:pathToFileUrl", async (_e: unknown, absPath: string) => {
    return pathToFileURL(absPath).toString();
});

ipcMain.handle("vault:chooseDir", async () => {
    if (!win) return null;
    const res = await dialog.showOpenDialog(win, { properties: ["openDirectory"] });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
});
