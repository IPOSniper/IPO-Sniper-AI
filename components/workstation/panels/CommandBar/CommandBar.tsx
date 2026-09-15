import Link from "next/link";
import { Home } from "lucide-react";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import SaveResearchButton from "../SaveResearchButton/SaveResearchButton";
import PublishReportButton from "../PublishReportButton/PublishReportButton";

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "text-emerald-400",
    BUY: "text-emerald-400",
    HOLD: "text-zinc-300",
    REDUCE: "text-amber-400",
    SELL: "text-red-400",
};

export default function CommandBar({ research }: WorkstationPanelProps) {
    const { committee } = research;
    const { quote, ipo, company } = research.report.evidence;

    const hasPrice = quote.price.verified;
    const hasMarketCap = quote.marketCap.verified;
    const isUp = quote.changePercent.value >= 0;

    return (
        <div className="sticky top-16 z-40 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-4 shadow-lg shadow-black/40">
            <Link
                href="/workstation"
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-zinc-300 hover:border-violet-600 hover:text-white hover:bg-zinc-800 transition"
                aria-label="Back to Workstation home"
            >
                <Home size={18} />
                Home
            </Link>

            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Research Target</p>
                <p className="text-lg font-bold text-white">
                    {company.name} <span className="text-zinc-500">({company.ticker})</span>
                </p>
            </div>

            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Price</p>
                {hasPrice ? (
                    <p className="text-lg font-semibold text-white">
                        ${quote.price.value.toFixed(2)}{" "}
                        <span className={isUp ? "text-emerald-400" : "text-red-400"}>
                            {isUp ? "+" : ""}{quote.changePercent.value.toFixed(2)}%
                        </span>
                    </p>
                ) : (
                    <p className="text-sm text-zinc-600">Not available</p>
                )}
            </div>

            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Market Cap</p>
                <p className="text-lg font-semibold text-white">
                    {hasMarketCap
                        ? `$${(quote.marketCap.value / 1_000_000_000).toFixed(1)}B`
                        : <span className="text-sm text-zinc-600">Not available</span>}
                </p>
            </div>

            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Sector</p>
                <p className="text-sm text-zinc-300">{company.sector}</p>
            </div>

            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Industry</p>
                <p className="text-sm text-zinc-300">{company.industry}</p>
            </div>

            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">IPO Date</p>
                <p className="text-sm text-zinc-300">{ipo.ipoDate.value ?? "TBD"}</p>
            </div>

            <div className="ml-auto flex items-center gap-4">
                <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Committee</p>
                    <p className={`text-sm font-bold ${RECOMMENDATION_COLOR[committee.recommendation] ?? "text-zinc-300"}`}>
                        {committee.recommendation.replace("_", " ")}
                    </p>
                    <a href="/#disclosures" className="text-[10px] text-zinc-600 hover:text-zinc-400 underline">
                        Research only, not advice
                    </a>
                </div>

                <PublishReportButton research={research} />

                <SaveResearchButton research={research} />
            </div>
        </div>
    );
}
