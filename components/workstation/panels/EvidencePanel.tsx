import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import type { EvidenceItem } from "@/engine/evidence/types";

const CATEGORY_LABEL: Record<string, string> = {
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

function collectItems(evidence: WorkstationPanelProps["research"]["report"]["evidence"]) {
    const categories = ["financial", "management", "ipo", "market", "industry", "news", "sec", "quote", "financialStatements"] as const;

    return categories.map(category => {
        const items = Object.values(evidence[category]) as EvidenceItem<unknown>[];
        const verifiedCount = items.filter(i => i.verified).length;

        return {
            category,
            label: CATEGORY_LABEL[category],
            total: items.length,
            verified: verifiedCount,
            allVerified: verifiedCount === items.length,
        };
    });
}

export default function EvidencePanel({ research }: WorkstationPanelProps) {
    const categories = collectItems(research.report.evidence);
    const totalItems = categories.reduce((sum, c) => sum + c.total, 0);
    const totalVerified = categories.reduce((sum, c) => sum + c.verified, 0);
    const overallPct = totalItems > 0 ? Math.round((totalVerified / totalItems) * 100) : 0;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Evidence Status</h2>
                <span className="text-sm font-semibold text-white">{overallPct}% verified</span>
            </div>

            <div className="space-y-2">
                {categories.map(c => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-zinc-300">
                            <span className={c.allVerified ? "text-emerald-400" : c.verified > 0 ? "text-amber-400" : "text-zinc-600"}>
                                {c.allVerified ? "✓" : c.verified > 0 ? "⚠" : "×"}
                            </span>
                            {c.label}
                        </span>
                        <span className="text-zinc-500">{c.verified}/{c.total} fields</span>
                    </div>
                ))}
            </div>

            <p className="mt-3 text-xs text-zinc-600">
                Unverified fields have no live provider wired in yet — see docs on evidence builders.
            </p>
        </div>
    );
}
