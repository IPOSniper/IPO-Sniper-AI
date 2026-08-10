import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * The avatar-row committee view from the navy mockup -- built as a
 * NEW, additive panel rather than replacing CommitteePanel.tsx (the
 * existing "Committee Discussion" text list), since that one already
 * works and this session has already caused one real confusion
 * episode from assuming things worked before checking. This panel
 * and CommitteePanel.tsx present the SAME real committee.reports
 * data two different ways -- a glanceable visual summary here, full
 * per-analyst reasoning there.
 *
 * Color is a direct function of each analyst's real recommendation,
 * not decoration: green = STRONG_BUY/BUY, gray = HOLD, red =
 * REDUCE/SELL. An analyst with confidence 0 (no real opinion --
 * insufficient data) is shown but visually muted, matching the same
 * exclusion AnalystLayer and RiskRadarEngine already apply.
 */

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "#16D47B",
    BUY: "#16D47B",
    HOLD: "#8A8FA3",
    REDUCE: "#F04452",
    SELL: "#F04452",
};

const RECOMMENDATION_LABEL: Record<string, string> = {
    STRONG_BUY: "STRONG BUY",
    BUY: "BUY",
    HOLD: "HOLD",
    REDUCE: "REDUCE",
    SELL: "SELL",
};

export default function CommitteeAvatarRow({ research }: WorkstationPanelProps) {
    const { committee } = research;
    const votingAnalysts = committee.reports.filter(r => r.confidence > 0);

    const buyCount = votingAnalysts.filter(r => r.recommendation === "STRONG_BUY" || r.recommendation === "BUY").length;
    const sellCount = votingAnalysts.filter(r => r.recommendation === "REDUCE" || r.recommendation === "SELL").length;
    const holdCount = votingAnalysts.length - buyCount - sellCount;
    const total = votingAnalysts.length || 1;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">AI Analyst Committee</h2>
                <span className="text-xs text-emerald-400">Live</span>
            </div>

            <div className="mb-4 flex flex-wrap gap-4">
                {committee.reports.map(report => {
                    const hasOpinion = report.confidence > 0;
                    const color = hasOpinion ? (RECOMMENDATION_COLOR[report.recommendation] ?? "#8A8FA3") : "#3F3F46";
                    return (
                        <div key={report.analyst} className="flex w-20 flex-col items-center text-center">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-full border-2"
                                style={{ borderColor: color, opacity: hasOpinion ? 1 : 0.4 }}
                            >
                                <span className="text-[10px] font-semibold text-zinc-300">
                                    {report.analyst.split(" ")[0].slice(0, 3).toUpperCase()}
                                </span>
                            </div>
                            <span className="mt-1.5 text-[10px] leading-tight text-zinc-500">{report.analyst}</span>
                            <span
                                className="mt-0.5 text-[10px] font-semibold"
                                style={{ color: hasOpinion ? color : "#52525b" }}
                            >
                                {hasOpinion ? RECOMMENDATION_LABEL[report.recommendation] ?? report.recommendation : "NO DATA"}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                {buyCount > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(buyCount / total) * 100}%` }} />}
                {holdCount > 0 && <div className="h-full bg-zinc-600" style={{ width: `${(holdCount / total) * 100}%` }} />}
                {sellCount > 0 && <div className="h-full bg-red-500" style={{ width: `${(sellCount / total) * 100}%` }} />}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-zinc-500">
                <span>{buyCount} buy-leaning</span>
                <span>{holdCount} hold</span>
                <span>{sellCount} sell-leaning</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
                <span className="text-zinc-500">Committee vote</span>
                <span className="font-semibold text-white">
                    {RECOMMENDATION_LABEL[committee.recommendation] ?? committee.recommendation} · {committee.confidence}% confidence
                </span>
            </div>
        </div>
    );
}
