import Image from "next/image";
import { Bot } from "lucide-react";
import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { buildCommitteePhotoAssignments } from "./committeeAvatars";

const VOTE_COLOR: Record<string, string> = {
 STRONG_BUY: "text-emerald-400",
 BUY: "text-emerald-400",
 HOLD: "text-zinc-400",
 REDUCE: "text-red-400",
 SELL: "text-red-400",
};

/**
 * Reskinned from a flat list into a chat-thread presentation --
 * direct request: "add conversations to the analyst discussing macro
 * or events going on with that company." This is Group A from the
 * earlier "living workspace" proposal: the same real thesis text
 * that was already here, presented as a conversation instead of a
 * plain list. Nothing here is generated dialogue between analysts --
 * every message is that analyst's own real, already-computed thesis.
 * News Analyst's thesis now cites real recent headlines (see
 * NewsAnalyst.ts) and Market Analyst's reflects real volatility/
 * sector momentum -- between them, that's the real "macro and
 * events" content this format surfaces, not invented commentary.
 */
export default function CommitteePanel({ research }: WorkstationPanelProps) {
 const { committee } = research;

 const scoredReports = committee.reports.filter(r => r.confidence > 0);
 const excludedCount = committee.reports.length - scoredReports.length;
 const photoAssignments = buildCommitteePhotoAssignments(committee.reports.map(r => r.analyst));

 const bullish = scoredReports.filter(
 r => r.recommendation === "BUY" || r.recommendation === "STRONG_BUY"
 ).length;

 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <div className="mb-3 flex items-center justify-between">
 <h2 className="text-lg font-semibold">Committee Discussion</h2>
 <span className="text-xs text-zinc-500">
 {bullish}/{scoredReports.length} bullish
 </span>
 </div>

 <div className="space-y-4">
 {scoredReports.map(r => {
 const photoSrc = photoAssignments.get(r.analyst) ?? null;
 return (
 <div key={r.analyst} className="flex gap-3">
 <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-700">
 {photoSrc ? (
 <Image src={photoSrc} alt={`AI ${r.analyst}`} fill sizes="36px" className="object-cover" />
 ) : (
 <div className="flex h-full w-full items-center justify-center bg-zinc-800">
 <Bot size={16} className="text-zinc-400" />
 </div>
 )}
 </div>
 <div className="flex-1">
 <div className="mb-1 flex items-center gap-2 text-xs">
 <span className="font-medium text-white">AI {r.analyst}</span>
 <span className={`font-semibold ${VOTE_COLOR[r.recommendation] ?? "text-zinc-400"}`}>
 {r.recommendation.replace("_", " ")}
 </span>
 </div>
 <div className="rounded-lg rounded-tl-none bg-zinc-800/60 px-3 py-2 text-sm text-zinc-300">
 {r.thesis}
 </div>
 </div>
 </div>
 );
 })}
 </div>

 <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-950 p-3">
 <span className="text-sm font-medium text-white">Committee Vote</span>
 <span className="text-sm font-semibold text-white">
 {committee.recommendation.replace("_", " ")} - {committee.agreement}% agreement
 </span>
 </div>

 {excludedCount > 0 && (
 <p className="mt-2 text-xs text-zinc-600">
 {excludedCount} analyst(s) not shown - insufficient verified data to vote.
 </p>
 )}
 </div>
 );
}
