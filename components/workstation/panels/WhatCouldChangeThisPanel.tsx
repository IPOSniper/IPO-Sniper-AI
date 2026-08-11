import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * From the mockup's "What could change this decision?" panel --
 * real catalysts (investmentDecision.scenarios.bull/bear.catalysts)
 * and real risks (investmentDecision.riskRadar.risks, the same real
 * source AIVerdictRow's Risk Level card already uses). Only rendered
 * when investmentDecision exists, since it's an optional field not
 * every code path builds -- no fallback fabricated content.
 */
export default function WhatCouldChangeThisPanel({ research }: WorkstationPanelProps) {
    const { investmentDecision } = research;
    if (!investmentDecision) return null;

    const catalysts = [
        ...investmentDecision.scenarios.bull.catalysts.map(c => ({ text: c, tone: "bull" as const })),
        ...investmentDecision.scenarios.bear.catalysts.map(c => ({ text: c, tone: "bear" as const })),
    ];
    const risks = investmentDecision.riskRadar.risks;

    if (catalysts.length === 0 && risks.length === 0) return null;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">What could change this decision?</h2>

            {catalysts.length > 0 && (
                <div className="mb-3">
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-500">Catalysts</p>
                    <div className="space-y-1">
                        {catalysts.map((c, i) => (
                            <p key={i} className={`text-xs ${c.tone === "bull" ? "text-emerald-400" : "text-red-400"}`}>
                                {c.text}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {risks.length > 0 && (
                <div>
                    <p className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-500">Risks</p>
                    <div className="space-y-1">
                        {risks.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-zinc-300">{r.title}</span>
                                <span className={r.severity >= 70 ? "text-red-400" : r.severity >= 40 ? "text-amber-400" : "text-zinc-500"}>
                                    {r.severity}/100
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
