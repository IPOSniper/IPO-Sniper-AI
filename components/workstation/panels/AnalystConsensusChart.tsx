"use client";

type CommitteeReport = {
    analyst: string;
    recommendation: string;
    confidence: number;
};

type Props = {
    reports: CommitteeReport[];
};

const GROUPS = [
    {
        key: "BUY",
        label: "Bullish",
        recommendations: ["STRONG_BUY", "BUY"],
    },
    {
        key: "HOLD",
        label: "Neutral",
        recommendations: ["HOLD"],
    },
    {
        key: "SELL",
        label: "Bearish",
        recommendations: ["REDUCE", "SELL"],
    },
] as const;

function displayRecommendation(value: string) {
    return value.replaceAll("_", " ");
}

export default function AnalystConsensusChart({ reports }: Props) {
    const verified = reports.filter(
        (report) => Number(report.confidence) > 0
    );

    const unavailable = reports.length - verified.length;

    const counts = GROUPS.map((group) => ({
        ...group,
        count: verified.filter((report) =>
            group.recommendations.includes(
                report.recommendation as never
            )
        ).length,
    }));

    const total = verified.length;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-100">
                        Committee Consensus
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                        Distribution of analyst opinions with verified
                        analytical support.
                    </p>
                </div>

                <div className="text-right">
                    <div className="text-lg font-semibold text-white">
                        {total}/{reports.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-zinc-600">
                        verified analyses
                    </div>
                </div>
            </div>

            {total > 0 ? (
                <>
                    <div className="mb-4 h-4 overflow-hidden rounded-full bg-zinc-800">
                        <div className="flex h-full w-full">
                            {counts.map((group) => (
                                group.count > 0 && (
                                    <div
                                        key={group.key}
                                        className={
                                            group.key === "BUY"
                                                ? "bg-emerald-500"
                                                : group.key === "HOLD"
                                                  ? "bg-zinc-500"
                                                  : "bg-red-500"
                                        }
                                        style={{
                                            width: `${(group.count / total) * 100}%`,
                                        }}
                                        title={`${group.label}: ${group.count}`}
                                    />
                                )
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {counts.map((group) => (
                            <div
                                key={group.key}
                                className="rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                                        {group.label}
                                    </span>
                                    <span className="text-sm font-semibold text-zinc-100">
                                        {group.count}
                                    </span>
                                </div>

                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                        className={
                                            group.key === "BUY"
                                                ? "h-full bg-emerald-500"
                                                : group.key === "HOLD"
                                                  ? "h-full bg-zinc-500"
                                                  : "h-full bg-red-500"
                                        }
                                        style={{
                                            width: `${total ? (group.count / total) * 100 : 0}%`,
                                        }}
                                    />
                                </div>

                                <div className="mt-1 text-[10px] text-zinc-600">
                                    {total
                                        ? `${Math.round((group.count / total) * 100)}% of verified`
                                        : "No verified data"}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-5 text-center text-xs text-zinc-600">
                    No verified committee opinions available.
                </div>
            )}

            <div className="mt-4 border-t border-zinc-800 pt-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-600">
                    <span>
                        Verified:{" "}
                        <span className="text-zinc-400">{total}</span>
                    </span>

                    <span>
                        No verified data:{" "}
                        <span className="text-zinc-400">{unavailable}</span>
                    </span>

                    <span>
                        Total analysts:{" "}
                        <span className="text-zinc-400">{reports.length}</span>
                    </span>
                </div>
            </div>

            {verified.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-1.5 md:grid-cols-2">
                    {verified.map((report) => (
                        <div
                            key={report.analyst}
                            className="flex items-center justify-between rounded-md border border-zinc-900 bg-zinc-900/40 px-2.5 py-1.5"
                        >
                            <span className="truncate text-[10px] text-zinc-400">
                                {report.analyst}
                            </span>

                            <span className="ml-2 whitespace-nowrap text-[10px] text-zinc-600">
                                {displayRecommendation(report.recommendation)}
                                {" · "}
                                {report.confidence}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}