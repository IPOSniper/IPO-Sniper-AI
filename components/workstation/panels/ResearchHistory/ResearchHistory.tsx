import Link from "next/link";
import { getResearchHistory } from "@/app/(app)/research/[ticker]/actions";
import UnverifiedCard from "../../shared/UnverifiedCard";

const RECOMMENDATION_COLOR: Record<string, string> = {
 STRONG_BUY: "text-emerald-400",
 BUY: "text-emerald-400",
 HOLD: "text-zinc-300",
 REDUCE: "text-amber-400",
 SELL: "text-red-400",
};

/**
 * Async Server Component - fetches the current user's real saved
 * research directly (getResearchHistory() already returns [] rather
 * than throwing when unconfigured/signed-out, matching this app's
 * honest-empty pattern), no client-side data fetching needed.
 */
export default async function ResearchHistory() {
 const history = await getResearchHistory(8);

 if (history.length === 0) {
 return (
 <UnverifiedCard
 title="Research History"
 reason="No saved research yet - use Save Research after analyzing a company."
 />
 );
 }

 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <h2 className="mb-3 text-lg font-semibold">Research History</h2>

 <div className="space-y-2">
 {history.map(entry => (
 <Link
 key={entry.id}
 href={`/research/${entry.ticker}`}
 className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-950"
 >
 <span className="font-medium text-white">{entry.ticker}</span>
 <span className={RECOMMENDATION_COLOR[entry.recommendation] ?? "text-zinc-400"}>
 {entry.recommendation.replace("_", " ")}
 </span>
 <span className="text-xs text-zinc-600">
 {new Date(entry.createdAt).toLocaleDateString()}
 </span>
 </Link>
 ))}
 </div>
 </div>
 );
}
