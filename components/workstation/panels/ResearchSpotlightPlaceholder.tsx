"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getContinueWhereYouLeftOff, type RecentResearchItem } from "@/app/(app)/workstation/continue-research/actions";

/**
 * Real most-recent-research data from research_history (the same
 * source ContinueResearchPanel already uses) -- no new schema, no
 * second research layer.
 *
 * research_history stores ticker/recommendation/conviction/timestamp
 * only. Agreement, Evidence Quality, and Risk have no confirmed
 * source as of this pass (the full committee report with those
 * fields is fetched live per-ticker on /research/[ticker], not
 * stored as a queryable history row) -- shown as "Unavailable,"
 * never fabricated.
 */
export default function ResearchSpotlightPlaceholder() {
    const [items, setItems] = useState<RecentResearchItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getContinueWhereYouLeftOff(1)
            .then(setItems)
            .finally(() => setLoading(false));
    }, []);

    const spotlight = items[0] ?? null;

    return (
        <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Research Spotlight</p>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                {loading ? (
                    <p className="text-sm text-zinc-600">Loading...</p>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase text-zinc-600">
                                <th className="pb-1 font-medium">Ticker</th>
                                <th className="pb-1 font-medium">Recommendation</th>
                                <th className="pb-1 font-medium">Confidence</th>
                                <th className="pb-1 font-medium">Agreement</th>
                                <th className="pb-1 font-medium">Evidence</th>
                                <th className="pb-1 font-medium">Risk</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-zinc-800">
                                <td className="py-1.5 font-semibold text-white">
                                    {spotlight ? (
                                        <Link href={`/research/${spotlight.ticker}`} className="hover:text-violet-300">{spotlight.ticker}</Link>
                                    ) : "----"}
                                </td>
                                <td className="py-1.5 text-zinc-400">{spotlight?.recommendation ?? "--"}</td>
                                <td className="py-1.5 text-zinc-400">{spotlight ? `${spotlight.conviction}%` : "--"}</td>
                                <td className="py-1.5 text-zinc-700">Unavailable</td>
                                <td className="py-1.5 text-zinc-700">Unavailable</td>
                                <td className="py-1.5 text-zinc-700">Unavailable</td>
                            </tr>
                        </tbody>
                    </table>
                )}
                <p className="mt-2 text-[11px] text-zinc-700">
                    {spotlight ? "Agreement/Evidence/Risk require the full committee report -- not yet queryable from research history." : "No research history yet -- run a ticker report to populate this."}
                </p>
            </div>
        </div>
    );
}