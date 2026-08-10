import { EvidenceEngine } from "@/engine/evidence/evidenceEngine";
import type { EvidenceItem } from "@/engine/evidence/types";

interface PageProps {
    searchParams: Promise<{ ticker?: string }>;
}

interface ProviderStatus {
    category: string;
    fields: number;
    verified: number;
    avgConfidence: number;
    source: string;
    status: "live" | "partial" | "unwired";
}

function summarize(category: string, items: EvidenceItem<unknown>[]): ProviderStatus {
    const verified = items.filter(i => i.verified).length;
    const avgConfidence = items.length > 0
        ? Math.round(items.reduce((sum, i) => sum + i.confidence, 0) / items.length)
        : 0;

    const sources = new Set(items.map(i => i.source));
    const source = sources.size === 1 ? [...sources][0] : "MIXED";

    const status: ProviderStatus["status"] =
        verified === items.length ? "live" :
        verified > 0 ? "partial" :
        "unwired";

    return { category, fields: items.length, verified, avgConfidence, source, status };
}

const STATUS_STYLE: Record<ProviderStatus["status"], string> = {
    live: "text-emerald-400",
    partial: "text-amber-400",
    unwired: "text-red-400",
};

const STATUS_LABEL: Record<ProviderStatus["status"], string> = {
    live: "✓ Live",
    partial: "⚠ Partial",
    unwired: "× Unwired",
};

export default async function ProviderHealthPage({ searchParams }: PageProps) {
    const { ticker } = await searchParams;
    const testTicker = ticker?.toUpperCase() || "RKLB";

    const evidenceEngine = new EvidenceEngine();

    let evidence;
    let loadError: string | null = null;

    try {
        evidence = await evidenceEngine.build(testTicker);
    } catch (error) {
        loadError = error instanceof Error ? error.message : "Unknown error building evidence.";
    }

    const providers: ProviderStatus[] = evidence ? [
        summarize("Financial", Object.values(evidence.financial) as EvidenceItem<unknown>[]),
        summarize("Management", Object.values(evidence.management) as EvidenceItem<unknown>[]),
        summarize("IPO", Object.values(evidence.ipo) as EvidenceItem<unknown>[]),
        summarize("Market", Object.values(evidence.market) as EvidenceItem<unknown>[]),
        summarize("Industry", Object.values(evidence.industry) as EvidenceItem<unknown>[]),
        summarize("News", Object.values(evidence.news) as EvidenceItem<unknown>[]),
        summarize("SEC", Object.values(evidence.sec) as EvidenceItem<unknown>[]),
    ] : [];

    // KnowledgeAnalyst is the one remaining blocked analyst — it
    // needs a product decision (what "Knowledge" evidence even
    // means), not just a data source, so it's not part of the
    // News/SEC data-wiring pass. See KnowledgeAnalyst.ts.
    const blockedAnalysts = ["Knowledge"];

    return (
        <main className="min-h-screen bg-[#09090B] p-8 text-white">
            <h1 className="text-2xl font-bold">Provider Health</h1>
            <p className="mt-1 text-sm text-zinc-500">
                Live evidence-builder status for {testTicker}. Change with ?ticker=SYMBOL.
            </p>

            {loadError && (
                <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-400">
                    Failed to build evidence for {testTicker}: {loadError}
                    {loadError.includes("FINNHUB_API_KEY") && (
                        <p className="mt-1 text-red-500/70">
                            Set FINNHUB_API_KEY in your environment to see live status.
                        </p>
                    )}
                </div>
            )}

            {!loadError && (
                <>
                    <table className="mt-6 w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800 text-left text-zinc-500">
                                <th className="py-2 pr-4">Category</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Fields Verified</th>
                                <th className="py-2 pr-4">Avg Confidence</th>
                                <th className="py-2 pr-4">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.map(p => (
                                <tr key={p.category} className="border-b border-zinc-900">
                                    <td className="py-2 pr-4 font-medium">{p.category}</td>
                                    <td className={`py-2 pr-4 font-semibold ${STATUS_STYLE[p.status]}`}>
                                        {STATUS_LABEL[p.status]}
                                    </td>
                                    <td className="py-2 pr-4 text-zinc-300">{p.verified}/{p.fields}</td>
                                    <td className="py-2 pr-4 text-zinc-300">{p.avgConfidence}%</td>
                                    <td className="py-2 pr-4 text-zinc-500">{p.source}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-8">
                        <h2 className="text-sm font-semibold text-zinc-400">Blocked Analysts</h2>
                        <p className="mt-1 text-xs text-zinc-600">
                            These have no data source at all — throw on analyze() by design rather than fabricating output.
                        </p>
                        <div className="mt-2 flex gap-2">
                            {blockedAnalysts.map(name => (
                                <span key={name} className="rounded border border-red-900/50 bg-red-950/30 px-2 py-1 text-xs text-red-400">
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </main>
    );
}
