import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type Snapshot = {
    snapshot_date: string;
    ark_shares: number | null;
};

export default async function ARKOwnershipTrend({
    research,
}: WorkstationPanelProps) {
    const ticker = research.company.ticker;

    if (!isSupabaseConfigured()) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                    Institutional Ownership
                </div>
                <h3 className="mt-1 text-sm font-semibold text-zinc-200">
                    ARK Ownership Trend
                </h3>
                <p className="mt-4 text-xs text-zinc-600">
                    Snapshot history unavailable.
                </p>
            </div>
        );
    }

    const supabase = await createClient();

    const { data } = await supabase
        .from("evidence_snapshots")
        .select("snapshot_date, ark_shares")
        .eq("ticker", ticker)
        .not("ark_shares", "is", null)
        .order("snapshot_date", { ascending: true })
        .limit(24);

    const snapshots = (data ?? []) as Snapshot[];

    if (snapshots.length < 2) {
        return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                    Institutional Ownership
                </div>
                <h3 className="mt-1 text-sm font-semibold text-zinc-200">
                    ARK Ownership Trend
                </h3>
                <p className="mt-4 text-xs text-zinc-600">
                    Fewer than two verified ARK snapshots are available. A trend is not displayed.
                </p>
            </div>
        );
    }

    const max = Math.max(...snapshots.map((s) => s.ark_shares ?? 0), 1);
    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                        Institutional Ownership
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-zinc-200">
                        ARK Ownership Trend
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-500">
                        Verified ARK shares across available snapshots.
                    </p>
                </div>

                <div className="text-right">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-600">
                        Latest
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-200">
                        {(latest.ark_shares ?? 0).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="mt-5 flex h-40 items-end gap-1 border-b border-zinc-900">
                {snapshots.map((snapshot) => {
                    const shares = snapshot.ark_shares ?? 0;
                    const height = Math.max(3, (shares / max) * 100);

                    return (
                        <div
                            key={`${snapshot.snapshot_date}-${shares}`}
                            className="group relative flex h-full flex-1 items-end"
                        >
                            <div
                                className="w-full rounded-t-sm bg-emerald-500/70 transition-all group-hover:bg-emerald-400"
                                style={{ height: `${height}%` }}
                                title={`${snapshot.snapshot_date}: ${shares.toLocaleString()} shares`}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="mt-2 flex justify-between text-[9px] text-zinc-600">
                <span>{snapshots[0].snapshot_date}</span>
                <span>{latest.snapshot_date}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-900 pt-3">
                <div>
                    <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-600">
                        Previous
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-300">
                        {(previous.ark_shares ?? 0).toLocaleString()}
                    </div>
                </div>

                <div>
                    <div className="text-[9px] uppercase tracking-[0.15em] text-zinc-600">
                        Change
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-300">
                        {previous.ark_shares
                            ? `${(((latest.ark_shares ?? 0) - previous.ark_shares) / previous.ark_shares * 100).toFixed(1)}%`
                            : "Unavailable"}
                    </div>
                </div>
            </div>

            <div className="mt-3 text-[10px] text-zinc-600">
                Trend uses only stored verified snapshots. It does not imply continuous daily ownership coverage.
            </div>
        </div>
    );
}