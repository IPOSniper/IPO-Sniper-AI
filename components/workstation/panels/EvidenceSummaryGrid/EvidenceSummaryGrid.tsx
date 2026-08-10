import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import UnverifiedCard from "../../shared/UnverifiedCard";
import InstitutionalOwnershipCard from "../InstitutionalOwnershipCard/InstitutionalOwnershipCard";

function StatCard({ label, value, trend }: { label: string; value: string; trend?: "up" | "down" }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${
                trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-white"
            }`}>
                {value}
            </p>
        </div>
    );
}

function daysUntil(dateStr: string): number {
    return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function EvidenceSummaryGrid({ research }: WorkstationPanelProps) {
    const { financial, ipo, management, news } = research.report.evidence;
    const evidenceCount = [financial, ipo, management, news].reduce(
        (sum, category) => sum + Object.keys(category).length, 0
    );

    const scoredReports = research.committee.reports.filter(r => r.confidence > 0);
    const analystSentiment = scoredReports.length > 0
        ? (scoredReports.filter(r => r.recommendation === "BUY" || r.recommendation === "STRONG_BUY").length / scoredReports.length) * 5
        : null;

    // 180 days is the conventional (not universal) IPO lock-up length
    // — a real calculation from a real filed IPO date, not a fabricated
    // number, but worth knowing it's a convention, not a confirmed
    // contractual term for this specific offering.
    const lockUpDays = ipo.ipoDate.verified && ipo.ipoDate.value
        ? Math.max(0, 180 - (Date.now() - new Date(ipo.ipoDate.value).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Evidence Summary</h2>
                <span className="text-xs text-zinc-500">{evidenceCount} evidence points collected</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {financial.revenueGrowth.verified ? (
                    <StatCard label="Revenue Growth (YoY)" value={`${financial.revenueGrowth.value.toFixed(0)}%`} trend={financial.revenueGrowth.value >= 0 ? "up" : "down"} />
                ) : (
                    <UnverifiedCard title="Revenue Growth" reason="No live Finnhub data for this ticker" />
                )}

                {financial.grossMargin.verified ? (
                    <StatCard label="Gross Margin" value={`${financial.grossMargin.value.toFixed(0)}%`} trend="up" />
                ) : (
                    <UnverifiedCard title="Gross Margin" reason="No live Finnhub data for this ticker" />
                )}

                <InstitutionalOwnershipCard ticker={research.company.ticker} />

                {lockUpDays !== null ? (
                    <StatCard label="Lock-Up Period" value={lockUpDays > 0 ? `${Math.round(lockUpDays)}d remaining` : "Expired"} />
                ) : (
                    <UnverifiedCard title="Lock-Up Period" reason="No confirmed IPO date for this ticker yet" />
                )}

                {financial.cashAndEquivalents.verified ? (
                    <StatCard label="Cash & Equivalents" value={`$${(financial.cashAndEquivalents.value / 1_000_000_000).toFixed(1)}B`} />
                ) : (
                    <UnverifiedCard title="Cash & Equivalents" reason="No balance-sheet provider wired in yet" />
                )}

                {analystSentiment !== null ? (
                    <StatCard label="Analyst Sentiment" value={`${analystSentiment.toFixed(1)}/5`} />
                ) : (
                    <UnverifiedCard title="Analyst Sentiment" reason="No analyst had enough data to vote" />
                )}
            </div>
        </div>
    );
}
