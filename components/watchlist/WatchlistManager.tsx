"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { addToWatchlist, removeFromWatchlist, type WatchlistRow } from "@/app/(app)/watchlist/actions";

interface Props {
    initial: WatchlistRow[];
}

export default function WatchlistManager({ initial }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [ticker, setTicker] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState(initial);

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
            const result = await addToWatchlist(ticker);
            if (!result.success) {
                setError(result.error ?? "Failed to add ticker.");
                return;
            }
            setTicker("");
            router.refresh();
        });
    }

    function handleRemove(id: string) {
        setError(null);
        // Optimistic — the overnight watcher's alert list is what people
        // actually care about seeing update quickly; this list itself is
        // low-stakes enough that instant feedback beats waiting on the
        // round trip.
        setRows(prev => prev.filter(r => r.id !== id));
        startTransition(async () => {
            const result = await removeFromWatchlist(id);
            if (!result.success) {
                setError(result.error ?? "Failed to remove ticker.");
                router.refresh(); // resync if the optimistic removal was wrong
            }
        });
    }

    return (
        <div className="max-w-md">
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input
                    value={ticker}
                    onChange={e => setTicker(e.target.value)}
                    placeholder="Add ticker (e.g. AMD)"
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm uppercase text-white outline-none focus:border-cyan-400"
                    disabled={isPending}
                />
                <button
                    type="submit"
                    disabled={isPending || !ticker.trim()}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 disabled:opacity-60"
                >
                    Add
                </button>
            </form>

            {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

            {rows.length === 0 ? (
                <p className="text-sm text-zinc-500">
                    Nothing watched yet. Add a ticker above — the overnight watcher
                    picks it up on its next scheduled run.
                </p>
            ) : (
                <ul className="space-y-1.5">
                    {rows.map(row => (
                        <li
                            key={row.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                        >
                            <a href={`/research/${row.ticker}`} className="text-sm font-medium hover:text-cyan-400">
                                {row.ticker}
                            </a>
                            <button
                                onClick={() => handleRemove(row.id)}
                                className="text-zinc-500 hover:text-red-400"
                                aria-label={`Remove ${row.ticker}`}
                            >
                                <X size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
