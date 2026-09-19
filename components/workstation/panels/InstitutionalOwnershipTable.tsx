import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { ARKHoldingsProvider } from "@/engine/evidence/providers/ARKHoldingsProvider";
import { XOVRHoldingsProvider } from "@/engine/evidence/providers/XOVRHoldingsProvider";

export default async function InstitutionalOwnershipTable({ research }: WorkstationPanelProps) {
    const ticker = research.company.ticker;
    const ark = new ARKHoldingsProvider();

    const positions = await ark.findAcrossFunds(ticker);

    let xovrHolding = null;
    try {
        xovrHolding = await new XOVRHoldingsProvider().findHolding(ticker);
    } catch {
        xovrHolding = null;
    }

    const rows: { filer: string; shares: number; value: number }[] = [
        ...positions.map(p => ({ filer: p.fund, shares: p.holding.shares, value: p.holding.marketValue })),
        ...(xovrHolding ? [{ filer: "XOVR (ERShares)", shares: xovrHolding.sharesHeld ?? 0, value: xovrHolding.marketValue }] : []),
    ];

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Institutional Ownership</h3>
                <p className="text-xs text-zinc-600">Not currently held by any ARK Invest fund or XOVR.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Institutional Ownership</h3>
            <div className="overflow-hidden rounded-md border border-zinc-800">
                <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-[9px] uppercase tracking-wide text-zinc-600">
                    <div>Filer</div>
                    <div className="text-right">Shares</div>
                    <div className="text-right">Value</div>
                </div>
                {rows.map((r, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 border-b border-zinc-900 px-2 py-1.5 text-[10px] text-zinc-400 last:border-b-0">
                        <div className="truncate">{r.filer}</div>
                        <div className="text-right">{r.shares.toLocaleString()}</div>
                        <div className="text-right">${(r.value / 1_000_000).toFixed(1)}M</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
