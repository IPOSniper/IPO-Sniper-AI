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
 * from NewsAPI — see excludeAnalysts() — since NewsAPI's free
 * Developer plan ToS forbids production/public use entirely
 * (confirmed directly from newsapi.org/terms), and this recomputes
 * the recommendation from the remaining analysts rather than just
 * hiding News-specific UI while still using it in the aggregate
 * number.
 *
 * Also excludes anything from Company (Finnhub /stock/profile2 —
 * only real for sector/industry text, not the flagged concern) and
 * includes Quote/Financial Statements per explicit scope: Finnhub +
 * SEC + Financial Statements only, pending the user's own
 * verification of Finnhub's redistribution terms (see chat — this
 * was NOT independently confirmed safe, only SEC and the "excluded
 * News" logic were).
 */
const ShareCard = forwardRef<HTMLDivElement, WorkstationPanelProps>(
    function ShareCard({ research }, ref) {
        const { committee } = research;
        const { quote, financialStatements } = research.report.evidence;
        const company = research.report.evidence.company;

        const safe = excludeAnalysts(committee, ["News Analyst"]);
        const rating = recommendationToRating(safe.recommendation);

        const statements = financialStatements.statements.verified
            ? financialStatements.statements.value
            : [];

        const chartData = statements.map(s => ({ year: s.fiscalYear, revenue: s.revenue }));

        return (
            <div
                ref={ref}
                className="flex w-[600px] flex-col gap-4 bg-[#09090B] p-8"
                style={{ fontFamily: "Georgia, serif" }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-zinc-500">IPO Sniper AI</p>
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

                {chartData.length > 0 && (
                    <div>
                        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Revenue by Fiscal Year</p>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <Bar dataKey="revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
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
