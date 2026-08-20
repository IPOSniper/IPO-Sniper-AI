"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";

interface CalendarItem {
    symbol: string;
    reportDate: string;
    session: "bmo" | "amc" | "dmh" | "unknown";
    epsEstimate: number | null;
    revenueEstimate: number | null;
}

const SESSION_LABEL: Record<string, string> = {
    bmo: "Before Open",
    amc: "After Close",
    dmh: "During Hours",
    unknown: "",
};

const SESSION_COLOR: Record<string, string> = {
    bmo: "bg-violet-950 text-violet-400 border-violet-900",
    amc: "bg-violet-950 text-violet-400 border-violet-900",
    dmh: "bg-amber-950 text-amber-400 border-amber-900",
    unknown: "bg-zinc-900 text-zinc-500 border-zinc-800",
};

function diffDaysFromToday(iso: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(iso + "T00:00:00");
    return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

function dayLabel(diffDays: number, iso: string): string {
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    const date = new Date(iso + "T00:00:00");
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatRevenue(n: number): string {
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
    return `$${n.toFixed(0)}`;
}

export default function UpcomingEarnings() {
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [available, setAvailable] = useState(true);
    const [reason, setReason] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/earnings/calendar?days=7")
            .then(res => res.json())
            .then(data => {
                setItems(data.items ?? []);
                setAvailable(data.available !== false);
                setReason(data.reason ?? null);
            })
            .catch(() => setAvailable(false))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center gap-2 mb-3">
                <CalendarClock size={16} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Upcoming Earnings</h2>
                {!loading && available && items.length > 0 && (
                    <span className="ml-auto text-xs text-zinc-500">{items.length} this week</span>
                )}
            </div>

            {loading && <div className="text-sm text-zinc-500 py-4 text-center">Loading…</div>}

            {!loading && !available && (
                <div className="text-sm text-zinc-500 py-4 text-center">
                    {reason ?? "Earnings calendar unavailable."}
                </div>
            )}

            {!loading && available && items.length === 0 && (
                <div className="text-sm text-zinc-500 py-4 text-center">Nothing scheduled this week.</div>
            )}

            {!loading && available && items.length > 0 && (
                <div className="thin-scrollbar space-y-1.5 max-h-[280px] overflow-y-auto overflow-x-hidden pr-1">
                    {items.map(item => {
                        const diffDays = diffDaysFromToday(item.reportDate);
                        return (
                            <Link
                                key={`${item.symbol}-${item.reportDate}`}
                                href={`/research/${item.symbol}`}
                                className="flex items-center justify-between gap-2 rounded-lg border border-transparent bg-zinc-950/60 px-3 py-2.5 hover:border-zinc-700 hover:bg-zinc-800/60 transition group"
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className="text-sm font-semibold text-zinc-200 group-hover:text-violet-400">
                                        {item.symbol}
                                    </span>
                                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                                        {dayLabel(diffDays, item.reportDate)}
                                    </span>
                                    {diffDays > 1 && (
                                        <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 whitespace-nowrap">
                                            {diffDays} DAYS
                                        </span>
                                    )}
                                    {item.session !== "unknown" && (
                                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${SESSION_COLOR[item.session]}`}>
                                            {SESSION_LABEL[item.session]}
                                        </span>
                                    )}
                                </div>
                                <div className="flex shrink-0 flex-col items-end whitespace-nowrap text-right">
                                    <span className="text-xs text-zinc-500">
                                        {item.epsEstimate !== null ? `EPS est. $${item.epsEstimate.toFixed(2)}` : ""}
                                    </span>
                                    {item.revenueEstimate !== null && (
                                        <span className="text-[10px] text-zinc-600">
                                            Rev est. {formatRevenue(item.revenueEstimate)}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
