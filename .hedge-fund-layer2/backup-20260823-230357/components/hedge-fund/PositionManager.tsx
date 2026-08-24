"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPosition, removePosition, type PositionRow } from "@/app/(app)/hedge-fund/actions";

interface PositionManagerProps {
    positions: PositionRow[];
}

/**
 * Client component so the ticker/shares/cost-basis form can hold
 * local state and re-run the server actions without a full page
 * reload. router.refresh() re-fetches the server-rendered risk
 * report after any change, since PortfolioRiskAggregator output
 * depends on the current position list.
 */
export default function PositionManager({ positions }: PositionManagerProps) {

    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [ticker, setTicker] = useState("");
    const [shares, setShares] = useState("");
    const [costBasis, setCostBasis] = useState("");
    const [error, setError] = useState<string | null>(null);

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const sharesNum = Number(shares);
        const costBasisNum = Number(costBasis);

        startTransition(async () => {
            const result = await addPosition(ticker, sharesNum, costBasisNum);

            if (!result.success) {
                setError(result.error ?? "Failed to add position.");
                return;
            }

            setTicker("");
            setShares("");
            setCostBasis("");
            router.refresh();
        });
    }

    function handleRemove(id: string) {
        setError(null);
        startTransition(async () => {
            const result = await removePosition(id);
            if (!result.success) {
                setError(result.error ?? "Failed to remove position.");
                return;
            }
            router.refresh();
        });
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-3 text-sm font-medium text-zinc-300">Positions</h3>

            <form onSubmit={handleAdd} className="mb-4 flex flex-wrap items-end gap-2">
                <div>
                    <label className="mb-1 block text-xs text-zinc-500">Ticker</label>
                    <input
                        value={ticker}
                        onChange={e => setTicker(e.target.value)}
                        placeholder="MBLY"
                        className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        required
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-zinc-500">Shares</label>
                    <input
                        value={shares}
                        onChange={e => setShares(e.target.value)}
                        type="number"
                        min="0"
                        step="any"
                        className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        required
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-zinc-500">Cost / share</label>
                    <input
                        value={costBasis}
                        onChange={e => setCostBasis(e.target.value)}
                        type="number"
                        min="0"
                        step="any"
                        className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                    {isPending ? "Saving…" : "Add"}
                </button>
            </form>

            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            {positions.length === 0 ? (
                <p className="text-sm text-zinc-600">No positions added yet.</p>
            ) : (
                <div className="space-y-1">
                    {positions.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-300">{p.ticker}</span>
                            <span className="text-zinc-500">{p.shares} sh @ ${p.costBasis}</span>
                            <button
                                onClick={() => handleRemove(p.id)}
                                disabled={isPending}
                                className="text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
