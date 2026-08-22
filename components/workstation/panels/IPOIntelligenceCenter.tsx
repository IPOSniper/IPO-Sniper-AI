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
    additional: { headline: string; source: string; url: string; publishedAt: string }[];
    error: string | null;
}

interface StrategicSignal {
    company: string;
    status: "reported" | "no_signal" | "unavailable" | "quota_exhausted";
    headline: string | null;
    source: string | null;
    url: string | null;
    publishedAt: string | null;
    evidenceCount: number;
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
    /** Real count of sources already fetched for this row (SEC=1, or 1+additional.length
     * for Watch rows) -- not a new data source, just surfacing what buildIpoWatchCompanies()
     * already retrieves but previously discarded. */
    evidenceCount: number;
    /** Real source labels already available -- domain/outlet names, not fabricated. */
    sources: string[];
    /** Short, honest explanation derived only from real fields already present on this row
     * (lifecycle + evidence count) -- never a claim about data we don't have. */
    whySurfaced: string;
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
    const [strategicSignals, setStrategicSignals] = useState<StrategicSignal[]>([]);

    useEffect(() => {
        Promise.all([
            fetch("/api/ipo-radar-data").then(r => r.json()).catch(() => ({ items: [] })),
            fetch("/api/ipo-filed").then(r => r.json()).catch(() => ({ items: [], available: false })),
            fetch("/api/ipo-watch").then(r => r.json()).catch(() => ({ companies: [] })),
            fetch("/api/ipo-strategic-signals").then(r => r.json()).catch(() => ({ companies: [] })),
        ]).then(([radarData, filedData, watchData, strategicData]) => {
            setScheduled(radarData.items ?? []);
            setFiled(filedData.items ?? []);
            setFiledAvailable(filedData.available !== false);
            setWatch(watchData.companies ?? []);
            setStrategicSignals(strategicData.companies ?? []);
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
        evidenceCount: item.secFilingUrl ? 1 : 0,
        sources: item.secFilingUrl ? ["SEC EDGAR"] : [],
        whySurfaced: "SEC-confirmed IPO scheduling activity.",
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
        evidenceCount: 1,
        sources: ["SEC EDGAR"],
        whySurfaced: `SEC filing (${item.formType}) confirms real registration activity.`,
    }));

    const watchRows: IpoRow[] = watch.map(c => {
        if (c.latest) {
            const lifecycle: IpoRow["lifecycle"] = c.status === "developing" ? "Developing" : "Reported";
            const allSources = [c.latest.source, ...c.additional.map(a => a.source)];
            const evidenceCount = 1 + c.additional.length;
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
                evidenceCount,
                sources: allSources,
                whySurfaced: evidenceCount > 1
                    ? `${evidenceCount} related news sources detected in the last 30 days.`
                    : "Single news source detected -- not yet independently corroborated.",
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
                evidenceCount: 0,
                sources: [],
                whySurfaced: "Provider could not be reached -- not necessarily zero real signal.",
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
            evidenceCount: 0,
            sources: [],
            whySurfaced: "Checked -- no qualifying developments found in the last 30 days.",
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
                                <>
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
                                                    {row.evidenceCount > 0 ? `${row.evidenceLabel} (${row.evidenceCount})` : row.evidenceLabel}
                                                </Link>
                                            ) : (
                                                <span className="text-zinc-600">
                                                    {row.evidenceCount > 0 ? `${row.evidenceLabel} (${row.evidenceCount})` : row.evidenceLabel}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                    {row.whySurfaced && (
                                        <tr key={`${row.key}-why`} className="border-b border-zinc-900">
                                            <td colSpan={5} className="px-3 pb-1.5 pt-0">
                                                <p className="text-[10px] text-zinc-600">
                                                    {row.whySurfaced}
                                                    {row.sources.length > 1 && (
                                                        <span className="ml-2 text-zinc-700">Sources: {row.sources.join(", ")}</span>
                                                    )}
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </>
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

            {!loading && strategicSignals.length > 0 && (
                <div className="mt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Strategic Signals (GDELT)</p>
                    <div className="space-y-2">
                        {strategicSignals.map(s => (
                            <div key={s.company} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
                                {s.status === "reported" ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-amber-600/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-300">Reported</span>
                                            <span className="text-xs font-semibold text-zinc-300">{s.company}</span>
                                            <span className="text-[10px] text-zinc-600">{s.evidenceCount} related report{s.evidenceCount === 1 ? "" : "s"}</span>
                                        </div>
                                        <a href={s.url ?? "#"} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-zinc-400 hover:text-zinc-200">
                                            {s.headline}
                                        </a>
                                        <p className="mt-0.5 text-[10px] text-zinc-600">
                                            Source: {s.source} - Provider: GDELT
                                        </p>
                                    </>
                                ) : s.status === "no_signal" ? (
                                    <p className="text-[11px] text-zinc-600">{s.company}: No matching strategic signal detected.</p>
                                ) : (
                                    <p className="text-[11px] text-amber-500">
                                        {s.company}: {s.status === "quota_exhausted" ? "Provider quota exhausted" : "Provider unavailable"} - not necessarily zero real signal.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}