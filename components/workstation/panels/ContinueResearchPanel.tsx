import Link from "next/link";
import { getContinueWhereYouLeftOff } from "@/app/(app)/workstation/continue-research/actions";

function timeAgo(dateStr: string): string {
 const diffMs = Date.now() - new Date(dateStr).getTime();
 const diffMin = Math.round(diffMs / 60000);
 if (diffMin < 60) return `${diffMin}m`;
 const diffHr = Math.round(diffMin / 60);
 if (diffHr < 24) return `${diffHr}h`;
 const diffDay = Math.round(diffHr / 24);
 return `${diffDay}d`;
}

export default async function ContinueResearchPanel() {
 const items = await getContinueWhereYouLeftOff(5);

 if (items.length === 0) return null;

 return (
 <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
 <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-600">Continue:</span>
 {items.map(item => (
 <Link
 key={item.ticker}
 href={`/research/${item.ticker}`}
 className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs hover:border-zinc-700"
 >
 <span className="font-semibold text-white">{item.ticker}</span>
 <span className="text-zinc-500">{item.recommendation} {item.conviction}</span>
 <span className="text-zinc-700">- {timeAgo(item.createdAt)}</span>
 </Link>
 ))}
 </div>
 );
}
