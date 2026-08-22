"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { FeedEvent, FeedCategory } from "@/app/api/live-feed/route";

const CATEGORY_ICON: Record<FeedCategory, string> = {
    news: "\u{1F4F0}",
    sec: "\u{1F4C4}",
    mover_up: "\u{1F4C8}",
    mover_down: "\u{1F4C9}",
    ipo_watch: "\u{1F52D}",
    ipo_radar: "\u{1F680}",
    earnings: "\u{1F4C5}",
};

const IMPORTANCE_COLOR: Record<string, string> = {
    high: "text-slate-300 border-slate-600 bg-slate-700/40",
    med: "text-zinc-500 border-zinc-800 bg-zinc-900",
};

// Groups the 7 real FeedCategory values into filter tabs. No "Quant" tab --
// there is no quant category in the feed contract yet, and a filter button
// that silently matches nothing would be dishonest UI.
type FilterKey = "all" | "ipo" | "sec" | "news" | "market" | "earnings";
const FILTERS: { key: FilterKey; label: string; categories: FeedCategory[] | null }[] = [
    { key: "all", label: "All", categories: null },
    { key: "ipo", label: "IPO", categories: ["ipo_watch", "ipo_radar"] },
    { key: "sec", label: "SEC", categories: ["sec"] },
    { key: "news", label: "News", categories: ["news"] },
    { key: "market", label: "Market", categories: ["mover_up", "mover_down"] },
    { key: "earnings", label: "Earnings", categories: ["earnings"] },
];

const REFRESH_MS = 120_000;

function timeLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.round(diffMin / 60)}h ago`;
}

export default function LiveIntelligenceFeed() {
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchedAt, setFetchedAt] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterKey>("all");

    const load = useCallback(() => {
        fetch("/api/live-feed", { cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                setEvents(data.events ?? []);
                setFetchedAt(data.fetchedAt ?? null);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, REFRESH_MS);
        return () => clearInterval(interval);
    }, [load]);

    const activeCategories = FILTERS.find(f => f.key === filter)?.categories ?? null;
    const filteredEvents = useMemo(
        () => (activeCategories === null ? events : events.filter(e => activeCategories.includes(e.category))),
        [events, activeCategories]
    );

    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Live Intelligence</h2>
                {fetchedAt && <span className="text-[10px] text-zinc-600">Updated {timeAgo(fetchedAt)}</span>}
            </div>

            <div className="mb-2 flex flex-wrap gap-1">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase transition ${
                            filter === f.key ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <p className="mb-2 text-[10px] text-zinc-600">% Change: price change from previous/reference close. Attention: feed priority, not an investment recommendation.</p>

            {loading && <p className="text-xs text-zinc-500">Loading...</p>}
            {!loading && filteredEvents.length === 0 && (
                <p className="text-xs text-zinc-600">No new high-impact events right now.</p>
            )}
            {!loading && filteredEvents.length > 0 && (
                <div className="thin-scrollbar h-[340px] space-y-0.5 overflow-y-auto pr-1">
                    {filteredEvents.map(event => {
                        const RowInner = (
                            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-900">
                                <span className="w-12 shrink-0 text-[10px] text-zinc-600">{timeLabel(event.timestamp)}</span>
                                <span className="shrink-0">{CATEGORY_ICON[event.category]}</span>
                                {event.ticker && <span className="shrink-0 text-xs font-semibold text-zinc-300">{event.ticker}</span>}
                                <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">{event.headline}</span>
                                <span
                                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase ${IMPORTANCE_COLOR[event.importance]}`}
                                    title="Attention reflects feed priority based on event characteristics. It is not an investment recommendation."
                                >
                                    {event.importance === "high" ? "High Attention" : "Med Attention"}
                                </span>
                            </div>
                        );
                        const href = event.researchUrl ?? event.sourceUrl;
                        if (!href) {
                            return <div key={event.id}>{RowInner}</div>;
                        }
                        if (event.researchUrl) {
                            return (
                                <Link key={event.id} href={event.researchUrl}>
                                    {RowInner}
                                </Link>
                            );
                        }
                        return (
                            <Link key={event.id} href={event.sourceUrl!} target="_blank" rel="noopener noreferrer">
                                {RowInner}
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}