import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * Group A item #10 ("Mission Control Header"), built from fields that
 * were already confirmed real on ResearchObject -- research.runtime
 * (generatedAt, completedStages) and committee.reports. Deliberately
 * does NOT include the mockup's "Next Refresh 19 sec" -- there is no
 * real continuous refresh loop (research runs once per request, see
 * docs/IPO_SNIPER_OS.md's Runtime Infrastructure gap), so a countdown
 * implying live polling would be fabricated. "Live Market" is also
 * omitted for the same reason unless/until this page actually has a
 * real live market-data subscription, not a one-time fetch.
 */
export default function MissionControlHeader({ research }: WorkstationPanelProps) {
    const { committee, runtime } = research;
    const votingAnalysts = committee.reports.filter(r => r.confidence > 0);
    const avgEvidence = votingAnalysts.length > 0
        ? Math.round(votingAnalysts.reduce((s, r) => s + r.evidenceStrength, 0) / votingAnalysts.length)
        : null;

    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Committee Online
            </div>
            <span className="text-zinc-500">
                <span className="font-semibold text-white">{committee.reports.length}</span> Analysts
            </span>
            <span className="text-zinc-500">
                <span className="font-semibold text-white">{votingAnalysts.length}</span> With a real opinion
            </span>
            <span className="text-zinc-500">
                <span className="font-semibold text-white">{runtime.completedStages.length}</span> Pipeline stages complete
            </span>
            {avgEvidence !== null && (
                <span className="text-zinc-500">
                    Evidence Quality <span className="font-semibold text-white">{avgEvidence}%</span>
                </span>
            )}
            <span className="ml-auto text-zinc-600">
                Generated {new Date(runtime.generatedAt).toLocaleString()}
            </span>
        </div>
    );
}
