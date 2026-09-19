import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function MissionControlHeader({ research }: WorkstationPanelProps) {
    const { committee, runtime } = research;

    const votingAnalysts = committee.reports.filter(
        (report) => report.confidence > 0
    );

    const generatedLabel = new Date(runtime.generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    });

    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-3 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                Research Run Complete
            </div>

            <span className="text-zinc-500">
                <span className="font-semibold text-white">
                    {committee.reports.length}
                </span>{" "}
                Analysts
            </span>

            <span className="text-zinc-500">
                <span className="font-semibold text-white">
                    {votingAnalysts.length}
                </span>{" "}
                With a real opinion
            </span>

            <span className="text-zinc-500">
                <span className="font-semibold text-white">
                    {runtime.completedStages.length}
                </span>{" "}
                Pipeline stages complete
            </span>

            <span className="ml-auto text-zinc-600">
                Generated {generatedLabel}
            </span>
        </div>
    );
}
