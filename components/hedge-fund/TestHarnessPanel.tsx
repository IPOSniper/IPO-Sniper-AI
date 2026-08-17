"use client";

import { useEffect, useState, useTransition } from "react";
import { startTestHarness, pauseTestHarness, resumeTestHarness, stopTestHarness, getActiveTestHarness, runTestHarnessCycle, type TestHarnessState } from "@/app/(app)/hedge-fund/test-harness/actions";
import type { CycleResult } from "@/engine/quant/orchestration/ObservationCycle";

const STATUS_COLOR: Record<string, string> = {
    IDLE: "text-zinc-400",
    RUNNING: "text-emerald-400",
    PAUSED: "text-amber-400",
    STOPPING: "text-amber-400",
    COMPLETED: "text-blue-400",
    FAILED: "text-red-400",
    EMERGENCY_STOPPED: "text-red-400",
};

/**
 * Real Autonomous Quant Test Harness panel -- Stage A UI. Real
 * start/pause/resume/stop controls over the real, persistent state
 * machine (test-harness/actions.ts). Deliberately, honestly labeled
 * as not yet self-advancing -- Stage B (a real scheduler actually
 * invoking observation cycles) doesn't exist yet, so a started test
 * will sit at 0/0/0 progress until that's built. This ships the real
 * state machine and its real controls, not a claim that autonomous
 * cycling is already happening.
 */
export default function TestHarnessPanel({ defaultWatchlist }: { defaultWatchlist: string }) {
    const [state, setState] = useState<TestHarnessState | null>(null);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("Quant Validation Test");
    const [watchlist, setWatchlist] = useState(defaultWatchlist);
    const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
    const [cycleResult, setCycleResult] = useState<CycleResult | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        getActiveTestHarness().then(s => {
            setState(s);
            setLoading(false);
        });
    }, []);

    function handleStart() {
        setMessage(null);
        startTransition(async () => {
            const tickers = watchlist.split(",").map(t => t.trim().toUpperCase()).filter(Boolean);
            const result = await startTestHarness({ name, watchlist: tickers });
            if (result.success && result.state) {
                setState(result.state);
            } else {
                setMessage({ kind: "error", text: result.error ?? "Failed to start." });
            }
        });
    }

    function handleAction(action: () => Promise<{ success: boolean; state?: TestHarnessState; error?: string }>) {
        startTransition(async () => {
            const result = await action();
            if (result.success && result.state) {
                setState(result.state);
            } else if (result.error) {
                setMessage({ kind: "error", text: result.error });
            }
        });
    }

    function handleRunCycle() {
        setMessage(null);
        startTransition(async () => {
            const result = await runTestHarnessCycle();
            if (result.success && result.result) {
                setCycleResult(result.result);
                getActiveTestHarness().then(setState);
            } else {
                setMessage({ kind: "error", text: result.error ?? "Cycle failed." });
            }
        });
    }

    if (loading) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Autonomous Quant Test Harness</h3>
                <p className="text-xs text-zinc-600">Loading…</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Autonomous Quant Test Harness</h3>
                <span className="text-[10px] text-zinc-600">Real — cycle logic built (round114), manually triggerable only — no real scheduler yet</span>
            </div>

            {!state ? (
                <div className="space-y-2">
                    <p className="text-xs text-zinc-500">No active test. Starting one creates real, persistent state. Each cycle must be run manually via the button below — no real scheduler is connected yet (Round 115).</p>
                    <div className="flex flex-wrap items-end gap-2">
                        <div>
                            <label className="mb-1 block text-xs text-zinc-500">Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-48 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-zinc-500">Watchlist</label>
                            <input value={watchlist} onChange={e => setWatchlist(e.target.value)} className="w-64 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white" />
                        </div>
                        <button onClick={handleStart} disabled={isPending} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
                            Start Test
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{state.name}</span>
                        <span className={`text-xs font-medium ${STATUS_COLOR[state.status]}`}>{state.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                            <p className="text-lg font-bold text-white">{state.observationsCount}/{state.targetObservations}</p>
                            <p className="text-zinc-500">Observations</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">{state.autonomousDecisionsCount}/{state.targetAutonomousRuns}</p>
                            <p className="text-zinc-500">Decisions</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-white">{state.completedTradeCyclesCount}/{state.targetCompletedTradeCycles}</p>
                            <p className="text-zinc-500">Completed Cycles</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {state.status === "RUNNING" && (
                            <>
                                <button onClick={handleRunCycle} disabled={isPending} className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50">Run One Cycle</button>
                                <button onClick={() => handleAction(pauseTestHarness)} disabled={isPending} className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 disabled:opacity-50">Pause</button>
                            </>
                        )}
                        {state.status === "PAUSED" && (
                            <button onClick={() => handleAction(resumeTestHarness)} disabled={isPending} className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500 disabled:opacity-50">Resume</button>
                        )}
                        {(state.status === "RUNNING" || state.status === "PAUSED") && (
                            <button onClick={() => handleAction(() => stopTestHarness())} disabled={isPending} className="rounded-md border border-red-900 px-3 py-1 text-xs text-red-400 hover:border-red-700 disabled:opacity-50">Stop</button>
                        )}
                    </div>

                    {cycleResult && (
                        <div className="rounded-md bg-zinc-950/50 p-2.5 text-xs">
                            <p className="mb-1 font-medium text-zinc-300">Cycle result — {new Date(cycleResult.cycleCompletedAt).toLocaleTimeString()}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-zinc-400">
                                <span>Observation: <span className="text-white">{cycleResult.observation}</span></span>
                                <span>Positions Reviewed: <span className="text-white">{cycleResult.positionsReviewed}</span></span>
                                <span>Material Events: <span className="text-white">{cycleResult.materialEventsFound}</span></span>
                                <span>New Decision: <span className="text-white">{cycleResult.newDecisionFormed ? "Yes" : "No"}</span></span>
                                <span className="col-span-2">Status: <span className={cycleResult.status === "COMPLETE" ? "text-emerald-400" : "text-amber-400"}>{cycleResult.status}</span></span>
                            </div>
                            {cycleResult.error && <p className="mt-1 text-red-400">{cycleResult.error}</p>}
                        </div>
                    )}
                </div>
            )}

            {message && (
                <p className={`mt-2 text-xs ${message.kind === "success" ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
            )}
        </div>
    );
}
