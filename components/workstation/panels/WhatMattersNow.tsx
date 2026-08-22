"use client";

import { useEffect, useState } from "react";
import type { FeedEvent, FeedCategory } from "@/app/api/live-feed/route";

// Layer 2: reuses the existing /api/live-feed stream -- no new API calls.
// "Quant" intentionally has no real-data path yet: FeedCategory has no
// quant value (confirmed when building Live Intelligence's filter bar),
// so that data doesn't exist in this feed. It stays honestly labeled
// "Not yet connected" until the Quant Live Desk phase wires the Hedge
// Fund harness into a shared source -- never fabricate a Quant signal
// from data that isn't there.

interface MatterRow {
    icon: string;
    label: string;
    company: string | null;
    headline: string;
    timeLabel: string;
    status: string;
    statusTone: "high" | "med" | "pending" | "none";
}

const IPO_CATEGORIES: FeedCategory[] = ["ipo_watch", "ipo_radar"];
const MARKET_CATEGORIES: FeedCategory[] = ["mover_up", "mover_down"];

function timeLabel(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch {
        return "--:--";
    }
}

/** Highest importance first, then most recent, matching the same priority
 * the API itself already sorts by -- this just narrows to one category set. */
function pickTop(events: FeedEvent[], categories: FeedCategory[]): FeedEvent | null {
    const matches = events.filter(e => categories.includes(e.category));
    if (matches.length === 0) return null;
    return [...matches].sort((a, b) => {
        if (a.importance !== b.importance) return a.importance === "high" ? -1 : 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })[0];
}

function toneClass(tone: MatterRow["statusTone"]): string {
    if (tone === "high") return "bg-red-600/20 text-red-300";
    if (tone === "med") return "bg-amber-600/20 text-amber-300";
    if (tone === "none") return "bg-zinc-800 text-zinc-600";
    return "bg-zinc-800 text-zinc-500";
}

function eventToRow(icon: string, label: string, event: FeedEvent | null): MatterRow {
    if (!event) {
        return {
            icon, label, company: null, headline: "No significant event detected",
            timeLabel: "--:--", status: "No Signal", statusTone: "none",
        };
    }
    return {
        icon, label, company: event.ticker, headline: event.headline,
        timeLabel: timeLabel(event.timestamp),
        status: event.importance === "high" ? "High" : "Med",
        statusTone: event.importance === "high" ? "high" : "med",
    };
}

export default function WhatMattersNow() {
    const [events, setEvents] = useState<FeedEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/live-feed", { cache: "no-store" })
            .then(res => res.json())
            .then(data => setEvents(data.events ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const rows: MatterRow[] = loading
        ? []
        : [
              eventToRow("\u{1F680}", "IPO", pickTop(events, IPO_CATEGORIES)),
              eventToRow("\u{1F4C4}", "SEC", pickTop(events, ["sec"])),
              eventToRow("\u26A1", "Market", pickTop(events, MARKET_CATEGORIES)),
              {
                  icon: "\u{1F916}", label: "Quant", company: null,
                  headline: "Not yet connected", timeLabel: "--:--",
                  status: "Pending", statusTone: "pending",
              },
          ];

    return (
        <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">What Matters Now</p>
                <span className="text-[10px] text-zinc-600">Live</span>
            </div>
            <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
                <div className="flex items-center gap-3 px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-600">
                    <span className="w-12 shrink-0">Time</span>
                    <span className="w-20 shrink-0">Category</span>
                    <span className="w-20 shrink-0">Company</span>
                    <span className="flex-1">Event</span>
                    <span className="w-20 shrink-0 text-right">Importance</span>
                </div>
                {loading ? (
                    <div className="px-3 py-2.5 text-sm text-zinc-600">Loading...</div>
                ) : (
                    rows.map(row => (
                        <div key={row.label} className="flex items-center gap-3 px-3 py-2.5">
                            <span className="w-12 shrink-0 text-[10px] text-zinc-600">{row.timeLabel}</span>
                            <span className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-zinc-500">{row.icon} {row.label}</span>
                            <span className="w-20 shrink-0 text-xs text-zinc-500">{row.company ?? "--"}</span>
                            <span className="flex-1 truncate text-sm text-zinc-300">{row.headline}</span>
                            <span className={`w-20 shrink-0 rounded px-2 py-0.5 text-right text-[10px] font-medium uppercase ${toneClass(row.statusTone)}`}>
                                {row.status}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}