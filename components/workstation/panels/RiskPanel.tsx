import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { DataBar, EmptyState } from "../design/DesignPrimitives";

function getRiskData(research: WorkstationPanelProps["research"]) {
    const reports = research.committee.reports.filter(
        (report) => report.confidence > 0
    );

    const risks = reports.flatMap((report) =>
        report.risks.map((risk) => ({
            analyst: report.analyst,
            ...risk,
        }))
    );

    return risks;
}

export default function RiskPanel({ research }: WorkstationPanelProps) {
    const risks = getRiskData(research);

    if (risks.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-3">
                    <h2 className="text-sm font-semibold text-zinc-200">
                        Risk Intelligence
                    </h2>
                    <p className="mt-1 text-[10px] text-zinc-600">
                        Risks surfaced from analysts with verified data.
                    </p>
                </div>

                <EmptyState
                    label="No analyst risk records available"
                    detail="No risk visualization is shown because the underlying committee reports do not contain risk records."
                />
            </div>
        );
    }

    /*
     * Risk records are intentionally grouped by their source analyst.
     * We do not manufacture a severity score here. If the underlying
     * Risk type contains a numeric severity field, use it; otherwise
     * present the records as factual risk observations.
     */

    const severityValues = risks
        .map((risk) => {
            const candidate = risk as unknown as {
                severity?: unknown;
                score?: unknown;
            };

            if (
                typeof candidate.severity === "number" &&
                Number.isFinite(candidate.severity)
            ) {
                return candidate.severity;
            }

            if (
                typeof candidate.score === "number" &&
                Number.isFinite(candidate.score)
            ) {
                return candidate.score;
            }

            return null;
        })
        .filter((value): value is number => value !== null);

    const hasSeverity = severityValues.length === risks.length;

    const uniqueDescriptions = Array.from(
        new Map(
            risks.map((risk) => [
                String(risk.description),
                risk,
            ])
        ).values()
    );

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-200">
                        Risk Intelligence
                    </h2>
                    <p className="mt-1 text-[10px] leading-4 text-zinc-600">
                        {risks.length} risk observations from analysts
                        with verified data.
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <div className="text-lg font-semibold text-white">
                        {uniqueDescriptions.length}
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-zinc-600">
                        unique risks
                    </div>
                </div>
            </div>

            {hasSeverity && (
                <div className="mb-5 rounded-md border border-zinc-800 bg-zinc-950 p-3">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                            Risk severity
                        </span>
                        <span className="text-[9px] text-zinc-600">
                            Source risk metadata
                        </span>
                    </div>

                    <div className="space-y-2">
                        {uniqueDescriptions.map((risk, index) => {
                            const candidate =
                                risk as unknown as {
                                    severity?: unknown;
                                    score?: unknown;
                                };

                            const raw =
                                typeof candidate.severity === "number"
                                    ? candidate.severity
                                    : typeof candidate.score === "number"
                                      ? candidate.score
                                      : 0;

                            const value =
                                raw <= 1 ? raw * 100 : raw;

                            return (
                                <DataBar
                                    key={`${risk.description}-${index}`}
                                    value={value}
                                    label={String(risk.description)}
                                    right={`${Math.round(value)}`}
                                    tone="warning"
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {!hasSeverity && (
                <div className="mb-4 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <div className="text-[10px] font-medium text-zinc-400">
                        Severity visualization unavailable
                    </div>
                    <div className="mt-1 text-[9px] leading-4 text-zinc-600">
                        The current risk records do not expose a complete
                        comparable severity value. IPO Sniper AI is showing
                        the underlying observations rather than inventing
                        a severity score.
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {uniqueDescriptions.map((risk, index) => (
                    <div
                        key={`${risk.description}-${index}`}
                        className="rounded-md border border-zinc-800/80 bg-zinc-950/60 px-3 py-2"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-xs leading-5 text-zinc-300">
                                {String(risk.description)}
                            </p>

                            <span className="shrink-0 text-[9px] uppercase tracking-wide text-zinc-600">
                                {risk.analyst}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
