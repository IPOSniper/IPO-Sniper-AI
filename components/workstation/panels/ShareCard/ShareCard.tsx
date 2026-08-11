import { forwardRef } from "react";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { excludeAnalysts, recommendationToRating, strengthLabel } from "../../shared/scorePresentation";
import { buildCommitteePhotoAssignments } from "../committeeAvatars";
import { SHARE_CARD_DISCLOSURE } from "@/config/shareCardDisclosure";
import { BarChart, Bar, ResponsiveContainer } from "recharts";

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

/**
 * Redesigned per direct feedback: hero recommendation, committee
 * avatars, evidence gauge, bull/bear panels with icons, a real
 * per-analyst score chart replacing the revenue chart, and a full
 * committee table. Every new element maps to a real field --
 * committee.overallScore (recomputed via excludeAnalysts to exclude
 * News, same as the rating), each analyst's real 0-100 score, real
 * photos from the same pool used elsewhere in the app.
 *
 * Two suggestions deliberately NOT included:
 * - "What changed vs yesterday" -- no real historical research
 *   snapshot is currently stored/populated (Research History panel
 *   is empty). Inventing a past recommendation to show movement
 *   would be fabricating data that was never actually recorded.
 * - QR code -- a real feature, but needs a QR-generation capability
 *   not yet verified/built. Scoped as a likely next addition, not
 *   rushed in without checking what's actually available.
 *
 * Still excludes News Analyst entirely from every number and list on
 * this card -- NewsAPI.org and Currents API free tiers both restrict
 * production/public use (confirmed directly from both providers'
 * own terms), and this card is specifically built for public sharing.
 * The disclosure is now in the footer with a small ⓘ marker rather
 * than the top of the card, per direct feedback that developer-
 * facing language hurt the first impression -- but the substance
 * (recommendation is recomputed without News) is still stated
 * plainly, just not first.
 *
 * Off-screen render + immediate capture (see ShareCardButton.tsx) --
 * uses plain <img> tags for avatars, not next/image, since
 * next/image's lazy-loading could leave images unloaded at the
 * moment html-to-image captures the DOM.
 */
