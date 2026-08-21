import { forwardRef } from "react";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { excludeAnalysts, recommendationToRating, recommendationToHeadline } from "../../shared/scorePresentation";
import { buildCommitteePhotoAssignments } from "../committeeAvatars";

const RATING_STYLE: Record<string, string> = {
    Bullish: "text-emerald-400",
    Neutral: "text-zinc-300",
    Bearish: "text-red-400",
};

const RATING_HEADLINE: Record<string, string> = {
    Bullish: "STRONG BULLISH",
    Neutral: "NEUTRAL",
    Bearish: "STRONG BEARISH",
};

const VOTE_COLOR: Record<string, string> = {
    STRONG_BUY: "#16D47B",
    BUY: "#16D47B",
    HOLD: "#8A8FA3",
    REDUCE: "#F04452",
    SELL: "#F04452",
};

interface Props extends WorkstationPanelProps {
    qrCodeDataUrl?: string;
}

/**
 * Feed-optimized second format, per direct feedback that the full
 * card (ShareCard.tsx) gets tall enough that X/LinkedIn may crop it.
 * Fixed ~1200x1500 aspect (w-[600px], content naturally settles near
 * 750px tall at this density -- not a hardcoded height, since
 * forcing exact pixel height on variable real content would either
 * clip something real or leave dead space).
 *
 * Deliberately a SEPARATE component from ShareCard, not a
 * conditional "compact mode" inside it -- keeps each one simple to
 * reason about and verify independently, at the cost of some
 * duplicated computation (same real data, same exclusion rules,
 * same News-Analyst-excluded discipline as the full card).
 *
 * Summary only: hero recommendation, price, real Consensus %,
 * committee avatar row, a 2-fact row (revenue growth + debt-to-equity
 * -- added after direct feedback that a bare "STRONG BEARISH" label
 * with zero supporting numbers felt ambiguous), evidence gauge, top
 * bull/bear line, QR. Still no full committee table or per-analyst
 * score bars -- those stay on the full "Research Snapshot" format.
 */
