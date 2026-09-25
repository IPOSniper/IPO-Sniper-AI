import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { ComparableCompaniesEngine } from "@/engine/valuation/ComparableCompaniesEngine";
import { getMultiplesForTicker } from "@/engine/valuation/getMultiplesForTicker";

export default async function ComparableCompaniesTable({ research }: WorkstationPanelProps) {
    const ticker = research.company.ticker;
    const engine = new ComparableCompaniesEngine();

    const ownMultiples = await getMultiplesForTicker(ticker);
    const result = await engine.build(ticker, getMultiplesForTicker);

    if (!result || result.peers.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Comparable Companies</h3>
                <p className="text-xs text-zinc-600">No peer companies found for this ticker.</p>
            </div>
        );
    }

    const fmt = (n: number | null) => (n !== null ? `${n.toFixed(1)}x` : "-");

    const isOutlier = (value: number | null, median: number | null) => {
        if (value === null || median === null || median === 0) return false;
        const ratio = value / median;
        return ratio > 3 || ratio < 1 / 3;
    };

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Comparable Companies</h3>
            <div className="overflow-hidden rounded-md border border-zinc-800">
                <div className="grid grid-cols-4 gap-2 border-b border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-[9px] uppercase tracking-wide text-zinc-600">
                    <div>Ticker</div>
                    <div className="text-right">P/E</div>
                    <div className="text-right">EV/Revenue</div>
                    <div className="text-right">EV/EBITDA</div>
                </div>
                <div className="grid grid-cols-4 gap-2 border-b border-violet-900/40 bg-violet-950/10 px-2 py-1.5 text-[10px] text-violet-300">
                    <div className="font-semibold">{ticker} (this company)</div>
                    <div className="text-right">{fmt(ownMultiples.peRatio)}</div>
                    <div className="text-right">{fmt(ownMultiples.evToRevenue)}</div>
                    <div className="text-right">{fmt(ownMultiples.evToEbitda)}</div>
                </div>
                {result.peers.map((p, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 border-b border-zinc-900 px-2 py-1.5 text-[10px] text-zinc-400 last:border-b-0">
                        <div>{p.ticker}</div>
                        <div className={`text-right ${isOutlier(p.peRatio, result.medianPE) ? "text-zinc-700" : ""}`}>{fmt(p.peRatio)}</div>
                        <div className={`text-right ${isOutlier(p.evToRevenue, result.medianEvToRevenue) ? "text-zinc-700" : ""}`}>{fmt(p.evToRevenue)}</div>
                        <div className="text-right">{fmt(p.evToEbitda)}</div>
                    </div>
                ))}
                <div className="grid grid-cols-4 gap-2 bg-zinc-900/60 px-2 py-1.5 text-[10px] font-semibold text-zinc-300">
                    <div>Peer Median ({result.peerCount} peer{result.peerCount === 1 ? "" : "s"})</div>
                    <div className="text-right">{fmt(result.medianPE)}</div>
                    <div className="text-right">{fmt(result.medianEvToRevenue)}</div>
                    <div className="text-right">{fmt(result.medianEvToEbitda)}</div>
                </div>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-zinc-600">A dash means the multiple genuinely isn&apos;t available for that company (e.g. negative or unreported earnings for P/E) - never a zero or an estimate. EV/EBITDA specifically is unavailable industry-wide here - no depreciation/amortization data source integrated yet. Peer values shown greyed-out are statistical outliers (3x+ or 1/3x the peer median) and excluded from the median itself so a single distorted comp can&apos;t skew it.</p>
        </div>
    );
}
