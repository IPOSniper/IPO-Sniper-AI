"use client";

import { useEffect, useState } from "react";
import type { IPOWatchCompany } from "@/app/api/ipo-watch/route";

const STATUS_LABEL: Record<IPOWatchCompany["status"], string> = {
    developing: "Developing",
    reported: "Reported",
    speculative: "Speculative",
    no_signal: "No recent signal",
};

const STATUS_COLOR: Record<IPOWatchCompany["status"], string> = {
    developing: "text-amber-400",
    reported: "text-violet-400",
    speculative: "text-zinc-500",
    no_signal: "text-zinc-600",
};

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffHr = Math.floor(diffMs / 3_600_000);
    if (diffHr < 1) return "just now";
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
}

export default function IPOWatchPanel() {
    const [companies, setCompanies] = useState<IPOWatchCompany[]>([]);
    const [available, setAvailable] = useState(true);
    const [reason, setReason] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/ipo-watch")
            .then(res => res.json())
            .then(data => {
                setCompanies(data.companies ?? []);
                setAvailable(data.available !== false);
                setReason(data.reason ?? null);
            })
            .catch(() => setAvailable(false))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">IPO Watch</h2>

            {loading && <p className="text-xs text-zinc-500">Loading...</p>}

            {!loading && !available && (
                <p className="text-xs text-zinc-500">{reason ?? "IPO Watch unavailable."}</p>
            )}

            {!loading && available && (
                <div className="space-y-3">
                    {companies.map(c => (
                        <div key={c.company}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">{c.company}</span>
                                <span className={`text-[10px] uppercase tracking-wide ${STATUS_COLOR[c.status]}`}>
                                    {STATUS_LABEL[c.status]}
                                </span>
                            </div>
                            {c.latest ? (
                                
                                    href={c.latest.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 block text-[11px] text-zinc-400 hover:text-zinc-200"
                                >
                                    <span className="line-clamp-2">{c.latest.headline}</span>
                                    <span className="text-zinc-600">{c.latest.source} - {timeAgo(c.latest.publishedAt)}</span>
                                </a>
                            ) : (
                                <p className="mt-1 text-[11px] text-zinc-600">No recent IPO signal found.</p>
                            )}
                            {c.additional.length > 0 && (
                                <p className="mt-0.5 text-[10px] text-zinc-600">{c.additional.length} additional {c.additional.length === 1 ? "report" : "reports"}</p>
                            )}
                            <p className="mt-0.5 text-[10px] text-zinc-700">IPO date: Not confirmed</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
