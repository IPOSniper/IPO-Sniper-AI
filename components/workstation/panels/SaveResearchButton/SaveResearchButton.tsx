"use client";

import { useState } from "react";
import { saveResearchAction } from "@/app/(app)/research/[ticker]/actions";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";

export default function SaveResearchButton({ research }: WorkstationPanelProps) {
    const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSave() {
        setStatus("saving");
        setErrorMessage(null);

        const result = await saveResearchAction(
            research.company.ticker,
            research.company.name,
            research.committee.recommendation,
            research.committee.overallScore,
            research.committee.confidence
        );

        if (result.success) {
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 2000);
        } else {
            setStatus("error");
            setErrorMessage(result.error ?? "Could not save research.");
        }
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleSave}
                disabled={status === "saving"}
                title={status === "error" ? errorMessage ?? undefined : undefined}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-60"
            >
                {status === "saving" ? "Saving..." :
                 status === "saved" ? "Saved ✓" :
                 status === "error" ? "Failed — retry?" :
                 "Save Research"}
            </button>
        </div>
    );
}