const ShareCardCompact = forwardRef<HTMLDivElement, Props>(
    function ShareCardCompact({ research, qrCodeDataUrl }, ref) {
        const { committee } = research;
        const { quote, financialStatements } = research.report.evidence;
        const company = research.report.evidence.company;

        const excludedFromAggregate = ["News Analyst"]; // see config/shareCardDisclosure.ts -- same rule as the full card
        const safe = excludeAnalysts(committee, excludedFromAggregate);
        const rating = recommendationToRating(safe.recommendation);
        const headline = recommendationToHeadline(safe.recommendation);

        // Real facts, same derivation as the full card -- added
        // because a "STRONG BEARISH" label with zero supporting
        // numbers is exactly what made this card feel ambiguous.
        const statements = financialStatements.statements.verified ? financialStatements.statements.value : [];
        const latest = statements.length > 0 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[0] : null;
        const prior = statements.length > 1 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[1] : null;
        const revenueGrowthPct = latest && prior && prior.revenue !== 0
            ? ((latest.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100
            : null;
        const debtToEquity = latest && latest.shareholdersEquity !== 0 ? latest.debt / latest.shareholdersEquity : null;

        const scoredAnalysts = committee.reports.filter(r => r.confidence > 0 && !excludedFromAggregate.includes(r.analyst));
        const photoAssignments = buildCommitteePhotoAssignments(scoredAnalysts.map(r => r.analyst));

        const votingAnalysts = scoredAnalysts;
        const avgEvidenceStrength = votingAnalysts.length > 0
            ? Math.round(votingAnalysts.reduce((s, r) => s + r.evidenceStrength, 0) / votingAnalysts.length)
            : null;

        const bullishAnalysts = votingAnalysts.filter(r => r.recommendation === "STRONG_BUY" || r.recommendation === "BUY");
        const bearishAnalysts = votingAnalysts.filter(r => r.recommendation === "REDUCE" || r.recommendation === "SELL");
        const holdAnalysts = votingAnalysts.length - bullishAnalysts.length - bearishAnalysts.length;

        // Single strongest bull point + bear point, real thesis text,
        // just capped to one line each to fit the tighter format.
        const topBull = bullishAnalysts[0];
        const topBear = bearishAnalysts[0];

        return (
            <div
                ref={ref}
                className="flex w-[600px] flex-col gap-3 bg-[#060A12] p-7"
                style={{ fontFamily: "Georgia, serif" }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-violet-400">Committee Research Snapshot</p>
                        <h1 className="text-xl font-bold text-white">
                            {company.name} <span className="text-zinc-500">({company.ticker})</span>
                        </h1>
                    </div>
                    {quote.price.verified && (
                        <div className="text-right">
                            <p className="text-lg font-bold text-white">${quote.price.value.toFixed(2)}</p>
                            <p className={quote.changePercent.value >= 0 ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                                {quote.changePercent.value >= 0 ? "â–²" : "â–¼"} {quote.changePercent.value >= 0 ? "+" : ""}{quote.changePercent.value.toFixed(2)}%
                            </p>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#0D111B] p-4 text-center">
                    <p className={`text-2xl font-black tracking-tight ${RATING_STYLE[rating]}`}>{headline}</p>
                    <div className="mt-1.5 flex items-center justify-center gap-4 text-xs">
                        <span className="text-zinc-400"><span className="font-bold text-white">{safe.score}</span>/100 Conviction</span>
                        <span className="text-zinc-400"><span className="font-bold text-white">{safe.confidence}%</span> Confidence</span>
                    </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                    <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span className="text-zinc-400">Consensus</span>
                        <span className="font-semibold text-white">{safe.agreement}%</span>
                    </div>
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full bg-violet-500" style={{ width: `${safe.agreement}%` }} />
                    </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                    <div className="flex flex-wrap justify-center gap-2">
                        {scoredAnalysts.map(r => {
                            const photoSrc = photoAssignments.get(r.analyst);
                            const color = VOTE_COLOR[r.recommendation] ?? "#8A8FA3";
                            return (
                                <div
                                    key={r.analyst}
                                    className="h-9 w-9 overflow-hidden rounded-full border-2"
                                    style={{ borderColor: color }}
                                >
                                    {photoSrc && (
                                        // eslint-disable-next-line @next/next/no-img-element -- off-screen capture
                                        <img src={photoSrc} alt={r.analyst} className="h-full w-full object-cover" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-1.5 text-center text-[10px] text-zinc-500">
                        <span className="text-emerald-400">{bullishAnalysts.length} bull</span>
                        {" Â· "}<span className="text-zinc-400">{holdAnalysts} hold</span>
                        {" Â· "}<span className="text-red-400">{bearishAnalysts.length} bear</span>
                    </p>
                </div>

                {(revenueGrowthPct !== null || debtToEquity !== null) && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2">
                            <p className="text-[8px] text-zinc-500">Revenue growth (YoY)</p>
                            <p className="mt-0.5 text-xs font-semibold text-white">
                                {revenueGrowthPct !== null ? `${revenueGrowthPct >= 0 ? "+" : ""}${revenueGrowthPct.toFixed(1)}%` : "â€”"}
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2">
                            <p className="text-[8px] text-zinc-500">Debt-to-equity</p>
                            <p className="mt-0.5 text-xs font-semibold text-white">{debtToEquity !== null ? debtToEquity.toFixed(2) : "â€”"}</p>
                        </div>
                    </div>
                )}

                {avgEvidenceStrength !== null && (
                    <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                            <span className="text-zinc-400">Evidence Quality</span>
                            <span className="font-semibold text-white">{avgEvidenceStrength}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${avgEvidenceStrength}%` }} />
                        </div>
                    </div>
                )}

                {(topBull || topBear) && (
                    <div className="space-y-1 rounded-lg border border-violet-900/40 bg-[#160B3D] p-3">
                        {topBull && <p className="text-[11px] leading-snug text-emerald-300">âœ“ {topBull.thesis}</p>}
                        {topBear && <p className="text-[11px] leading-snug text-red-300">âœ• {topBear.thesis}</p>}
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5">
                    <div>
                        <p className="text-[8px] uppercase tracking-wide text-zinc-600">Powered by</p>
                        <p className="text-xs font-bold text-violet-300">IPO Sniper AI</p>
                    </div>
                    {qrCodeDataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- data URL, off-screen capture
                        <img src={qrCodeDataUrl} alt="Scan to view full report" className="h-12 w-12" />
                    )}
                </div>
                <p className="text-[8px] leading-relaxed text-zinc-700">
                    AI-synthesized research, not investment advice. IPO Sniper AI is not a registered investment advisor. Certain proprietary and licensed research inputs are omitted from this public report.
                </p>
            </div>
        );
    }
);

export default ShareCardCompact;
