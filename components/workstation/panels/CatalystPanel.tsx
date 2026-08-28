import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function CatalystPanel({ research }: WorkstationPanelProps) {
 const { catalysts } = research.report;

 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <h2 className="text-lg font-semibold">Catalysts to Watch</h2>

 {catalysts.length === 0 ? (
 <p className="mt-2 text-sm text-zinc-500">
 No high-priority monitoring items flagged yet.
 </p>
 ) : (
 <ul className="mt-3 space-y-2">
 {catalysts.map((item, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
 <span className="mt-0.5 text-violet-400">-</span>
 {item}
 </li>
 ))}
 </ul>
 )}
 </div>
 );
}
