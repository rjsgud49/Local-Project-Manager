import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import BuildViewer from "../components/BuildViewer";

type Grouped = {
    projectId: string;
    items: string[]; // index.html 경로들
};

/** 경로에서 대충 프로젝트/버전 추정:  .../<project>/<dist|build|out>/index.html */
function deriveProjectId(p: string) {
    const parts = p.split(/[/\\]+/);
    const iDist = parts.findIndex((n) => /^(dist|build|out)$/i.test(n));
    if (iDist > 0) return parts[iDist - 1];
    // 못 찾으면 상위 폴더명
    return parts[parts.length - 2] || "unknown";
}

export default function Home() {
    const [paths, setPaths] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        (async () => {
            const cached = await window.api.loadCache();
            if (cached.length > 0) {
                setPaths(cached);
                // fresh에 타입 명시
                window.api.fullSearch().then((fresh: string[]) => setPaths(fresh));
            } else {
                setLoading(true);
                const fresh = await window.api.fullSearch();
                setPaths(fresh);
                setLoading(false);
            }
        })();
    }, []);


    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return !q ? paths : paths.filter((p) => p.toLowerCase().includes(q));
    }, [paths, query]);

    const grouped = useMemo<Grouped[]>(() => {
        const map = new Map<string, string[]>();
        for (const p of filtered) {
            const id = deriveProjectId(p);
            if (!map.has(id)) map.set(id, []);
            map.get(id)!.push(p);
        }
        return Array.from(map.entries())
            .map(([projectId, items]) => ({ projectId, items }))
            .sort((a, b) => a.projectId.localeCompare(b.projectId));
    }, [filtered]);

    return (
        <div className="container">
            <div className="toolbar">
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={async () => {
                            setLoading(true);
                            const fresh = await window.api.fullSearch();
                            setPaths(fresh);
                            setLoading(false);
                        }}
                    >
                        전체 재검색
                    </button>
                    <input
                        placeholder="경로/프로젝트명 검색"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ flex: 1, minWidth: 240 }}
                    />
                    {loading && <span style={{ color: "var(--muted)" }}>🔍 전체 검색 중…</span>}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    찾은 아티팩트: <strong>{paths.length.toLocaleString()}</strong>개 · {format(new Date(), "yyyy.MM.dd HH:mm")}
                </div>
            </div>

            <div className="grid">
                {grouped.map((g) => (
                    <div key={g.projectId} className="card">
                        <div className="body">
                            <div className="title">{g.projectId}</div>
                            <div className="meta">{g.items.length} build(s)</div>
                            <ul className="list">
                                {g.items.map((p) => (
                                    <li key={p}>
                                        <code className="path">{p}</code>
                                        <button onClick={() => setSelected(p)} style={{ marginLeft: 8 }}>
                                            열기
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {selected && (
                <>
                    <h2 style={{ marginTop: 18 }}>데모 미리보기</h2>
                    <BuildViewer src={selected} />
                    <div style={{ marginTop: 8 }}>
                        <button onClick={() => setSelected(null)}>닫기</button>
                    </div>
                </>
            )}
        </div>
    );
}
