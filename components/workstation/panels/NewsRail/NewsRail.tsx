"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, FileText, TrendingUp, Radio } from "lucide-react";
import type { MarketNewsItem } from "@/app/api/market-news/route";

type Filter = "all" | "breaking" | "sec" | "markets";

const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "breaking", label: "Breaking" },
    { key: "sec", label: "SEC Filings" },
    { key: "markets", label: "Markets" },
];

const CATEGORY_ICON: Record<MarketNewsItem["category"], typeof FileText> = {
    breaking: Radio,
    sec: FileText,
    markets: TrendingUp,
};

// Auto-refresh interval — matches the API route's 2-minute cache, so
// polling faster than this would just re-serve the same cached data.
const REFRESH_MS = 120_000;

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60_000);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
}

export default function NewsRail() {
    const [items, setItems] = useState<MarketNewsItem[]>([]);
    const [sources, setSources] = useState<Record<string, boolean> | null>(null);
    const [filter, setFilter] = useState<Filter>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/market-news", { cache: "no-store" });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setItems(data.items ?? []);
            setSources(data.sources ?? null);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, REFRESH_MS);
        return () => clearInterval(interval);
    }, [load]);

    const visible = filter === "all" ? items : items.filter(i => i.category === filter);
    const noProvidersConfigured = sources && !sources.sec && !sources.breaking && !sources.markets;
    const currentFilterUnavailable = filter !== "all" && sources && sources[filter] === false;

    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 h-full flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                    </span>
                    <h2 className="text-lg font-semibold">Market Feed</h2>
                </div>
                <button
                    onClick={load}
                    className="text-zinc-500 hover:text-zinc-300 transition"
                    aria-label="Refresh feed"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="flex gap-1.5 px-4 pb-3 flex-wrap">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                            filter === f.key
                                ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 max-h-[420px]">
                {loading && items.length === 0 && (
                    <div className="text-sm text-zinc-500 py-6 text-center">Loading feed…</div>
                )}

                {!loading && error && items.length === 0 && (
                    <div className="text-sm text-zinc-500 py-6 text-center">
                        Feed temporarily unavailable.
                    </div>
                )}

                {!loading && !error && noProvidersConfigured && (
                    <div className="text-sm text-zinc-500 py-6 text-center">
                        No news providers configured — set NEWS_API_KEY, FINNHUB_API_KEY,
                        or SEC_EDGAR_USER_AGENT.
                    </div>
                )}

                {!loading && !noProvidersConfigured && currentFilterUnavailable && (
                    <div className="text-sm text-zinc-500 py-6 text-center">
                        {filter === "breaking" && "Breaking news unavailable — check NEWS_API_KEY."}
                        {filter === "markets" && "Market news unavailable — check FINNHUB_API_KEY."}
                        {filter === "sec" && "SEC feed unavailable — check SEC_EDGAR_USER_AGENT."}
                    </div>
                )}

                {!loading && !noProvidersConfigured && !currentFilterUnavailable && visible.length === 0 && (
                    <div className="text-sm text-zinc-500 py-6 text-center">Nothing here yet.</div>
                )}

                {visible.map(item => {
                    const Icon = CATEGORY_ICON[item.category];
                    return (
                        <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-zinc-800/60 transition group"
                        >
                            <Icon size={14} className="mt-0.5 shrink-0 text-zinc-500 group-hover:text-cyan-400" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-zinc-200 leading-snug line-clamp-2">
                                    {item.headline}
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {item.source} · {timeAgo(item.publishedAt)}
                                </p>
                            </div>
                        </a>
                    );
                })}
            </div>
        </section>
    );
}
