import { SECForm4Provider } from "@/engine/evidence/providers/SECForm4Provider";

export default async function InsiderTransactionTimeline({ ticker }: { ticker: string }) {
    const transactions = await new SECForm4Provider().getRecentInsiderTransactions(ticker, 8);

    if (!transactions || transactions.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Insider Transaction Timeline</h3>
                <p className="text-xs text-zinc-600">No recent Form 4 filings found.</p>
            </div>
        );
    }

    const sorted = [...transactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Insider Transaction Timeline</h3>
            <div className="space-y-2">
                {sorted.slice(0, 6).map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.acquiredOrDisposed === "A" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="w-20 shrink-0 text-zinc-600">{t.transactionDate}</span>
                        <span className="flex-1 truncate text-zinc-400">{t.insiderName}{t.officerTitle ? `, ${t.officerTitle}` : ""}</span>
                        <span className={t.acquiredOrDisposed === "A" ? "text-emerald-400" : "text-red-400"}>
                            {t.acquiredOrDisposed === "A" ? "Buy" : "Sell"} {t.shares !== null ? t.shares.toLocaleString() : "-"}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
