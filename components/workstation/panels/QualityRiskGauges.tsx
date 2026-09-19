import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function QualityRiskGauges({ research }: WorkstationPanelProps) {
    const quality = research.report.confidence ?? 0;
    const risks = research.investmentDecision?.riskRadar.risks ?? [];
    const maxSeverity = risks.length > 0 ? Math.max(...risks.map(r => r.severity)) : 0;
    const riskLevel = maxSeverity >= 70 ? "HIGH" : maxSeverity >= 40 ? "MEDIUM" : risks.length > 0 ? "LOW" : "UNKNOWN";

    const riskColor = riskLevel === "HIGH" ? "text-red-400 border-red-900/40 bg-red-950/20"
        : riskLevel === "MEDIUM" ? "text-amber-400 border-amber-900/40 bg-amber-950/20"
        : riskLevel === "LOW" ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/20"
        : "text-zinc-500 border-zinc-800 bg-zinc-900/40";

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
                <div className="text-[10px] uppercase text-zinc-600">Confidence</div>
                <div className="relative mx-auto mt-2 h-16 w-16">
                    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#27272a" strokeWidth="3" />
                        <circle
                            cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3"
                            strokeDasharray={`${quality} ${100 - quality}`} strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-400">{quality}%</div>
                </div>
            </div>
            <div className={`rounded-xl border p-4 text-center ${riskColor}`}>
                <div className="text-[10px] uppercase text-zinc-600">Risk Level</div>
                <div className="mt-4 text-xl font-bold">{riskLevel}</div>
            </div>
        </div>
    );
}
