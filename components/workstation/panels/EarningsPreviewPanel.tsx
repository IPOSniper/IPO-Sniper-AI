"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Sparkles } from "lucide-react";

export interface CalendarData {
    available: boolean;
    reason?: string;
    reportDate?: string;
    session?: "bmo" | "amc" | "dmh" | "unknown";
    epsEstimate?: number | null;
    revenueEstimate?: number | null;
    fiscalQuarter?: number | null;
    fiscalYear?: number | null;
}

export interface PreviewData {
    available: boolean;
    reason?: string;
    topicsToWatch?: Array<{ topic: string; importance: 1 | 2 | 3 | 4 | 5 }>;
    bullCase?: string[];
    bearCase?: string[];
    probabilityAssessment?: Array<{ outcome: string; probabilityPercent: number }>;
    weighting?: Array<{ factor: string; weightPercent: number }>;
    narrative?: string;
}

export interface EarningsPreviewResponse {
    calendar: CalendarData;
    preview: PreviewData;
}

interface Props {
    ticker: string;
    companyName: string;
    sector: string;
    industry: string;
}

const SESSION_LABEL: Record<string, string> = {
    bmo: "Before market open",
    amc: "After market close",
    dmh: "During market hours",
    unknown: "Time not specified",
};

function formatMoney(n: number | null | undefined): string {
    if (n === null || n === undefined) return "Not covered";
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
    return `$${n.toFixed(2)}`;
}

/** Real day count from today to the report date -- no invented "coming soon" language. */
function daysUntil(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.ceil((target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / msPerDay);
    return diff;
}

function Stars({ importance }: { importance: number }) {
    return (
        <span className="text-amber-400 tracking-tight">
            {"★".repeat(importance)}
            <span className="text-zinc-700">{"★".repeat(5 - importance)}</span>
        </span>
    );
}

export default function EarningsPreviewPanel({ ticker, companyName, sector, industry }: Props) {
    const [data, setData] = useState<EarningsPreviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);

        const params = new URLSearchParams({ name: companyName, sector, industry });

        fetch(`/api/earnings/preview/${ticker}?${params.toString()}`)
            .then(res => {
                if (!res.ok) throw new Error(String(res.status));
                return res.json();
            })
            .then(json => {
                if (!cancelled) setData(json);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [ticker, companyName, sector, industry]);

    if (loading) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h2 className="text-lg font-semibold text-zinc-300">Earnings</h2>
                <p className="mt-2 text-sm text-zinc-600">Loading…</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 opacity-60">
                <h2 className="text-lg font-semibold text-zinc-400">Earnings</h2>
                <p className="mt-2 text-sm text-zinc-600">Couldn&apos;t load earnings data.</p>
            </div>
        );
    }

    const { calendar, preview } = data;
    const daysAway = daysUntil(calendar.reportDate);

    if (!calendar.available) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 opacity-60">
                <h2 className="text-lg font-semibold text-zinc-400">Earnings</h2>
                <p className="mt-2 text-sm text-zinc-600">
                    {calendar.reason ?? "Not available."}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-5">

            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-100">Earnings Preview</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                        <CalendarClock size={14} className="text-cyan-400" />
                        {calendar.fiscalQuarter && calendar.fiscalYear
                            ? `Q${calendar.fiscalQuarter} ${calendar.fiscalYear} · `
                            : ""}
                        {calendar.reportDate}
                        {" · "}
                        {SESSION_LABEL[calendar.session ?? "unknown"]}
                        {daysAway !== null && (
                            <span className="ml-1 text-violet-400">
                                {daysAway === 0 ? "· Today" : daysAway === 1 ? "· Tomorrow" : daysAway > 0 ? `· in ${daysAway} days` : `· ${Math.abs(daysAway)} days ago`}
                            </span>
                        )}
                    </p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-800 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    Verified — Finnhub
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Consensus EPS</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                        {calendar.epsEstimate === null || calendar.epsEstimate === undefined
                            ? "Not covered"
                            : `$${calendar.epsEstimate.toFixed(2)}`}
                    </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Consensus Revenue</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                        {formatMoney(calendar.revenueEstimate)}
                    </p>
                </div>
            </div>

            {!preview.available ? (
                <p className="text-sm text-zinc-600 border-t border-zinc-800 pt-4">
                    AI analysis unavailable — {preview.reason ?? "not configured."}
                </p>
            ) : (
                <div className="border-t border-zinc-800 pt-4 space-y-5">

                    <div className="flex items-center gap-1.5 text-xs font-medium text-violet-400">
                        <Sparkles size={12} />
                        AI ANALYSIS — interpretation, not verified fact
                    </div>

                    {preview.narrative && (
                        <p className="text-sm text-zinc-300 leading-relaxed">{preview.narrative}</p>
                    )}

                    {preview.topicsToWatch && preview.topicsToWatch.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
                                What Investors Will Care About
                            </p>
                            <div className="space-y-1.5">
                                {preview.topicsToWatch.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-300">{t.topic}</span>
                                        <Stars importance={t.importance} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {preview.bullCase && preview.bullCase.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-wide text-emerald-500 mb-2">Bull Case</p>
                                <ul className="space-y-1 text-sm text-zinc-300 list-disc list-inside">
                                    {preview.bullCase.map((b, i) => <li key={i}>{b}</li>)}
                                </ul>
                            </div>
                        )}
                        {preview.bearCase && preview.bearCase.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-wide text-red-500 mb-2">Bear Case</p>
                                <ul className="space-y-1 text-sm text-zinc-300 list-disc list-inside">
                                    {preview.bearCase.map((b, i) => <li key={i}>{b}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>

                    {preview.probabilityAssessment && preview.probabilityAssessment.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
                                Probability Assessment
                            </p>
                            <div className="space-y-1.5">
                                {preview.probabilityAssessment.map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <span className="text-zinc-300 w-40 shrink-0">{p.outcome}</span>
                                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                            <div
                                                className="h-full bg-cyan-500"
                                                style={{ width: `${Math.min(100, Math.max(0, p.probabilityPercent))}%` }}
                                            />
                                        </div>
                                        <span className="text-zinc-500 w-10 text-right">{p.probabilityPercent}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {preview.weighting && preview.weighting.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
                                IPO Sniper AI Weighting
                            </p>
                            <div className="space-y-1 text-sm">
                                {preview.weighting.map((w, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-zinc-300">{w.factor}</span>
                                        <span className="text-zinc-500">{w.weightPercent}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
