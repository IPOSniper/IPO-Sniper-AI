"use client";

import { useEffect, useState } from "react";
import { getQuantFunnelSummary, type QuantFunnelSummary } from "@/app/(app)/hedge-fund/quant-funnel-summary";

/**
 * Hedge Fund Layer 2, Step 1: wires the already-proven
 * getQuantFunnelSummary() (built for Workstation's QuantAwarenessStrip,
 * confirmed working there) into Hedge Fund's own top-level Quant Now
 * strip. No new aggregation, no new query -- same real function, same
 * real quant_trade_decisions/paper_trade_orders tables. Discovery,
 * Risk Approved, and Completed remain null -> "Unavailable" here too,
 * since that gap hasn't been closed -- never fabricated.
 */
export default function QuantNowStrip() {
    const [summary, setSummary] = useState<QuantFunnelSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getQuantFunnelSummary()
            .then(setSummary)
            .finally(() => setLoading(false));
    }, []);

    const metrics = summary
        ? [
              { label: "Discovery", value: summary.discovery },
              { label: "Decisions", value: summary.decisions },
              { label: "Plans", value: summary.plans },
              { label: "Risk Approved", value: summary.riskApproved },
              { label: "Orders", value: summary.orders },
              { label: "Filled", value: summary.filled },
              { label: "Completed", value: summary.completed },
          ]
        : [];

    return (
        <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Quant Now</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {loading ? (
                    <p className="col-span-full text-sm text-zinc-600">Loading...</p>
                ) : (
                    metrics.map(m => (
                        <div key={m.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
                            <p className="text-[10px] uppercase tracking-wide text-zinc-600">{m.label}</p>
                            <p className="mt-1 text-lg font-semibold text-white">
                                {m.value === null
                                    ? <span className="text-sm font-normal text-zinc-600">Unavailable</span>
                                    : m.value}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}