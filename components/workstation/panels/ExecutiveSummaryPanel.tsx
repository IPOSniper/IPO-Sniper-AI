import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

const RECOMMENDATION_COLOR: Record<string, string> = {
 STRONG_BUY: "text-emerald-400",
 BUY: "text-emerald-400",
 HOLD: "text-zinc-300",
 REDUCE: "text-amber-400",
 SELL: "text-red-400",
};

export default function ExecutiveSummaryPanel({ research }: WorkstationPanelProps) {
 const { report } = research;
 const color = RECOMMENDATION_COLOR[report.recommendation] ?? "text-zinc-300";

 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <div className="flex items-center justify-between mb-3">
 <h2 className="text-lg font-semibold">Executive Summary</h2>
 <span className={`text-sm font-semibold ${color}`}>
 {report.recommendation.replace("_", " ")}
 </span>
 </div>

 <div className="mb-3 flex gap-6 text-sm">
 <div>
 <span className="text-zinc-500">Conviction </span>
 <span className="font-medium text-white">{report.conviction}/100</span>
 </div>
 <div>
 <span className="text-zinc-500">Confidence </span>
 <span className="font-medium text-white">{report.confidence}%</span>
 </div>
 </div>

 <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-400">
 {report.executiveSummary}
 </pre>

 {report.executiveSummaryIsAIGenerated ? (
 <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-600">
 - This summary is written by an AI model, constrained to only describe the
 recommendation, score, and analyst findings computed above - it does not decide
 them. See <a href="/#disclosures" className="underline hover:text-zinc-400">Disclosures</a>.
 </p>
 ) : (
 <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-600">
 Deterministic summary - computed directly from the scores and findings above, not
 AI-generated.
 </p>
 )}
 </div>
 );
}
