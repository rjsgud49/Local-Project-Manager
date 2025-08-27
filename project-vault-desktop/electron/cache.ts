import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const CACHE_PATH = path.join(os.homedir(), ".project-vault-cache.json");

export async function loadCache(): Promise<string[]> {
    try {
        const raw = await fs.readFile(CACHE_PATH, "utf-8");
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export async function saveCache(data: string[]) {
    try {
        await fs.writeFile(CACHE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch {
        // 무시
    }
}
