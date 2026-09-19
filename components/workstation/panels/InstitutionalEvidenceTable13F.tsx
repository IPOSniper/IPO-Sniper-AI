import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { SEC13FProvider, NOTABLE_13F_FILERS } from "@/engine/evidence/providers/SEC13FProvider";
import { lookupCusip } from "@/engine/evidence/providers/CusipMap";

export default async function InstitutionalEvidenceTable13F({ research }: WorkstationPanelProps) {
    const ticker = research.company.ticker;
    const cusipEntry = lookupCusip(ticker);
    const userAgent = process.env.SEC_EDGAR_USER_AGENT;
    if (!userAgent) return null;
    const provider = new SEC13FProvider(userAgent);
    const notable = cusipEntry ? await provider.getNotableHolders(cusipEntry.cusip, Object.keys(NOTABLE_13F_FILERS) as (keyof typeof NOTABLE_13F_FILERS)[]) : null;

    if (!notable || notable.holders.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">13F Institutional Evidence</h3>
                <p className="text-xs text-zinc-600">No verified 13F filings for this ticker.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">13F Institutional Evidence</h3>
                <span className="text-[9px] text-zinc-600">45-day filing lag</span>
            </div>
            <div className="overflow-hidden rounded-md border border-zinc-800">
                <div className="grid grid-cols-4 gap-2 border-b border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-[9px] uppercase tracking-wide text-zinc-600">
                    <div>Filer</div>
                    <div>Filing Date</div>
                    <div className="text-right">Shares</div>
                    <div className="text-right">Value</div>
                </div>
                {notable.holders.map((h, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 border-b border-zinc-900 px-2 py-1.5 text-[10px] text-zinc-400 last:border-b-0">
                        <div className="truncate">{h.filer}</div>
                        <div>{notable.periodOfReport}</div>
                        <div className="text-right">{h.shares.toLocaleString()}</div>
                        <div className="text-right">${(h.valueThousands / 1000).toFixed(1)}M</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