const ShareCard = forwardRef<HTMLDivElement, WorkstationPanelProps>(
    function ShareCard({ research }, ref) {
        const { committee, investmentDecision } = research;
        const { quote, financialStatements } = research.report.evidence;
        const company = research.report.evidence.company;

        // News is excluded from the vote/score aggregate unless BOTH
        // includeNewsVote and includeNewsScore are true -- you can't
        // meaningfully include a vote without its confidence, or vice
        // versa. Today, both default false, so this list is
        // ["News Analyst"], identical to before this config existed.
        const excludedFromAggregate = (SHARE_CARD_DISCLOSURE.includeNewsVote && SHARE_CARD_DISCLOSURE.includeNewsScore)
            ? []
            : ["News Analyst"];

        const safe = excludeAnalysts(committee, excludedFromAggregate);
        const rating = recommendationToRating(safe.recommendation);

        const statements = financialStatements.statements.verified
            ? financialStatements.statements.value
            : [];

        // Real per-analyst scores, excluding News -- replaces the
        // revenue chart with something that actually explains the
        // recommendation, per direct feedback.
        const scoredAnalysts = committee.reports.filter(r => r.confidence > 0 && !excludedFromAggregate.includes(r.analyst));
        const photoAssignments = buildCommitteePhotoAssignments(scoredAnalysts.map(r => r.analyst));
        const scoreChartData = scoredAnalysts
            .map(r => ({ name: r.analyst.replace(" Analyst", ""), score: r.score }))
            .sort((a, b) => b.score - a.score);

        const latest = statements.length > 0 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[0] : null;
        const prior = statements.length > 1 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[1] : null;
        const revenueGrowthPct = latest && prior && prior.revenue !== 0
            ? ((latest.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100
            : null;
        const grossMarginPct = latest && latest.revenue !== 0 ? (latest.grossProfit / latest.revenue) * 100 : null;
        const debtToEquity = latest && latest.shareholdersEquity !== 0 ? latest.debt / latest.shareholdersEquity : null;

        const votingAnalysts = committee.reports.filter(r => r.confidence > 0 && !excludedFromAggregate.includes(r.analyst));
        const avgEvidenceStrength = votingAnalysts.length > 0
            ? Math.round(votingAnalysts.reduce((s, r) => s + r.evidenceStrength, 0) / votingAnalysts.length)
            : null;

        const bullishAnalysts = votingAnalysts.filter(r => r.recommendation === "STRONG_BUY" || r.recommendation === "BUY");
        const bearishAnalysts = votingAnalysts.filter(r => r.recommendation === "REDUCE" || r.recommendation === "SELL");
        const holdAnalysts = votingAnalysts.length - bullishAnalysts.length - bearishAnalysts.length;

        // Separate from vote inclusion: even if a future config change
        // lets News Analyst's vote count toward the aggregate, its
        // written thesis text only appears here if includeNewsReasoning
        // is also true -- and even then, any headline citation inside
        // that text (see NewsAnalyst.ts's "Most recent: ..." clause) is
        // stripped unless includeLicensedHeadlines is ALSO true. Today,
        // with every flag false, this only ever removes text that
        // wouldn't have been visible anyway (News is excluded from
        // votingAnalysts entirely) -- written this way so toggling
        // includeNewsReasoning/includeLicensedHeadlines later works
        // correctly without touching this rendering logic again.
        function displayThesis(analyst: string, thesis: string): string {
            if (analyst === "News Analyst" && !SHARE_CARD_DISCLOSURE.includeNewsReasoning) return "";
            if (analyst === "News Analyst" && !SHARE_CARD_DISCLOSURE.includeLicensedHeadlines) {
                return thesis.replace(/\s*Most recent:.*$/, "");
            }
            return thesis;
        }

        const scenarios = investmentDecision?.scenarios;

        return (
            <div
                ref={ref}
                className="flex w-[680px] flex-col gap-4 bg-[#060A12] p-8"
                style={{ fontFamily: "Georgia, serif" }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-violet-400">Institutional Research Snapshot</p>
                        <h1 className="text-2xl font-bold text-white">
                            {company.name} <span className="text-zinc-500">({company.ticker})</span>
                        </h1>
                    </div>
                    {quote.price.verified && (
                        <div className="text-right">
                            <p className="text-xl font-bold text-white">${quote.price.value.toFixed(2)}</p>
                            <p className={quote.changePercent.value >= 0 ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
                                {quote.changePercent.value >= 0 ? "+" : ""}{quote.changePercent.value.toFixed(2)}%
                            </p>
                        </div>
                    )}
                </div>

                {/* Hero recommendation -- made impossible to miss, per direct feedback */}
                <div className="rounded-xl border border-zinc-800 bg-[#0D111B] p-5 text-center">
                    <p className={`text-3xl font-black tracking-tight ${RATING_STYLE[rating]}`}>
                        {RATING_HEADLINE[rating]}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-6 text-sm">
                        <span className="text-zinc-400">
                            <span className="text-lg font-bold text-white">{safe.score}</span>/100 Conviction
                        </span>
                        <span className="text-zinc-400">
                            AI Committee Confidence <span className="text-lg font-bold text-white">{safe.confidence}%</span>
                        </span>
                    </div>
                </div>

                {/* Committee avatars -- real photos, real votes, News excluded */}
                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-3">
                    <div className="flex flex-wrap justify-center gap-2">
                        {scoredAnalysts.map(r => {
                            const photoSrc = photoAssignments.get(r.analyst);
                            const color = VOTE_COLOR[r.recommendation] ?? "#8A8FA3";
                            return (
                                <div
                                    key={r.analyst}
                                    className="h-9 w-9 overflow-hidden rounded-full border-2"
                                    style={{ borderColor: color }}
                                    title={`${r.analyst}: ${r.recommendation.replace("_", " ")}`}
                                >
                                    {photoSrc && (
                                        // eslint-disable-next-line @next/next/no-img-element -- off-screen capture, avoiding next/image lazy-load risk
                                        <img src={photoSrc} alt={r.analyst} className="h-full w-full object-cover" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-2 text-center text-xs text-zinc-500">
                        <span className="text-emerald-400">{bullishAnalysts.length} bull</span>
                        {" · "}
                        <span className="text-zinc-400">{holdAnalysts} hold</span>
                        {" · "}
                        <span className="text-red-400">{bearishAnalysts.length} bear</span>
                    </p>
                </div>

                {/* Facts grid -- real financial-statement derived values only */}
                <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-500">Facts (from most recent filed statement)</p>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                            <p className="text-[9px] text-zinc-500">Revenue growth (YoY)</p>
                            <p className="mt-1 text-sm font-semibold text-white">{revenueGrowthPct !== null ? `${revenueGrowthPct >= 0 ? "+" : ""}${revenueGrowthPct.toFixed(1)}%` : "—"}</p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                            <p className="text-[9px] text-zinc-500">Gross margin</p>
                            <p className="mt-1 text-sm font-semibold text-white">{grossMarginPct !== null ? `${grossMarginPct.toFixed(1)}%` : "—"}</p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                            <p className="text-[9px] text-zinc-500">Free cash flow</p>
                            <p className={`mt-1 text-sm font-semibold ${latest && latest.freeCashFlow < 0 ? "text-red-400" : "text-white"}`}>
                                {latest ? `${latest.freeCashFlow < 0 ? "-" : ""}$${(Math.abs(latest.freeCashFlow) / 1_000_000).toFixed(1)}M` : "—"}
                            </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                            <p className="text-[9px] text-zinc-500">Debt-to-equity</p>
                            <p className="mt-1 text-sm font-semibold text-white">{debtToEquity !== null ? debtToEquity.toFixed(2) : "—"}</p>
                        </div>
                    </div>
                </div>

                {/* Evidence quality -- real gauge, not just text */}
                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Evidence Quality</span>
                        <span className="font-semibold text-white">
                            {avgEvidenceStrength !== null ? `${avgEvidenceStrength}% — ${strengthLabel(avgEvidenceStrength)} Confidence` : "Unavailable"}
                        </span>
                    </div>
                    {avgEvidenceStrength !== null && (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500"
                                style={{ width: `${avgEvidenceStrength}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Probability chips -- only rendered when investmentDecision exists */}
                {scenarios && (
                    <div className="flex gap-2 rounded-lg border border-zinc-800 bg-[#0D111B] p-3">
                        <div className="flex-1 rounded-md bg-emerald-950/30 p-2 text-center">
                            <p className="text-sm font-bold text-emerald-400">{scenarios.bull.probability}%</p>
                            <p className="text-[9px] text-zinc-500">Bull</p>
                        </div>
                        <div className="flex-1 rounded-md bg-zinc-800/40 p-2 text-center">
                            <p className="text-sm font-bold text-zinc-300">{scenarios.base.probability}%</p>
                            <p className="text-[9px] text-zinc-500">Base</p>
                        </div>
                        <div className="flex-1 rounded-md bg-red-950/30 p-2 text-center">
                            <p className="text-sm font-bold text-red-400">{scenarios.bear.probability}%</p>
                            <p className="text-[9px] text-zinc-500">Bear</p>
                        </div>
                    </div>
                )}

                {/* Bull/bear case -- real per-analyst thesis text, with icons */}
                {(bullishAnalysts.length > 0 || bearishAnalysts.length > 0) && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-emerald-900/40 bg-[#0D111B] p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">🐂 Bull case</p>
                            {bullishAnalysts
                                .filter(a => displayThesis(a.analyst, a.thesis) !== "")
                                .slice(0, 3)
                                .map(a => (
                                <p key={a.analyst} className="mb-1.5 text-[11px] leading-snug text-zinc-300">
                                    <span className="text-zinc-500">{a.analyst}: </span>{displayThesis(a.analyst, a.thesis)}
                                </p>
                            ))}
                            {bullishAnalysts.length === 0 && <p className="text-[11px] text-zinc-600">No analysts currently bullish.</p>}
                        </div>
                        <div className="rounded-lg border border-red-900/40 bg-[#0D111B] p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-red-400">🐻 Bear case</p>
                            {bearishAnalysts
                                .filter(a => displayThesis(a.analyst, a.thesis) !== "")
                                .slice(0, 3)
                                .map(a => (
                                <p key={a.analyst} className="mb-1.5 text-[11px] leading-snug text-zinc-300">
                                    <span className="text-zinc-500">{a.analyst}: </span>{displayThesis(a.analyst, a.thesis)}
                                </p>
                            ))}
                            {bearishAnalysts.length === 0 && <p className="text-[11px] text-zinc-600">No analysts currently bearish.</p>}
                        </div>
                    </div>
                )}

                {/* AI reasoning */}
                <div className="rounded-lg border border-violet-900/40 bg-[#160B3D] p-3.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">Committee reasoning</p>
                    <p className="text-xs leading-relaxed text-zinc-200">{committee.summary}</p>
                    {investmentDecision?.executiveDecision.summary &&
                        investmentDecision.executiveDecision.summary.trim() !== committee.summary.trim() && (
                        <p className="mt-2 text-xs leading-relaxed text-zinc-300">{investmentDecision.executiveDecision.summary}</p>
                    )}
                </div>

                {/* Real per-analyst score chart -- replaces the revenue chart, actually explains the recommendation */}
                {scoreChartData.length > 0 && (
                    <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">AI Conviction by Analyst</p>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreChartData} layout="vertical" margin={{ left: 20 }}>
                                    <Bar dataKey="score" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Full committee table -- the signature closing element */}
                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Committee</p>
                    <div className="space-y-1">
                        {scoredAnalysts.map(r => (
                            <div key={r.analyst} className="flex items-center justify-between text-xs">
                                <span className="text-zinc-300">{r.analyst}</span>
                                <span className="font-semibold" style={{ color: VOTE_COLOR[r.recommendation] ?? "#8A8FA3" }}>
                                    {r.recommendation.replace("_", " ")}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer -- honest sources, disclosure moved here per direct feedback (not hidden, just not first) */}
                <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-600">
                    <p className="mb-1 font-medium text-zinc-500">Evidence Sources</p>
                    <p>✓ SEC EDGAR &nbsp; ✓ Exchange Data (Finnhub) &nbsp; ✓ Financial Statements &nbsp; ✓ AI Reasoning Engine</p>
                    <p className="mt-2">AI-synthesized research, not investment advice. Data may be incomplete — verify independently before acting. IPO Sniper AI is not a registered investment advisor.</p>
                    <p className="mt-1">ⓘ Public Research Snapshot — certain proprietary and licensed research inputs are omitted from this public report.</p>
                </div>
            </div>
        );
    }
);

export default ShareCard;
