import { ARKHoldingsProvider } from "@/engine/evidence/providers/ARKHoldingsProvider";
import { XOVRHoldingsProvider } from "@/engine/evidence/providers/XOVRHoldingsProvider";
import { SEC13FProvider, NOTABLE_13F_FILERS, type NotableFilerKey } from "@/engine/evidence/providers/SEC13FProvider";
import { lookupCusip } from "@/engine/evidence/providers/CusipMap";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import UnverifiedCard from "../../shared/UnverifiedCard";

interface Props {
    ticker: string;
}

interface NotableHolder {
    filer: string;
    shares: number;
    valueThousands: number;
    periodOfReport: string;
}

/**
 * Only attempted for tickers in the hand-verified CusipMap — for
 * everything else this silently returns an empty array rather than
 * guessing a CUSIP, exactly per SEC13FProvider's own caveat.
 */
async function getNotableHolders(ticker: string): Promise<{ holders: NotableHolder[]; asOf: string } | null> {
    const mapped = lookupCusip(ticker);
    if (!mapped) return null;

    const userAgent = process.env.SEC_EDGAR_USER_AGENT;
    if (!userAgent) return null;

    const provider = new SEC13FProvider(userAgent);
    const filerKeys = Object.keys(NOTABLE_13F_FILERS) as NotableFilerKey[];

    const results = await Promise.all(
        filerKeys.map(async (key): Promise<NotableHolder | null> => {
            try {
                const filing = await provider.getLatestFiling(NOTABLE_13F_FILERS[key].cik);
                if (!filing) return null;

                const holding = filing.holdings.find(h => h.cusip === mapped.cusip);
                if (!holding) return null;

                return {
                    filer: NOTABLE_13F_FILERS[key].label,
                    shares: holding.shares,
                    valueThousands: holding.valueThousands,
                    periodOfReport: filing.periodOfReport,
                };
            } catch {
                return null;
            }
        })
    );

    const holders = results.filter((r): r is NotableHolder => r !== null);
    if (holders.length === 0) return { holders: [], asOf: "" };

    return { holders, asOf: holders[0].periodOfReport };
}

async function getRecentSnapshot(ticker: string): Promise<{ arkShares: number | null; date: string } | null> {
    if (!isSupabaseConfigured()) return null;

    const supabase = await createClient();
    const { data } = await supabase
        .from("evidence_snapshots")
        .select("ark_shares, snapshot_date")
        .eq("ticker", ticker)
        .order("snapshot_date", { ascending: false })
        .limit(2);

    if (!data || data.length < 2) return null;

    // data[0] is today's (or most recent), data[1] is the one before it —
    // only meaningful if this ticker is actually on someone's watchlist,
    // since that's the only thing that makes the overnight watcher check it.
    return { arkShares: data[1].ark_shares, date: data[1].snapshot_date };
}

export default async function InstitutionalOwnershipCard({ ticker }: Props) {
    const ark = new ARKHoldingsProvider();

    let positions: Awaited<ReturnType<ARKHoldingsProvider["findAcrossFunds"]>> = [];
    let fetchFailed = false;

    try {
        positions = await ark.findAcrossFunds(ticker);
    } catch {
        fetchFailed = true;
    }

    let xovr: Awaited<ReturnType<XOVRHoldingsProvider["findHolding"]>> = null;
    try {
        xovr = await new XOVRHoldingsProvider().findHolding(ticker);
    } catch {
        // XOVR's data endpoint has an unconfirmed raw response shape
        // (see the provider's header comment) — a parse failure here
        // is treated the same as "not held", not surfaced as an error,
        // since ARK/13F coverage above is unaffected either way.
    }

    const notable = await getNotableHolders(ticker).catch(() => null);
    const mapped = lookupCusip(ticker);

    if (fetchFailed && !xovr && (!notable || notable.holders.length === 0)) {
        return <UnverifiedCard title="Institutional Ownership" reason="ARK holdings fetch failed — assets.ark-funds.com may be unreachable or changed format" />;
    }

    if (positions.length === 0 && !xovr && (!notable || notable.holders.length === 0)) {
        const reason = mapped
            ? `Not currently held by any ARK Invest fund or XOVR, and not found in Berkshire/Pershing Square/Scion's latest 13F-HR (checked via CUSIP ${mapped.cusip}).`
            : "Not currently held by any ARK Invest fund or XOVR. (Berkshire/Ackman/Burry not checked — no verified CUSIP mapping for this ticker yet.)";
        return <UnverifiedCard title="Institutional Ownership" reason={reason} />;
    }

    const totalShares = positions.reduce((sum, p) => sum + p.holding.shares, 0);
    const totalValue = positions.reduce((sum, p) => sum + p.holding.marketValue, 0);
    const prior = await getRecentSnapshot(ticker).catch(() => null);

    const change = prior?.arkShares != null && prior.arkShares > 0
        ? ((totalShares - prior.arkShares) / prior.arkShares) * 100
        : null;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
            {positions.length > 0 && (
                <div>
                    <p className="text-xs text-zinc-500">Institutional Ownership (ARK Invest)</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                        {totalShares.toLocaleString()} sh
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        ${(totalValue / 1_000_000).toFixed(1)}M across {positions.map(p => p.fund).join(", ")}
                    </p>
                    {change !== null ? (
                        <p className={`text-xs mt-1 ${change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-zinc-500"}`}>
                            {change > 0 ? "+" : ""}{change.toFixed(1)}% since {prior!.date}
                        </p>
                    ) : (
                        <p className="text-xs text-zinc-600 mt-1">
                            Add to Watchlist to track day-over-day changes.
                        </p>
                    )}
                </div>
            )}

            {xovr && (
                <div className={positions.length > 0 ? "border-t border-zinc-800 pt-3" : ""}>
                    <p className="text-xs text-zinc-500">Institutional Ownership (XOVR — ERShares)</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                        {xovr.sharesHeld !== null ? `${xovr.sharesHeld.toLocaleString()} sh` : "Private/SPV position"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        ${(xovr.marketValue / 1_000_000).toFixed(1)}M · {xovr.weightPercent.toFixed(2)}% of fund
                    </p>
                </div>
            )}

            {notable && notable.holders.length > 0 && (
                <div className={(positions.length > 0 || xovr) ? "border-t border-zinc-800 pt-3" : ""}>
                    <p className="text-xs text-zinc-500">
                        Other 13F Filers {notable.asOf ? `(as of ${notable.asOf})` : ""}
                    </p>
                    <div className="mt-1 space-y-1">
                        {notable.holders.map(h => (
                            <div key={h.filer} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-300">{h.filer}</span>
                                <span className="text-zinc-500">
                                    {h.shares.toLocaleString()} sh · ${(h.valueThousands / 1000).toFixed(1)}M
                                </span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1.5">
                        13F filings lag up to 45 days after quarter-end — this may be stale vs. the ARK/XOVR figures above.
                    </p>
                </div>
            )}

            {mapped && notable && notable.holders.length === 0 && (positions.length > 0 || xovr) && (
                <p className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-3">
                    Not currently held by Berkshire/Pershing Square/Scion per their latest 13F-HR.
                </p>
            )}
        </div>
    );
}
