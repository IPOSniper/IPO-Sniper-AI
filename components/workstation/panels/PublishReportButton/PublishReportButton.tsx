"use client";

import { useState } from "react";
import { publishResearchAction } from "@/app/(app)/research/[ticker]/actions";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";

export default function PublishReportButton({ research }: WorkstationPanelProps) {
    const [status, setStatus] = useState<"idle" | "publishing" | "done" | "error">("idle");
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    async function handlePublish() {
        setStatus("publishing");
        setErrorMessage(null);

        const result = await publishResearchAction(research);

        if (result.success && result.shareUrl) {
            setShareUrl(result.shareUrl);
            setStatus("done");
        } else {
            setStatus("error");
            setErrorMessage(result.error ?? "Could not publish report.");
        }
    }

    async function handleCopy() {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    if (status === "done" && shareUrl) {
        const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `${research.company.ticker} research from IPO Sniper AI — every claim sourced, nothing faked:`
        )}&url=${encodeURIComponent(shareUrl)}`;

        return (
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white"
                >
                    {copied ? "Copied ✓" : "Copy Link"}
                </button>
                <a
                    href={xIntent}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black hover:bg-cyan-400"
                >
                    Share on X
                </a>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={handlePublish}
            disabled={status === "publishing"}
            title={status === "error" ? errorMessage ?? undefined : "Publish a public, shareable version of this report"}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-60"
        >
            {status === "publishing" ? "Publishing..." :
             status === "error" ? "Failed — retry?" :
             "Publish Report"}
        </button>
    );
}
