import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";

/**
 * Mirrors research.runtime.completedStages - the ACTUAL live
 * pipeline (Evidence -> Committee -> Assembler/Report), not a
 * stage list invented to look impressive. The codebase has dead,
 * unwired "Knowledge" and "Investigation" subsystems that were
 * tempting to list here for a richer-looking stepper - deliberately
 * not doing that. Add a stage here only once it's real and
 * reflected in ResearchAssembler.ts.
 */
export default function ProcessStepper({ research }: WorkstationPanelProps) {
 const { completedStages } = research.runtime;

 return (
 <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-6 py-3">
 {completedStages.map((stage, i) => (
 <div key={stage} className="flex items-center gap-2">
 <div className="flex items-center gap-1.5 text-sm">
 <span className="text-emerald-400">-</span>
 <span className="text-zinc-300">{stage}</span>
 </div>
 {i < completedStages.length - 1 && (
 <span className="text-zinc-700">-</span>
 )}
 </div>
 ))}

 <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
 LIVE RESEARCH
 </span>
 </div>
 );
}
