import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function RiskModule({ research }: WorkstationPanelProps) {
    const risks = research.investmentDecision?.riskRadar.risks ?? [];
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Risk</h3>
                {risks.length > 0 && <span className="text-[10px] font-bold text-red-400">HIGH</span>}
            </div>
            {risks.length === 0 ? (
                <p className="text-xs text-zinc-600">No flagged risks, or full research not yet run.</p>
            ) : (
                risks.slice(0, 3).map((r, i) => (
                    <div key={i} className="py-1">
                        <p className="text-xs text-zinc-400">- {r.title}</p>
                        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div className={r.severity >= 70 ? "bg-red-500" : r.severity >= 40 ? "bg-amber-500" : "bg-emerald-500"} style={{ width: r.severity + "%", height: "100%" }} />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
