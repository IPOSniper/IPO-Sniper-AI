import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";
import { FinnhubEarningsCalendarProvider } from "@/engine/earnings/providers/FinnhubEarningsCalendarProvider";

const PRICING_FORM = "424B4";

export default async function QuietPeriodCountdown({ research }: WorkstationPanelProps) {
    const ticker = research.company.ticker;
    const secProvider = new SECEdgarProvider();

    const cik = await secProvider.getCIK(ticker);
    if (!cik) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Quiet Period &amp; First Earnings</h3>
                <p className="text-xs text-zinc-600">No SEC filer record found for this ticker.</p>
            </div>
        );
    }

    const filings = await secProvider.getFilings(cik);
    const pricingFiling = filings
        .filter(f => f.formType === PRICING_FORM)
        .sort((a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime())[0];

    if (!pricingFiling) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Quiet Period &amp; First Earnings</h3>
                <p className="text-xs text-zinc-600">No confirmed pricing date (424B4) found for this ticker yet - not yet listed.</p>
            </div>
        );
    }

    const listingDate = new Date(pricingFiling.filedAt);
    const quietPeriodEnd = new Date(listingDate);
    quietPeriodEnd.setDate(quietPeriodEnd.getDate() + 25);

    const now = new Date();
    const daysUntilQuietPeriodEnd = Math.ceil((quietPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const earningsProvider = new FinnhubEarningsCalendarProvider();
    let firstEarningsDate: string | null = null;

    try {
        const upcoming = await earningsProvider.getNext(ticker);
        firstEarningsDate = upcoming?.reportDate ?? null;
    } catch {
        firstEarningsDate = null;
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Quiet Period &amp; First Earnings</h3>
            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-zinc-500">Listed (424B4 priced)</span>
                    <span className="text-zinc-300">{pricingFiling.filedAt}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Research analyst quiet period ends</span>
                    <span className="text-zinc-300">
                        {quietPeriodEnd.toISOString().slice(0, 10)}
                        {daysUntilQuietPeriodEnd > 0 ? ` (${daysUntilQuietPeriodEnd}d)` : " (passed)"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">First post-IPO earnings report</span>
                    <span className="text-zinc-300">{firstEarningsDate ?? "Not yet scheduled"}</span>
                </div>
            </div>
            <p className="mt-2 text-[9px] text-zinc-600">No historical earnings baseline exists yet for a company this new - this is expected, not a red flag.</p>
        </div>
    );
}
