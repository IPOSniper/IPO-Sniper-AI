import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

export default function InvestorDecisionCenter({ research }: WorkstationPanelProps) {
 const { committee, investmentDecision } = research;

 const votingAnalysts = committee.reports.filter(r => r.confidence > 0);
 const bullishAnalysts = votingAnalysts.filter(r => r.recommendation === "STRONG_BUY" || r.recommendation === "BUY");
 const bearishAnalysts = votingAnalysts.filter(r => r.recommendation === "REDUCE" || r.recommendation === "SELL");

 if (bullishAnalysts.length === 0 && bearishAnalysts.length === 0) {
 return null;
 }

 const scenarios = investmentDecision?.scenarios;

 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <h2 className="mb-1 text-lg font-semibold text-white">- Investor Decision Center</h2>
 <p className="mb-4 text-xs text-zinc-500">Real committee synthesis - not a recommendation, an organized view of the evidence.</p>

 {scenarios && (
 <div className="mb-4 flex gap-2">
 <div className="flex-1 rounded-md bg-emerald-950/30 p-2 text-center">
 <p className="text-sm font-bold text-emerald-400">{scenarios.bull.probability}%</p>
 <p className="text-[10px] text-zinc-500">Bull Case</p>
 </div>
 <div className="flex-1 rounded-md bg-zinc-800/40 p-2 text-center">
 <p className="text-sm font-bold text-zinc-300">{scenarios.base.probability}%</p>
 <p className="text-[10px] text-zinc-500">Base Case</p>
 </div>
 <div className="flex-1 rounded-md bg-red-950/30 p-2 text-center">
 <p className="text-sm font-bold text-red-400">{scenarios.bear.probability}%</p>
 <p className="text-[10px] text-zinc-500">Bear Case</p>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">Bullish Factors</p>
 {bullishAnalysts.length > 0 ? (
 <div className="space-y-1.5">
 {bullishAnalysts.map(a => (
 <p key={a.analyst} className="text-sm text-zinc-300">
 <span className="text-zinc-500">{a.analyst}: </span>{a.thesis}
 </p>
 ))}
 </div>
 ) : (
 <p className="text-sm text-zinc-600">No analysts currently bullish.</p>
 )}
 </div>
 <div>
 <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">Bearish Factors</p>
 {bearishAnalysts.length > 0 ? (
 <div className="space-y-1.5">
 {bearishAnalysts.map(a => (
 <p key={a.analyst} className="text-sm text-zinc-300">
 <span className="text-zinc-500">{a.analyst}: </span>{a.thesis}
 </p>
 ))}
 </div>
 ) : (
 <p className="text-sm text-zinc-600">No analysts currently bearish.</p>
 )}
 </div>
 </div>
 </div>
 );
}
