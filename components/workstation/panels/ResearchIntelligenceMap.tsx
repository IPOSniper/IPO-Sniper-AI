import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const CATEGORIES = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote"] as const;

const LABELS: Record<(typeof CATEGORIES)[number], string> = {
    financial: "Financial",
    management: "Management",
    ipo: "IPO",
    market: "Market",
    industry: "Industry",
    news: "News",
    sec: "SEC",
    quote: "Quote",
};

export default function ResearchIntelligenceMap({ research }: WorkstationPanelProps) {
    const evidence = research.report.evidence;

    const points = CATEGORIES.map((key, i) => {
        const items = Object.values(evidence[key]) as { verified: boolean }[];
        const pct = items.length > 0 ? Math.round((items.filter(x => x.verified).length / items.length) * 100) : 0;
        const angle = (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2;
        const r = 30 + (pct / 100) * 30;
        return {
            key,
            pct,
            angle,
            x: 50 + r * Math.cos(angle),
            y: 50 + r * Math.sin(angle),
            labelX: 50 + 46 * Math.cos(angle),
            labelY: 50 + 46 * Math.sin(angle),
        };
    });

    const overall = Math.round(points.reduce((sum, p) => sum + p.pct, 0) / points.length);
    const polygon = points.map(p => `${p.x},${p.y}`).join(" ");

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Research Intelligence Map</h3>
            <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
                <svg viewBox="0 0 100 100" className="h-full w-full">
                    {[20, 30, 40, 50, 60].map(r => (
                        <circle key={r} cx="50" cy="50" r={r * 0.6} fill="none" stroke="#27272a" strokeWidth="0.3" />
                    ))}
                    <polygon points={polygon} fill="#10b98133" stroke="#10b981" strokeWidth="1" />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-400">{overall}%</span>
                    <span className="text-[9px] text-zinc-500">Overall Coverage</span>
                </div>
                {points.map(p => (
                    <div
                        key={p.key}
                        className="absolute -translate-x-1/2 -translate-y-1/2 text-center text-[9px] text-zinc-500"
                        style={{ left: `${p.labelX}%`, top: `${p.labelY}%` }}
                    >
                        <div>{LABELS[p.key]}</div>
                        <div className="font-semibold text-zinc-300">{p.pct}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
