import { forwardRef } from "react";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { excludeAnalysts, recommendationToRating, strengthLabel } from "../../shared/scorePresentation";
import { buildCommitteePhotoAssignments } from "../committeeAvatars";
import { SHARE_CARD_DISCLOSURE } from "@/config/shareCardDisclosure";

interface Props extends WorkstationPanelProps {
    /**
     * Real QR code (base64 PNG data URL), generated via the
     * `qrcode` npm package in ShareCardButton.tsx -- NOT hand-rolled
     * here. QR encoding (Reed-Solomon error correction, matrix/mask
     * selection) is genuinely easy to get subtly wrong in a way that
     * LOOKS like a QR code but doesn't actually scan, and there's no
     * way to test-scan one from this sandbox -- using a real,
     * battle-tested library is the responsible choice, not a
     * shortcut.
     *
     * Optional and omitted entirely when there's nothing real to
     * link to -- see ShareCardButton.tsx for why (no configured
     * public site URL means no real link exists yet).
     */
    qrCodeDataUrl?: string;
}

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
const ShareCard = forwardRef<HTMLDivElement, Props>(
    function ShareCard({ research, qrCodeDataUrl }, ref) {
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
                className="flex w-[680px] flex-col gap-2.5 bg-[#060A12] p-6"
                style={{ fontFamily: "Georgia, serif" }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-violet-400">Committee Research Snapshot</p>
                        <h1 className="text-2xl font-bold text-white">
                            {company.name} <span className="text-zinc-500">({company.ticker})</span>
                        </h1>
                    </div>
                    {quote.price.verified && (
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Current Price</p>
                            <p className="text-xl font-bold text-white">${quote.price.value.toFixed(2)}</p>
                            <p className={quote.changePercent.value >= 0 ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
                                {quote.changePercent.value >= 0 ? "▲" : "▼"} {quote.changePercent.value >= 0 ? "+" : ""}{quote.changePercent.value.toFixed(2)}% Today
                            </p>
                        </div>
                    )}
                </div>

                {/* Hero recommendation -- made impossible to miss, per direct feedback */}
                <div className="rounded-xl border border-zinc-800 bg-[#0D111B] p-3.5 text-center">
                    <p className={`text-3xl font-black tracking-tight ${RATING_STYLE[rating]}`}>
                        {RATING_HEADLINE[rating]}
                    </p>
                    <div className="mt-1.5 flex items-center justify-center gap-6 text-sm">
                        <span className="text-zinc-400">
                            <span className="text-lg font-bold text-white">{safe.score}</span>/100 Conviction
                        </span>
                        <span className="text-zinc-400">
                            AI Committee Confidence <span className="text-lg font-bold text-white">{safe.confidence}%</span>
                        </span>
                    </div>
                </div>

                {/* Committee Split -- real agreement %, same computation excludeAnalysts already does */}
                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Consensus</span>
                        <span className="font-semibold text-white">{safe.agreement}%</span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full bg-violet-500" style={{ width: `${safe.agreement}%` }} />
                    </div>
                </div>

                {/* Committee avatars -- real photos, real votes, News excluded.
                    Name + vote are VISIBLE text, not a hover title -- a
                    static downloaded PNG has no hover state, so a
                    tooltip-only label would never actually be seen. */}
                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-3">
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {scoredAnalysts.map(r => {
                            const photoSrc = photoAssignments.get(r.analyst);
                            const color = VOTE_COLOR[r.recommendation] ?? "#8A8FA3";
                            return (
                                <div key={r.analyst} className="flex w-20 flex-col items-center text-center">
                                    <div className="h-12 w-12 overflow-hidden rounded-full border-2" style={{ borderColor: color }}>
                                        {photoSrc && (
                                            // eslint-disable-next-line @next/next/no-img-element -- off-screen capture, avoiding next/image lazy-load risk
                                            <img src={photoSrc} alt={r.analyst} className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <p className="mt-1 text-[9px] leading-tight text-zinc-500">{r.analyst.replace(" Analyst", "")}</p>
                                    <p className="text-[9px] font-semibold" style={{ color }}>{r.recommendation.replace("_", " ")}</p>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-1.5 text-center text-xs text-zinc-500">
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
                            <p className="text-[9px] text-zinc-500">🐂 Bull</p>
                        </div>
                        <div className="flex-1 rounded-md bg-zinc-800/40 p-2 text-center">
                            <p className="text-sm font-bold text-zinc-300">{scenarios.base.probability}%</p>
                            <p className="text-[9px] text-zinc-500">⚪ Neutral</p>
                        </div>
                        <div className="flex-1 rounded-md bg-red-950/30 p-2 text-center">
                            <p className="text-sm font-bold text-red-400">{scenarios.bear.probability}%</p>
                            <p className="text-[9px] text-zinc-500">🐻 Bear</p>
                        </div>
                    </div>
                )}

                {/* Bull/bear case -- real per-analyst thesis text, with icons */}
                {(bullishAnalysts.length > 0 || bearishAnalysts.length > 0) && (
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="rounded-lg border border-emerald-900/40 bg-[#0D111B] p-2.5">
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">🐂 Bull case</p>
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
                        <div className="rounded-lg border border-red-900/40 bg-[#0D111B] p-2.5">
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">🐻 Bear case</p>
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

                {/* Committee Conclusion -- real bullets from the same bull/bear
                    thesis data already shown above (not new/invented content,
                    just a skimmable summary of it), ending with the
                    recommendation restated for anyone who only reads this box. */}
                <div className="rounded-lg border border-violet-900/40 bg-[#160B3D] p-2.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">Committee Conclusion</p>
                    <div className="space-y-1">
                        {bullishAnalysts.slice(0, 2).map(a => (
                            <p key={a.analyst} className="text-xs leading-snug text-emerald-300">✓ {a.thesis}</p>
                        ))}
                        {bearishAnalysts.slice(0, 2).map(a => (
                            <p key={a.analyst} className="text-xs leading-snug text-red-300">✕ {a.thesis}</p>
                        ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-violet-900/40 pt-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-zinc-500">Final Recommendation</span>
                        <span className={`text-sm font-black ${RATING_STYLE[rating]}`}>{RATING_HEADLINE[rating]}</span>
                    </div>
                </div>

                {/* Real per-analyst score bars -- explains the recommendation.
                    Deliberately plain CSS/div bars, NOT a recharts
                    ResponsiveContainer -- that measures its parent via the
                    DOM to size itself, and this card renders off-screen
                    (position: fixed, -left-9999px) before being captured
                    by html-to-image. Off-screen DOM measurement is a real,
                    known failure mode for that pattern -- likely the exact
                    cause of the empty chart space reported. Plain bars
                    have no such dependency. */}
                {scoreChartData.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">AI Conviction by Analyst</p>
                        <div className="space-y-1">
                            {scoreChartData.map(d => (
                                <div key={d.name} className="flex items-center gap-2">
                                    <span className="w-20 shrink-0 text-right text-[10px] text-zinc-400">{d.name}</span>
                                    <div className="h-3 flex-1 overflow-hidden rounded bg-zinc-800">
                                        <div className="h-full rounded bg-violet-500" style={{ width: `${Math.max(2, d.score)}%` }} />
                                    </div>
                                    <span className="w-7 shrink-0 text-[10px] text-zinc-500">{d.score}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Full committee table -- the signature closing element */}
                <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Committee</p>
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

                {/* Footer -- branding-forward, sources as a checklist, legal notice smaller and last */}
                <div className="border-t border-zinc-800 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] uppercase tracking-wide text-zinc-600">Powered by</p>
                            <p className="text-sm font-bold text-violet-300">IPO Sniper AI</p>
                            <p className="text-[9px] text-zinc-600">AI Research Platform</p>
                        </div>
                        {qrCodeDataUrl && (
                            <div className="flex flex-col items-center">
                                {/* eslint-disable-next-line @next/next/no-img-element -- data URL, off-screen capture */}
                                <img src={qrCodeDataUrl} alt="Scan to view full report" className="h-16 w-16" />
                                <p className="mt-0.5 text-[7px] text-zinc-600">Scan for full report</p>
                            </div>
                        )}
                    </div>
                    <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-zinc-500">Sources</p>
                    <p className="text-[10px] text-zinc-500">✓ SEC EDGAR &nbsp; ✓ Exchange Data &nbsp; ✓ Financial Statements &nbsp; ✓ AI Reasoning Engine</p>
                    <p className="mt-2 text-[9px] leading-relaxed text-zinc-700">
                        AI-synthesized research, not investment advice. Data may be incomplete — verify independently before acting. IPO Sniper AI is not a registered investment advisor.
                        {" "}ⓘ Public Research Snapshot — certain proprietary and licensed research inputs are omitted from this public report.
                    </p>
                </div>
            </div>
        );
    }
);

export default ShareCard;
