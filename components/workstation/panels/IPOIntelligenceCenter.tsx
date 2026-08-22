"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ScheduledItem {
    symbol: string;
    date: string;
    status: string;
    price: string;
    numberOfShares: number;
    secFilingUrl: string | null;
}

interface FiledItem {
    company: string;
    formType: string;
    filedAt: string;
    secUrl: string;
}

interface WatchItem {
    company: string;
    status: string;
    latest: { headline: string; source: string; url: string; publishedAt: string } | null;
    additional: unknown[];
    error: string | null;
}

type Tab = "scheduled" | "filed" | "watch";

function formatShares(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M shares`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K shares`;
    return `${n} shares`;
}

function timeLabel(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function IPOIntelligenceCenter() {
    const [tab, setTab] = useState<Tab>("scheduled");
    const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
    const [filed, setFiled] = useState<FiledItem[]>([]);
    const [filedAvailable, setFiledAvailable] = useState(true);
    const [watch, setWatch] = useState<WatchItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/ipo-radar-data").then(r => r.json()).catch(() => ({ items: [] })),
            fetch("/api/ipo-filed").then(r => r.json()).catch(() => ({ items: [], available: false })),
            fetch("/api/ipo-watch").then(r => r.json()).catch(() => ({ companies: [] })),
        ]).then(([radarData, filedData, watchData]) => {
            setScheduled(radarData.items ?? []);
            setFiled(filedData.items ?? []);
            setFiledAvailable(filedData.available !== false);
            setWatch(watchData.companies ?? []);
            setLoading(false);
        });
    }, []);

    const scheduledCount = scheduled.length;
    const filedCount = filed.length;
    const watchSignalCount = watch.filter(w => w.latest !== null).length;
    const watchUnavailableCount = watch.filter(
        w => w.status === "unavailable" || w.error || w.status === "quota_exhausted"
    ).length;

    return (
        <section className="rounded-xl border border-violet-800/40 bg-gradient-to-b from-violet-950/20 to-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-violet-300">IPO Intelligence</h2>
                <div className="flex gap-1">
                    <button
                        onClick={() => setTab("scheduled")}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${tab === "scheduled" ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        Scheduled {scheduledCount}
                    </button>
                    <button
                        onClick={() => setTab("filed")}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${tab === "filed" ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        Filed {filedAvailable ? filedCount : "?"}
                    </button>
                    <button
                        onClick={() => setTab("watch")}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${tab === "watch" ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        Watch {watchSignalCount}{watchUnavailableCount > 0 ? ` · ${watchUnavailableCount} unavailable` : ""}
                    </button>
                </div>
            </div>

            {loading && <p className="text-xs text-zinc-500">Loading...</p>}

            {!loading && tab === "scheduled" && (
                scheduled.length === 0 ? (
                    <p className="text-xs text-zinc-600">No scheduled IPOs reported in the next 3 months.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {scheduled.map(item => (
                            <div key={item.symbol} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white">{item.symbol}</span>
                                    <span className="text-[9px] uppercase text-zinc-500">{item.status || "Expected"}</span>
                                </div>
                                <p className="mt-1 text-xs text-zinc-400">{item.date}</p>
                                <p className="mt-1 text-[11px] text-zinc-500">
                                    {item.price || "Price N/A"} - {item.numberOfShares ? formatShares(item.numberOfShares) : "Shares N/A"}
                                </p>
                                <div className="mt-2 flex gap-3 text-[11px]">
                                    <Link href={`/research/${item.symbol}`} className="text-violet-400 hover:text-violet-300">Research</Link>
                                    {item.secFilingUrl && (
                                        <Link href={item.secFilingUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-300">SEC Filing</Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {!loading && tab === "filed" && (
                !filedAvailable ? (
                    <p className="text-xs text-amber-500">Filed data source temporarily unavailable - not necessarily zero real filings.</p>
                ) : filed.length === 0 ? (
                    <p className="text-xs text-zinc-600">No recent S-1 filings detected.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {filed.map((item, i) => (
                            <div key={`${item.company}-${i}`} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white line-clamp-1">{item.company}</span>
                                    <span className="text-[9px] uppercase text-zinc-500">{item.formType}</span>
                                </div>
                                <p className="mt-1 text-xs text-zinc-400">Filed {timeLabel(item.filedAt)}</p>
                                <div className="mt-2 flex gap-3 text-[11px]">
                                    <Link href={item.secUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-300">SEC Filing</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {!loading && tab === "watch" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {watch.map(c => (
                        <div key={c.company} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-white">{c.company}</span>
                                <span className="text-[9px] uppercase text-zinc-500">{c.status.replace("_", " ")}</span>
                            </div>
                            {c.latest ? (
                                <Link href={c.latest.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[11px] text-zinc-400 hover:text-zinc-200">
                                    <span className="line-clamp-2">{c.latest.headline}</span>
                                </Link>
                            ) : c.status === "unavailable" ? (
                                <p className="mt-1 text-[11px] text-amber-500">
                                    Watch unavailable - news provider temporarily unreachable{c.error && /quota|too many requests|rate limit/i.test(c.error) ? " (quota exhausted)" : ""}. Not necessarily zero real signal.
                                </p>
                            ) : (
                                <p className="mt-1 text-[11px] text-zinc-600">No recent verified IPO-watch signal.</p>
                            )}
                            <p className="mt-1 text-[10px] text-zinc-700">IPO date: Not confirmed</p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
