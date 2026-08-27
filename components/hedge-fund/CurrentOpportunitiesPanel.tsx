"use client";

import { useEffect, useState } from "react";
import { getCurrentOpportunities, type PersistedOpportunity } from "@/app/(app)/hedge-fund/opportunities/actions";

/**
 * Reads the persisted opportunities table -- does NOT call
 * OpportunityEngine directly. Displays the real, persisted status
 * as-is; never advances it. Environment/Instrument are genuinely
 * absent from RankedOpportunity's real shape -- shown as
 * "Unavailable," never invented.
 */

const STATUS_FILTERS = [
    "ALL", "discovered", "analyzing", "plan", "risk_review",
    "approved", "ordering", "open", "fading", "rejected", "completed",
];

function freshnessLabel(lastSeenAt: string): { label: string; color: string } {
    const minutesAgo = (Date.now() - new Date(lastSeenAt).getTime()) / 60000;
    if (minutesAgo < 10) return { label: "LIVE", color: "text-emerald-400" };
    if (minutesAgo < 30) return { label: "RECENT", color: "text-amber-400" };
    return { label: "STALE", color: "text-zinc-500" };
}

function timeAgo(iso: string): string {
    const minutesAgo = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutesAgo < 1) return "just now";
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    return `${Math.round(minutesAgo / 60)}h ago`;
}

export default function CurrentOpportunitiesPanel() {
    const [opportunities, setOpportunities] = useState<PersistedOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        getCurrentOpportunities()
            .then(setOpportunities)
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === "ALL"
        ? opportunities
        : opportunities.filter(o => o.status === filter);

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Current Opportunities</h3>
                <span className="text-[10px] text-emerald-400">LIVE</span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1">
                {STATUS_FILTERS.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase transition ${
                            filter === s ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {s === "ALL" ? "All" : s.replace("_", " ")}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-sm text-zinc-600">Loading...</p>
            ) : filtered.length === 0 ? (
                <p className="text-sm text-zinc-600">
                    {opportunities.length === 0
                        ? "No persisted opportunities yet -- the discovery cron populates this table."
                        : "No opportunities match this filter."}
                </p>
            ) : (
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="text-[10px] uppercase text-zinc-600">
                            <th className="pb-1 font-medium">Ticker</th>
                            <th className="pb-1 font-medium">Score</th>
                            <th className="pb-1 font-medium">Catalyst / Evidence</th>
                            <th className="pb-1 font-medium">Environment</th>
                            <th className="pb-1 font-medium">Instrument</th>
                            <th className="pb-1 font-medium">Status</th>
                            <th className="pb-1 font-medium">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(o => {
                            const topEvent = o.events[0];
                            const fresh = freshnessLabel(o.lastSeenAt);
                            return (
                                <tr key={o.id} className="border-t border-zinc-800">
                                    <td className="py-1.5 font-semibold text-white">{o.ticker}</td>
                                    <td className="py-1.5 text-zinc-300">{o.score}</td>
                                    <td className="py-1.5 text-zinc-400">
                                        {topEvent
                                            ? (<a
                                                    href={topEvent.sourceUrl ?? "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-zinc-200 hover:underline"
                                                >
                                                    {topEvent.category}: {topEvent.description}
                                                </a>
                                            )
                                            : <span className="text-zinc-700">No evidence</span>}
                                    </td>
                                    <td className="py-1.5 text-zinc-700">Unavailable</td>
                                    <td className="py-1.5 text-zinc-700">Unavailable</td>
                                    <td className="py-1.5 text-zinc-400 uppercase">{o.status}</td>
                                    <td className="py-1.5">
                                        <span className={fresh.color}>{fresh.label}</span>
                                        <span className="ml-1 text-zinc-600">{timeAgo(o.lastSeenAt)}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}