import Link from "next/link";
import { getContinueWhereYouLeftOff } from "@/app/(app)/workstation/continue-research/actions";

function timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    return `${diffDay}d ago`;
}

export default async function ContinueResearchPanel() {
    const items = await getContinueWhereYouLeftOff(5);

    if (items.length === 0) return null;

    return (
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Continue Where You Left Off</h2>
            <div className="space-y-1.5">
                {items.map(item => (
                    <Link
                        key={item.ticker}
                        href={`/research/${item.ticker}`}
                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-zinc-900"
                    >
                        <div>
                            <span className="font-semibold text-white">{item.ticker}</span>
                            <span className="ml-2 text-xs text-zinc-500">{item.companyName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-zinc-500">{item.recommendation} · {item.conviction}/100</span>
                            <span className="text-zinc-600">{timeAgo(item.createdAt)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
