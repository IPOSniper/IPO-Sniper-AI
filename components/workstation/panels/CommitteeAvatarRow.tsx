import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * Option 3 from the committee-avatar decision: premium-feeling
 * visual avatars, but every one explicitly labeled "AI [Role]", plus
 * a prominent, unmissable disclosure banner that these are AI
 * personas, not real people. This directly supersedes the earlier
 * pure-abstract-icon version of this component -- see git history
 * for that decision, and docs/IPO_SNIPER_OS.md, which should be
 * updated to reflect this refinement.
 *
 * IMPORTANT LIMITATION, stated plainly: there's no image-generation
 * or photo tooling available to produce or host actual photorealistic
 * headshots, so these avatars are gradient-styled initials, not
 * photos. That's not a compromise on the goal here -- Option 3's
 * actual requirement is "clearly AI, not ambiguous," and a stylized
 * avatar next to an explicit "AI [Role]" label satisfies that better
 * than a photorealistic face would, which is closer to the exact
 * ambiguity Option 1 was rejected for. If real photo assets are
 * added later, the "AI" label and the disclosure banner below must
 * stay -- they're the actual requirement, the avatar style is not.
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

/** Deterministic per-analyst gradient, keyed off the real analyst name so it's stable across renders/refreshes, not random. */
const GRADIENTS = [
    "from-violet-600 to-indigo-700",
    "from-blue-600 to-cyan-700",
    "from-emerald-600 to-teal-700",
    "from-amber-600 to-orange-700",
    "from-rose-600 to-pink-700",
    "from-fuchsia-600 to-purple-700",
    "from-sky-600 to-blue-700",
];

function gradientFor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return GRADIENTS[hash % GRADIENTS.length];
}

export default function CommitteeAvatarRow({ research }: WorkstationPanelProps) {
    const { committee } = research;
    const votingAnalysts = committee.reports.filter(r => r.confidence > 0);

    const buyCount = votingAnalysts.filter(r => r.recommendation === "STRONG_BUY" || r.recommendation === "BUY").length;
    const sellCount = votingAnalysts.filter(r => r.recommendation === "REDUCE" || r.recommendation === "SELL").length;
    const holdCount = votingAnalysts.length - buyCount - sellCount;
    const total = votingAnalysts.length || 1;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">AI Analyst Committee</h2>
                <span className="text-xs text-emerald-400">Live</span>
            </div>

            {/* The actual requirement from the Option 3 decision — not
                fine print, not collapsible, always visible above the
                avatars themselves. */}
            <p className="mb-4 rounded-md border border-violet-900/40 bg-violet-950/20 px-3 py-1.5 text-xs text-violet-300">
                These are AI analyst personas, not real people — each represents a specialized research process that contributes evidence to the committee&apos;s recommendation.
            </p>

            <div className="mb-4 flex flex-wrap gap-4">
                {committee.reports.map(report => {
                    const hasOpinion = report.confidence > 0;
                    const color = hasOpinion ? (RECOMMENDATION_COLOR[report.recommendation] ?? "#8A8FA3") : "#3F3F46";
                    const gradient = gradientFor(report.analyst);
                    return (
                        <div key={report.analyst} className="flex w-24 flex-col items-center text-center">
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-full border-2 bg-gradient-to-br"
                                style={{ borderColor: color, opacity: hasOpinion ? 1 : 0.4 }}
                            >
                                <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}>
                                    <span className="text-xs font-bold text-white">
                                        {report.analyst.split(" ")[0].slice(0, 2).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <span className="mt-1.5 text-[10px] font-medium leading-tight text-zinc-300">
                                AI {report.analyst}
                            </span>
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
