import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";

export default function ResearchProgress({ research }: WorkstationPanelProps) {
 const { completedStages } = research.runtime;

 return (
 <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 h-full">
 <div className="mb-3 flex items-center justify-between">
 <h2 className="text-lg font-semibold">Research Progress</h2>
 <span className="text-xs text-zinc-500">
 {research.ui.loading ? "RUNNING" : "COMPLETE"}
 </span>
 </div>

 <ul className="space-y-1.5">
 {completedStages.map(stage => (
 <li key={stage} className="flex items-center gap-2 text-sm text-zinc-300">
 <span className="text-emerald-400">-</span>
 {stage}
 </li>
 ))}
 </ul>
 </section>
 );
}
