import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { DataBar } from "../design/DesignPrimitives";

const CATEGORIES = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote", "financialStatements"] as const;

const LABELS: Record<(typeof CATEGORIES)[number], string> = {
    financial: "Financial",
    management: "Management",
    ipo: "IPO",
    market: "Market",
    industry: "Industry",
    news: "News",
    sec: "SEC",
    quote: "Quote",
    financialStatements: "Statements",
};

export default function EvidenceModule({ research }: WorkstationPanelProps) {
    const evidence = research.report.evidence;

    const rows = CATEGORIES.map((key) => {
        const items = Object.values(evidence[key]) as { verified: boolean }[];
        const verified = items.filter((i) => i.verified).length;
        return { key, label: LABELS[key], verified, total: items.length };
    });

    const totalItems = rows.reduce((sum, r) => sum + r.total, 0);
    const totalVerified = rows.reduce((sum, r) => sum + r.verified, 0);
    const overallPct = totalItems > 0 ? Math.round((totalVerified / totalItems) * 100) : 0;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Evidence Coverage</h3>
                <span className="text-[10px] text-zinc-500">{overallPct}% verified - {totalItems} fields</span>
            </div>
            <div className="space-y-2">
                {rows.map((r) => (
                    <DataBar
                        key={r.key}
                        value={r.total > 0 ? (r.verified / r.total) * 100 : 0}
                        label={r.label}
                        right={`${r.verified}/${r.total}`}
                        tone={r.verified > 0 ? "positive" : "neutral"}
                    />
                ))}
            </div>
        </div>
    );
}
