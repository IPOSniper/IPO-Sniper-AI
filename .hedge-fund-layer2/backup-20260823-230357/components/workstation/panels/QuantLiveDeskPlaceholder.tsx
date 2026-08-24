"use client";

import { useEffect, useState } from "react";
import { getQuantFunnelSummary, type QuantFunnelSummary } from "@/app/(app)/hedge-fund/quant-funnel-summary";
import { getActivityFeed, type ActivityEvent } from "@/app/(app)/hedge-fund/activity-feed/actions";
import { getRejectionBreakdown, type RejectionBreakdown } from "@/app/(app)/hedge-fund/rejection-breakdown/actions";

const REJECTION_LABELS: Record<string, string> = {
    no_committee_direction: "No committee direction",
    low_confidence: "Confidence below gate",
    low_agreement: "Agreement below gate",
    low_evidence_quality: "Evidence quality below gate",
    other: "Other",
};

function timeLabel(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch {
        return "--:--";
    }
}

function MetricBox({ label, value }: { label: string; value: number | null }) {
    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-white">
                {value === null ? <span className="text-sm font-normal text-zinc-600">Unavailable</span> : value}
            </p>
        </div>
    );
}

export default function QuantLiveDeskPlaceholder() {
    const [summary, setSummary] = useState<QuantFunnelSummary | null>(null);
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [rejections, setRejections] = useState<RejectionBreakdown | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getQuantFunnelSummary(),
            getActivityFeed(6),
            getRejectionBreakdown(),
        ])
            .then(([s, a, r]) => {
                setSummary(s);
                setActivity(a);
                setRejections(r);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quant Live Desk</p>
                <span className="text-[10px] text-zinc-600">Autonomous</span>
            </div>

            {loading || !summary ? (
                <p className="px-1 text-sm text-zinc-600">Loading...</p>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <MetricBox label="Discovery" value={summary.discovery} />
                        <MetricBox label="Decisions" value={summary.decisions} />
                        <MetricBox label="Plans" value={summary.plans} />
                        <MetricBox label="Risk Approved" value={summary.riskApproved} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                        <MetricBox label="Orders" value={summary.orders} />
                        <MetricBox label="Filled" value={summary.filled} />
                        <MetricBox label="Completed" value={summary.completed} />
                    </div>

                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <p className="mb-2 text-xs text-zinc-500">Why Quant Is Not Trading</p>
                        {rejections === null || rejections.total === 0 ? (
                            <p className="text-sm text-zinc-600">No rejection data in the selected window.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {(Object.entries(rejections.counts) as [string, number][])
                                    .filter(([, count]) => count > 0)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, count]) => (
                                        <div key={category} className="flex items-center gap-2 text-sm">
                                            <span className="w-10 shrink-0 text-right text-zinc-400">{count}</span>
                                            <span className="text-zinc-500">{REJECTION_LABELS[category] ?? category}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <p className="mb-2 text-xs text-zinc-500">Quant Activity</p>
                        {activity.length === 0 ? (
                            <p className="text-sm text-zinc-600">No recent Quant activity.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {activity.map(event => (
                                    <div key={event.id} className="flex items-center gap-2 text-sm">
                                        <span className="w-12 shrink-0 text-[10px] text-zinc-600">{timeLabel(event.timestamp)}</span>
                                        <span className="w-14 shrink-0 font-semibold text-zinc-400">{event.ticker}</span>
                                        <span className="text-zinc-500">{event.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}