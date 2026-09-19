"use client";

import { useEffect, useState } from "react";
import { DataBar } from "../design/DesignPrimitives";

interface ResultsData {
    available: boolean;
    actualEPS?: number;
    estimatedEPS?: number;
    epsSurprisePercent?: number;
    actualRevenue?: number;
    estimatedRevenue?: number;
}

export default function EarningsComparisonChart({ ticker, companyName }: { ticker: string; companyName: string }) {
    const [data, setData] = useState<{ results: ResultsData } | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/earnings/recap/${ticker}?name=${encodeURIComponent(companyName)}`)
            .then((res) => res.json())
            .then((json) => { if (!cancelled) setData(json); })
            .catch(() => { if (!cancelled) setData(null); });
        return () => { cancelled = true; };
    }, [ticker, companyName]);

    if (!data || !data.results.available) return null;

    const r = data.results;
    const epsMax = Math.max(Math.abs(r.actualEPS ?? 0), Math.abs(r.estimatedEPS ?? 0), 0.01);
    const revMax = Math.max(r.actualRevenue ?? 0, r.estimatedRevenue ?? 0, 1);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                EPS &amp; Revenue vs. Estimate
            </h3>
            {r.actualEPS !== undefined && r.estimatedEPS !== undefined && (
                <div className="mb-3">
                    <DataBar
                        value={(Math.abs(r.estimatedEPS) / epsMax) * 100}
                        label="EPS Estimate"
                        right={`$${r.estimatedEPS.toFixed(2)}`}
                        tone="neutral"
                    />
                    <div className="mt-1">
                        <DataBar
                            value={(Math.abs(r.actualEPS) / epsMax) * 100}
                            label="EPS Actual"
                            right={`$${r.actualEPS.toFixed(2)}`}
                            tone={r.epsSurprisePercent !== undefined && r.epsSurprisePercent >= 0 ? "positive" : "negative"}
                        />
                    </div>
                </div>
            )}
            {r.actualRevenue !== undefined && r.estimatedRevenue !== undefined && (
                <div>
                    <DataBar
                        value={(r.estimatedRevenue / revMax) * 100}
                        label="Revenue Estimate"
                        right={`$${(r.estimatedRevenue / 1_000_000).toFixed(0)}M`}
                        tone="neutral"
                    />
                    <div className="mt-1">
                        <DataBar
                            value={(r.actualRevenue / revMax) * 100}
                            label="Revenue Actual"
                            right={`$${(r.actualRevenue / 1_000_000).toFixed(0)}M`}
                            tone="positive"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
