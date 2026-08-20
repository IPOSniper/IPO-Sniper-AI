import Link from "next/link";
import { FinnhubIPOProvider } from "@/engine/evidence/providers/FinnhubIPOProvider";

export default async function IPORadarPanel() {
    const provider = new FinnhubIPOProvider();
    const ipos = await provider.getUpcomingIPOs(8);

    if (ipos.length === 0) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="mb-2 text-sm font-semibold text-zinc-300">🚀 IPO Radar</h2>
                <p className="text-xs text-zinc-500">No upcoming IPOs reported in the next 3 months, or data unavailable.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">🚀 IPO Radar</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ipos.map(ipo => (
                    <Link
                        key={`${ipo.symbol}-${ipo.date}`}
                        href={`/research/${ipo.symbol}`}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 hover:border-zinc-700 hover:bg-zinc-900"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{ipo.symbol}</span>
                            <span className="text-[10px] uppercase tracking-wide text-zinc-500">{ipo.status || "Expected"}</span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">{ipo.date}</p>
                        {ipo.price && (
                            <p className="mt-0.5 text-xs text-zinc-500">
                                {ipo.price} · {ipo.numberOfShares ? `${(ipo.numberOfShares / 1_000_000).toFixed(1)}M shares` : "—"}
                            </p>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
