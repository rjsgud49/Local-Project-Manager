import { useEffect, useState } from "react";

export default function BuildViewer({ src }: { src: string }) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (/^https?:\/\//i.test(src) || /^file:\/\//i.test(src)) {
                if (alive) setFileUrl(src);
            } else {
                const url = await window.api.pathToFileUrl(src);
                if (alive) setFileUrl(url);
            }
        })();
        return () => { alive = false; };
    }, [src]);

    if (!fileUrl) return <div style={{ padding: 12 }}>로딩 중…</div>;

    return (
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", height: 560 }}>
            <iframe title="build" src={fileUrl} style={{ width: "100%", height: "560px", border: 0 }} />
        </div>
    );
}
