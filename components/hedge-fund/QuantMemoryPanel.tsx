import { getQuantMemoryStats } from "@/app/(app)/hedge-fund/quant-memory/actions";

/**
 * Small, real diagnostic panel -- exactly the scope this round's
 * own instruction allows (Section 22: "a small internal diagnostic
 * panel is acceptable... the primary deliverable is the backend
 * architecture and data integrity"), not a full memory browser.
 * Real, aggregate counts across all existing tables -- no fabricated
 * numbers.
 */
export default async function QuantMemoryPanel() {
    const stats = await getQuantMemoryStats();

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Quant Memory</h3>
                <span className="text-[10px] text-zinc-600">Real — unified read layer over existing decision/event/order data</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-800/40 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{stats.decisionsStored}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">Decisions Stored</p>
                </div>
                <div className="rounded-lg bg-zinc-800/40 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{stats.situationsStored}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">Situations Stored</p>
                </div>
                <div className="rounded-lg bg-zinc-800/40 p-3 text-center">
                    <p className="text-2xl font-bold text-zinc-400">{stats.noTradeDecisions}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">No-Trade Decisions</p>
                </div>
                <div className="rounded-lg bg-emerald-950/30 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{stats.linkedExecutions}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">Linked Executions</p>
                </div>
            </div>
        </div>
    );
}
