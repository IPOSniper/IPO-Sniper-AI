"use client";

import { X } from "lucide-react";
import type { AnalystReport } from "@/engine/committee/contracts/AnalystReport";

/**
 * Group A item (Report #12, "Analyst Workspace") + #6 ("every card
 * expands to deep dive") combined into one real feature. Every field
 * shown here already existed in AnalystReport -- evidence[],
 * assumptions[], risks[], unknowns[], monitoring[] -- none of it was
 * displayed anywhere before this. This is the actual "deep dive"
 * (real evidence with real sources/confidence, real assumptions,
 * real risks, real unknowns, real monitoring points), not a
 * decorative expand animation on top of the same three fields that
 * were already visible.
 */

const SEVERITY_COLOR: Record<string, string> = {
 HIGH: "text-red-400 border-red-900/50 bg-red-950/20",
 MEDIUM: "text-amber-400 border-amber-900/50 bg-amber-950/20",
 LOW: "text-zinc-400 border-zinc-800 bg-zinc-900",
};

interface Props {
 report: AnalystReport | null;
 onClose: () => void;
}

export default function AnalystWorkspace({ report, onClose }: Props) {
 if (!report) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
 <div
 className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6"
 onClick={e => e.stopPropagation()}
 >
 <div className="mb-4 flex items-start justify-between">
 <div>
 <p className="text-xs text-violet-400">AI Analyst Workspace</p>
 <h2 className="text-lg font-semibold text-white">AI {report.analyst}</h2>
 </div>
 <button onClick={onClose} className="text-zinc-500 hover:text-white">
 <X size={20} />
 </button>
 </div>

 <div className="mb-4 flex items-center gap-4 text-xs">
 <span className="text-zinc-500">Confidence <span className="font-semibold text-white">{report.confidence}%</span></span>
 <span className="text-zinc-500">Evidence strength <span className="font-semibold text-white">{report.evidenceStrength}%</span></span>
 <span className="text-zinc-500">Score <span className="font-semibold text-white">{report.score}</span></span>
 </div>

 <div className="mb-5 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
 <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Thesis</p>
 <p className="text-sm text-zinc-200">{report.thesis}</p>
 </div>

 {report.evidence.length > 0 && (
 <div className="mb-5">
 <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">
 Evidence ({report.evidence.filter(e => e.verified).length}/{report.evidence.length} verified)
 </p>
 <div className="space-y-1.5">
 {report.evidence.map((e, i) => (
 <div key={i} className="flex items-center justify-between rounded-md bg-zinc-900 px-3 py-1.5 text-xs">
 <span className="text-zinc-300">{e.category} - {e.metric}</span>
 <div className="flex items-center gap-2">
 <span className="text-zinc-500">{e.source}</span>
 <span className={e.verified ? "text-emerald-400" : "text-zinc-600"}>
 {e.verified ? "Verified" : "Unverified"}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {report.assumptions.length > 0 && (
 <div className="mb-5">
 <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Assumptions</p>
 <div className="space-y-1.5">
 {report.assumptions.map((a, i) => (
 <div key={i} className="flex items-center justify-between text-xs">
 <span className="text-zinc-300">{a.statement}</span>
 <span className="text-zinc-500">{a.confidence}% confidence</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {report.risks.length > 0 && (
 <div className="mb-5">
 <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Risks flagged</p>
 <div className="space-y-1.5">
 {report.risks.map((r, i) => (
 <div key={i} className={`rounded-md border px-3 py-1.5 text-xs ${SEVERITY_COLOR[r.severity] ?? SEVERITY_COLOR.LOW}`}>
 <span className="font-medium">{r.category}</span> - {r.description}
 </div>
 ))}
 </div>
 </div>
 )}

 {report.unknowns.length > 0 && (
 <div className="mb-5">
 <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Unknowns - what this analyst couldn&apos;t verify</p>
 <ul className="space-y-1 text-xs text-zinc-400">
 {report.unknowns.map((u, i) => <li key={i}>- {u}</li>)}
 </ul>
 </div>
 )}

 {report.monitoring.length > 0 && (
 <div>
 <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">What to watch</p>
 <div className="space-y-1.5">
 {report.monitoring.map((m, i) => (
 <div key={i} className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs">
 <p className="font-medium text-zinc-200">{m.title}</p>
 <p className="text-zinc-500">{m.description}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
