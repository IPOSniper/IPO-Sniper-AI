import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { SEC13FProvider, NOTABLE_13F_FILERS } from "@/engine/evidence/providers/SEC13FProvider";
import { lookupCusip } from "@/engine/evidence/providers/CusipMap";

export default async function InstitutionalFilingFreshness({ research }: WorkstationPanelProps) {
    const ticker = research.company.ticker;
    const cusipEntry = lookupCusip(ticker);
    const userAgent = process.env.SEC_EDGAR_USER_AGENT;

    if (!cusipEntry || !userAgent) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">13F Filing Freshness</h3>
                <p className="text-xs text-zinc-600">No 13F filings to check freshness for.</p>
            </div>
        );
    }

    const provider = new SEC13FProvider(userAgent);
    let mostRecentPeriod: string | null = null;

    for (const key of Object.keys(NOTABLE_13F_FILERS) as (keyof typeof NOTABLE_13F_FILERS)[]) {
        const filing = await provider.getLatestFiling(NOTABLE_13F_FILERS[key].cik);
        if (filing && (!mostRecentPeriod || filing.periodOfReport > mostRecentPeriod)) {
            mostRecentPeriod = filing.periodOfReport;
        }
    }

    if (!mostRecentPeriod) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">13F Filing Freshness</h3>
                <p className="text-xs text-zinc-600">No 13F filings found.</p>
            </div>
        );
    }

    const daysOld = Math.floor((Date.now() - new Date(mostRecentPeriod).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">13F Filing Freshness</h3>
            <div className="text-sm text-zinc-300">Most recent: {mostRecentPeriod}</div>
            <div className="mt-1 text-[10px] text-zinc-600">{daysOld} days old · 13F filings lag up to 45 days by SEC rule</div>
        </div>
    );
}
