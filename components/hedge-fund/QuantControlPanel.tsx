"use client";

import { useState, useEffect } from "react";
import { getQuantControlState, setQuantControlState, type QuantControlState } from "@/app/(app)/hedge-fund/quant-control/actions";

const STATE_INFO: Record<QuantControlState, { label: string; color: string; bg: string; desc: string }> = {
    OFF: { label: "OFF", color: "text-zinc-400", bg: "bg-zinc-800", desc: "All autonomous/assisted AI-driven execution is disabled. Manual orders still work." },
    ASSISTED: { label: "ASSISTED", color: "text-violet-400", bg: "bg-violet-950/30", desc: "Human-reviewed Quant Strategist execution is allowed. Batch Scanner's fully-autonomous execution is blocked." },
    AUTONOMOUS: { label: "AUTONOMOUS", color: "text-emerald-400", bg: "bg-emerald-950/30", desc: "Both assisted and fully-autonomous (Batch Scanner) execution are allowed." },
    SAFE_MODE: { label: "SAFE MODE", color: "text-amber-400", bg: "bg-amber-950/30", desc: "New AI-driven entries are paused. Research and monitoring continue." },
    EMERGENCY_STOP: { label: "EMERGENCY STOP", color: "text-red-400", bg: "bg-red-950/30", desc: "No new autonomous orders are allowed, effective immediately — enforced server-side, not just in this UI." },
};

/**
 * Real, centralized Quant control panel. State changes here are
 * genuinely enforced server-side (quant-control/actions.ts's
 * checkAutonomousExecutionAllowed(), called from both real
 * AI-driven execution paths) -- this isn't a display-only toggle
 * that execution code could bypass by calling a server action
 * directly. Manual, fully-human orders are NOT gated by this (see
 * checkAutonomousExecutionAllowed's docstring for why) -- this
 * governs autonomous/assisted AI-driven execution specifically.
 */
export default function QuantControlPanel() {
    const [status, setStatus] = useState<{ state: QuantControlState; reason: string; changedAt: string } | null>(null);
    const [selectedState, setSelectedState] = useState<QuantControlState>("OFF");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getQuantControlState().then(s => {
            setStatus(s);
            setSelectedState(s.state);
        });
    }, []);

    async function handleChange() {
        setError(null);
        if (!reason.trim()) {
            setError("A reason is required for every state change — this becomes a permanent, real audit log entry.");
            return;
        }
        setSaving(true);
        const result = await setQuantControlState(selectedState, reason);
        setSaving(false);
        if (!result.success) {
            setError(result.error ?? "Failed to update state.");
            return;
        }
        const fresh = await getQuantControlState();
        setStatus(fresh);
        setReason("");
    }

    if (!status) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h2 className="text-lg font-semibold text-white">Quant Control</h2>
                <p className="text-sm text-zinc-600">Loading real state…</p>
            </div>
        );
    }

    const info = STATE_INFO[status.state];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Quant Control</h2>
                <span className="text-[10px] text-zinc-600">Real, server-enforced — not just a display toggle</span>
            </div>

            <div className={`mb-4 rounded-lg border border-zinc-800 ${info.bg} p-3`}>
                <p className={`text-lg font-bold ${info.color}`}>{info.label}</p>
                <p className="mt-1 text-xs text-zinc-400">{info.desc}</p>
                <p className="mt-2 text-[10px] text-zinc-600">
                    Set {new Date(status.changedAt).toLocaleString()} — &ldquo;{status.reason}&rdquo;
                </p>
            </div>

            <div className="space-y-2">
                <label className="block text-xs text-zinc-500">Change state to</label>
                <select
                    value={selectedState}
                    onChange={e => setSelectedState(e.target.value as QuantControlState)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                >
                    {(Object.keys(STATE_INFO) as QuantControlState[]).map(s => (
                        <option key={s} value={s}>{STATE_INFO[s].label}</option>
                    ))}
                </select>

                <label className="block text-xs text-zinc-500">Reason (required — permanently logged)</label>
                <input
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Starting a controlled test run"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-white"
                />

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button
                    type="button"
                    onClick={handleChange}
                    disabled={saving}
                    className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                        selectedState === "EMERGENCY_STOP" ? "bg-red-700 hover:bg-red-600" : "bg-violet-600 hover:bg-violet-500"
                    }`}
                >
                    {saving ? "Updating…" : selectedState === "EMERGENCY_STOP" ? "Trigger Emergency Stop" : "Update State"}
                </button>
            </div>
        </div>
    );
}
