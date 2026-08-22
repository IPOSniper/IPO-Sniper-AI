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

interface IpoRow {
    key: string;
    company: string;
    lifecycle: "Scheduled" | "Filed" | "Developing" | "Reported" | "Unavailable" | "No Signal";
    date: string;
    signal: string;
    evidenceLabel: string;
    evidenceUrl: string | null;
    researchUrl: string | null;
    sortTime: number;
}

function timeLabel(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
        return iso;
    }
}

function lifecycleBadgeClass(lifecycle: IpoRow["lifecycle"]): string {
    switch (lifecycle) {
        case "Scheduled": return "bg-violet-600/20 text-violet-300";
        case "Filed": return "bg-blue-600/20 text-blue-300";
        case "Developing": return "bg-amber-600/20 text-amber-300";
        case "Reported": return "bg-zinc-600/20 text-zinc-300";
        case "Unavailable": return "bg-red-900/20 text-red-400";
        case "No Signal": return "bg-zinc-800/40 text-zinc-500";
    }
}

export default function IPOIntelligenceCenter() {
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

    const scheduledRows: IpoRow[] = scheduled.map(item => ({
        key: `scheduled-${item.symbol}`,
        company: item.symbol,
        lifecycle: "Scheduled",
        date: item.date,
        signal: item.status || "Expected",
        evidenceLabel: "SEC",
        evidenceUrl: item.secFilingUrl,
        researchUrl: `/research/${item.symbol}`,
        sortTime: new Date(item.date).getTime() || 0,
    }));

    const filedRows: IpoRow[] = filed.map((item, i) => ({
        key: `filed-${item.company}-${i}`,
        company: item.company,
        lifecycle: "Filed",
        date: timeLabel(item.filedAt),
        signal: item.formType,
        evidenceLabel: "SEC",
        evidenceUrl: item.secUrl,
        researchUrl: null,
        sortTime: new Date(item.filedAt).getTime() || 0,
    }));

    const watchRows: IpoRow[] = watch.map(c => {
        if (c.latest) {
            const lifecycle: IpoRow["lifecycle"] = c.status === "developing" ? "Developing" : "Reported";
            return {
                key: `watch-${c.company}`,
                company: c.company,
                lifecycle,
                date: timeLabel(c.latest.publishedAt),
                signal: c.latest.headline,
                evidenceLabel: c.latest.source,
                evidenceUrl: c.latest.url,
                researchUrl: null,
                sortTime: new Date(c.latest.publishedAt).getTime() || 0,
            };
        }
        if (c.status === "unavailable") {
            return {
                key: `watch-unavailable-${c.company}`,
                company: c.company,
                lifecycle: "Unavailable",
                date: "-",
                signal: c.error && /quota|too many requests|rate limit/i.test(c.error)
                    ? "News provider quota exhausted"
                    : "News provider unavailable",
                evidenceLabel: "-",
                evidenceUrl: null,
                researchUrl: null,
                sortTime: 0,
            };
        }
        return {
            key: `watch-nosignal-${c.company}`,
            company: c.company,
            lifecycle: "No Signal",
            date: "-",
            signal: "No recent verified signal",
            evidenceLabel: "-",
            evidenceUrl: null,
            researchUrl: null,
            sortTime: 0,
        };
    });

    const allRows = [...scheduledRows, ...filedRows, ...watchRows].sort((a, b) => b.sortTime - a.sortTime);

    const scheduledCount = scheduled.length;
    const filedCount = filed.length;
    const watchSignalCount = watch.filter(w => w.latest !== null).length;
    const watchUnavailableCount = watch.filter(w => w.status === "unavailable" || w.error).length;

    return (
        <section className="rounded-xl border border-violet-800/40 bg-gradient-to-b from-violet-950/20 to-zinc-950 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-violet-300">IPO Intelligence</h2>
                <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400">
                    <span>Scheduled <span className="font-semibold text-white">{scheduledCount}</span></span>
                    <span>Filed <span className="font-semibold text-white">{filedAvailable ? filedCount : "?"}</span></span>
                    <span>
                        Watch <span className="font-semibold text-white">{watchSignalCount}</span>
                        {watchUnavailableCount > 0 && <span className="text-amber-500"> - {watchUnavailableCount} unavailable</span>}
                    </span>
                </div>
            </div>

            {loading && <p className="text-xs text-zinc-500">Loading...</p>}

            {!loading && allRows.length === 0 && (
                <p className="text-xs text-zinc-600">No IPO intelligence available right now.</p>
            )}

            {!loading && allRows.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500">
                                <th className="py-1.5 pr-3 font-medium">Company</th>
                                <th className="py-1.5 pr-3 font-medium">Lifecycle</th>
                                <th className="py-1.5 pr-3 font-medium">Date</th>
                                <th className="py-1.5 pr-3 font-medium">Signal</th>
                                <th className="py-1.5 pr-3 font-medium">Evidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allRows.map(row => (
                                <tr key={row.key} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                                    <td className="py-1.5 pr-3 font-semibold text-white">
                                        {row.researchUrl ? (
                                            <Link href={row.researchUrl} className="hover:text-violet-300">{row.company}</Link>
                                        ) : row.company}
                                    </td>
                                    <td className="py-1.5 pr-3">
                                        <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${lifecycleBadgeClass(row.lifecycle)}`}>
                                            {row.lifecycle}
                                        </span>
                                    </td>
                                    <td className="py-1.5 pr-3 text-zinc-400">{row.date}</td>
                                    <td className="py-1.5 pr-3 text-zinc-300 line-clamp-1 max-w-md">{row.signal}</td>
                                    <td className="py-1.5 pr-3">
                                        {row.evidenceUrl ? (
                                            <Link href={row.evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-200">
                                                {row.evidenceLabel}
                                            </Link>
                                        ) : (
                                            <span className="text-zinc-600">{row.evidenceLabel}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !filedAvailable && (
                <p className="mt-2 text-[11px] text-amber-500">Filed data source temporarily unavailable - not necessarily zero real filings.</p>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                {["Emerging", "Watch", "Filed", "Scheduled", "Priced", "IPO", "Post-IPO", "Lock-Up"].map((stage, i, arr) => (
                    <span key={stage} className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                            {stage}
                        </span>
                        {i < arr.length - 1 && <span className="text-sm text-zinc-600">&rarr;</span>}
                    </span>
                ))}
            </div>
        </section>
    );
}