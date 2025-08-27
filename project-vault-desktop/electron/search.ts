// electron/search.ts
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";

const IGNORE_DIRS = [
    "node_modules", ".git", ".cache", ".next", ".gradle",
    "Windows", "Program Files", "Program Files (x86)", "ProgramData",
    "AppData", "$Recycle.Bin", "System Volume Information",
    "Library", "Applications", "private", "usr", "var"
];

function isIgnored(full: string) {
    // 경로 경계 고려
    const parts = full.split(path.sep);
    return parts.some((p) => IGNORE_DIRS.includes(p));
}

function isArtifactIndex(absPath: string) {
    if (!absPath.toLowerCase().endsWith(`${path.sep}index.html`)) return false;
    const parent = path.basename(path.dirname(absPath)).toLowerCase();
    return parent === "dist" || parent === "build" || parent === "out";
}

async function walkCount(dir: string): Promise<number> {
    let count = 0;
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
            const full = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (isIgnored(full)) continue;
                count += 1;
                count += await walkCount(full);
            }
        }
    } catch { /* 권한 문제 무시 */ }
    return count;
}

export async function fullSystemSearchWithProgress(
    onProgress: (p: { scanned: number; total: number; percent: number; current?: string }) => void
): Promise<string[]> {
    // 루트 후보
    let roots: string[];
    if (process.platform === "win32") {
        const candidates = ["C:/", "D:/", "E:/", "F:/"];
        roots = candidates.filter((d) => {
            try { return fssync.existsSync(d); } catch { return false; }
        });
        const home = os.homedir().replace(/\\/g, "/");
        roots.push(home);
    } else {
        roots = [os.homedir()];
    }
    roots = Array.from(new Set(roots));

    // 1) 전체 디렉터리 개수 세기
    let total = 0;
    for (const r of roots) total += await walkCount(path.resolve(r));
    if (total === 0) total = 1; // 0분모 방지

    let scanned = 0;
    const results: string[] = [];

    async function walkScan(dir: string) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const ent of entries) {
                const full = path.join(dir, ent.name);
                if (ent.isDirectory()) {
                    if (isIgnored(full)) continue;
                    scanned += 1;
                    if (scanned % 50 === 0) {
                        onProgress({
                            scanned, total, percent: Math.min(100, Math.round((scanned / total) * 100)),
                            current: full
                        });
                    }
                    await walkScan(full);
                } else if (ent.isFile()) {
                    if (isArtifactIndex(full)) results.push(full);
                }
            }
        } catch { /* 권한 문제 무시 */ }
    }

    for (const r of roots) await walkScan(path.resolve(r));

    // 마지막 100% 이벤트
    onProgress({ scanned: total, total, percent: 100 });
    return Array.from(new Set(results)).sort();
}

// 기존 invoke용(진행률 없이 한 방에)
export async function fullSystemSearch(): Promise<string[]> {
    return fullSystemSearchWithProgress(() => { });
}
