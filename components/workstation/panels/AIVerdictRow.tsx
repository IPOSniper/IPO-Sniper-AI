import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * Originally three cards (AI Verdict, Evidence Quality, Risk Level).
 * The AI Verdict card was removed here because it duplicated
 * Verdict/Confidence/Agreement already shown by ResearchSnapshotPanel
 * directly above it in ResearchSession.tsx -- same canonical
 * research.researchSnapshot values, just repeated. Evidence Quality
 * and Risk Level are unique to this component and are kept.
 */
export default function AIVerdictRow({ research }: WorkstationPanelProps) {
    const { committee, investmentDecision } = research;

    const votingAnalysts = committee.reports.filter(r => r.confidence > 0);
    const avgEvidenceStrength = votingAnalysts.length > 0
        ? Math.round(votingAnalysts.reduce((s, r) => s + r.evidenceStrength, 0) / votingAnalysts.length)
        : null;

    const risks = investmentDecision?.riskRadar.risks ?? [];
    const topSeverity = risks.length > 0 ? Math.max(...risks.map(r => r.severity)) : null;
    const riskLevel = topSeverity === null ? null : topSeverity >= 70 ? "HIGH" : topSeverity >= 40 ? "MEDIUM" : "LOW";
    const riskColor = riskLevel === "HIGH" ? "text-red-400" : riskLevel === "MEDIUM" ? "text-amber-400" : "text-emerald-400";

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">Evidence Quality</p>
                <p className="mt-1 text-2xl font-bold text-white">
                    {avgEvidenceStrength !== null ? `${avgEvidenceStrength}%` : "-"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                    Average across {votingAnalysts.length} analysts with a real opinion
                </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500">Risk Level</p>
                <p className={`mt-1 text-2xl font-bold ${riskLevel ? riskColor : "text-zinc-500"}`}>
                    {riskLevel ?? "N/A"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                    {risks.length > 0
                        ? `From ${risks.length} flagged risk${risks.length === 1 ? "" : "s"} across the committee`
                        : "No risks flagged, or full research not yet run"}
                </p>
            </div>
        </div>
    );
}