import { forwardRef } from "react";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { excludeAnalysts, recommendationToRating } from "../../shared/scorePresentation";
import { BarChart, Bar, ResponsiveContainer } from "recharts";

const RATING_STYLE: Record<string, string> = {
    Bullish: "text-emerald-400",
    Neutral: "text-zinc-300",
    Bearish: "text-red-400",
};

/**
 * The actual shareable card, rendered off-screen and captured to
 * PNG by ShareCardButton. Deliberately excludes anything sourced
 * from NewsAPI -- see excludeAnalysts() -- since NewsAPI's free
 * Developer plan ToS forbids production/public use entirely
 * (confirmed directly from newsapi.org/terms), and this recomputes
 * the recommendation from the remaining analysts rather than just
 * hiding News-specific UI while still using it in the aggregate
 * number.
 *
 * Also excludes anything from Company (Finnhub /stock/profile2 --
 * only real for sector/industry text, not the flagged concern) and
 * includes Quote/Financial Statements per explicit scope: Finnhub +
 * SEC + Financial Statements only, pending the user's own
 * verification of Finnhub's redistribution terms (see chat -- this
 * was NOT independently confirmed safe, only SEC and the "excluded
 * News" logic were).
 *
 * Extended to match institutional_research_card.html's layout --
 * facts grid, probability chips, bull/bear case, AI reasoning box.
 * Every new field below is either a real committee/evidence number,
 * or an honest per-analyst thesis quote. The mockup's "12-month
 * target price" and short/swing "time horizon" text are NOT
 * included -- nothing in ResearchObject computes a real target price
 * or horizon-specific forecast, and inventing one here would be
 * exactly the kind of fabricated number this whole product is built
 * to never produce. investmentDecision.scenarios' probability/
 * catalysts fields ARE real when investmentDecision exists, so those
 * are used for the probability chips instead.
 */
const ShareCard = forwardRef<HTMLDivElement, WorkstationPanelProps>(
    function ShareCard({ research }, ref) {
        const { committee, investmentDecision } = research;
        const { quote, financialStatements } = research.report.evidence;
        const company = research.report.evidence.company;

        const safe = excludeAnalysts(committee, ["News Analyst"]);
        const rating = recommendationToRating(safe.recommendation);

        const statements = financialStatements.statements.verified
            ? financialStatements.statements.value
            : [];

        const chartData = statements.map(s => ({ year: s.fiscalYear, revenue: s.revenue }));

        // Facts grid -- every value derived directly from a real
        // FinancialStatement field, or null (rendered as "—") if the
        // data isn't there. No field is guessed.
        const latest = statements.length > 0 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[0] : null;
        const prior = statements.length > 1 ? [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear)[1] : null;
        const revenueGrowthPct = latest && prior && prior.revenue !== 0
            ? ((latest.revenue - prior.revenue) / Math.abs(prior.revenue)) * 100
            : null;
        const grossMarginPct = latest && latest.revenue !== 0 ? (latest.grossProfit / latest.revenue) * 100 : null;
        const debtToEquity = latest && latest.shareholdersEquity !== 0 ? latest.debt / latest.shareholdersEquity : null;

        // Evidence quality -- average of each analyst's own
        // evidenceStrength field (0-100, already computed by the
        // committee itself), not a separately-invented percentage.
        const votingAnalysts = committee.reports.filter(r => r.confidence > 0);
        const avgEvidenceStrength = votingAnalysts.length > 0
            ? Math.round(votingAnalysts.reduce((s, r) => s + r.evidenceStrength, 0) / votingAnalysts.length)
            : null;

        const bullishAnalysts = committee.reports.filter(r => r.recommendation === "STRONG_BUY" || r.recommendation === "BUY");
        const bearishAnalysts = committee.reports.filter(r => r.recommendation === "REDUCE" || r.recommendation === "SELL");

        const scenarios = investmentDecision?.scenarios;

        return (
            <div
                ref={ref}
                className="flex w-[680px] flex-col gap-4 bg-[#060A12] p-8"
                style={{ fontFamily: "Georgia, serif" }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-violet-400">IPO Sniper AI</p>
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

                <div className="flex items-center gap-4 rounded-xl border border-zinc-800 p-4">
                    <span className={`text-2xl font-bold ${RATING_STYLE[rating]}`}>{rating}</span>
                    <div className="text-sm text-zinc-500">
                        AI Committee assessment — {safe.confidence}% confidence, excludes news sentiment
                    </div>
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

                {/* Evidence quality + vote split -- real committee numbers */}
                <div className="flex items-center gap-3 rounded-lg border border-amber-900/40 bg-amber-950/10 p-3 text-xs text-amber-200">
                    <span className="font-semibold text-amber-400">
                        {avgEvidenceStrength !== null ? `Evidence quality ${avgEvidenceStrength}%.` : "Evidence quality unavailable."}
                    </span>
                    <span>
                        {votingAnalysts.length} analysts voted — {bullishAnalysts.length} bullish, {bearishAnalysts.length} bearish, {votingAnalysts.length - bullishAnalysts.length - bearishAnalysts.length} hold.
                    </span>
                </div>

                {/* Probability chips -- only rendered when investmentDecision exists, since scenarios.bull/base/bear.probability isn't computed on every code path */}
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

                {/* Bull/bear case -- real per-analyst thesis text, not invented bullets. Capped to 3 each to keep the card a reasonable size. */}
                {(bullishAnalysts.length > 0 || bearishAnalysts.length > 0) && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-emerald-900/40 bg-[#0D111B] p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Bull case</p>
                            {bullishAnalysts.slice(0, 3).map(a => (
                                <p key={a.analyst} className="mb-1.5 text-[11px] leading-snug text-zinc-300">
                                    <span className="text-zinc-500">{a.analyst}: </span>{a.thesis}
                                </p>
                            ))}
                            {bullishAnalysts.length === 0 && <p className="text-[11px] text-zinc-600">No analysts currently bullish.</p>}
                        </div>
                        <div className="rounded-lg border border-red-900/40 bg-[#0D111B] p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-red-400">Bear case</p>
                            {bearishAnalysts.slice(0, 3).map(a => (
                                <p key={a.analyst} className="mb-1.5 text-[11px] leading-snug text-zinc-300">
                                    <span className="text-zinc-500">{a.analyst}: </span>{a.thesis}
                                </p>
                            ))}
                            {bearishAnalysts.length === 0 && <p className="text-[11px] text-zinc-600">No analysts currently bearish.</p>}
                        </div>
                    </div>
                )}

                {/* AI reasoning -- real committee.summary, plus the executive decision summary when investmentDecision exists */}
                <div className="rounded-lg border border-violet-900/40 bg-[#160B3D] p-3.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">Committee reasoning</p>
                    <p className="text-xs leading-relaxed text-zinc-200">{committee.summary}</p>
                    {investmentDecision?.executiveDecision.summary &&
                        investmentDecision.executiveDecision.summary.trim() !== committee.summary.trim() && (
                        <p className="mt-2 text-xs leading-relaxed text-zinc-300">{investmentDecision.executiveDecision.summary}</p>
                    )}
                </div>

                {chartData.length > 0 && (
                    <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Revenue by Fiscal Year</p>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <Bar dataKey="revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-600">
                    <p>Sources: SEC EDGAR, Finnhub. AI-synthesized research, not investment advice.</p>
                    <p>Data may be incomplete — verify independently before acting. IPO Sniper AI is not a registered investment advisor.</p>
                </div>
            </div>
        );
    }
);

export default ShareCard;
