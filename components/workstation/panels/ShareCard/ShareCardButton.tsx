"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import ShareCard from "./ShareCard";
import { Button } from "@/components/ui/button";

export default function ShareCardButton({ research }: WorkstationPanelProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    async function handleGenerate() {
        if (!cardRef.current) return;

        setStatus("generating");
        setErrorMessage(null);

        try {
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 2, // sharper output for posting
                backgroundColor: "#09090B",
            });
            setPreviewUrl(dataUrl);
            setStatus("idle");
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Could not generate image.");
        }
    }

    function handleDownload() {
        if (!previewUrl) return;
        const link = document.createElement("a");
        link.download = `${research.company.ticker}-research-card.png`;
        link.href = previewUrl;
        link.click();
    }

    return (
        <div>
            {/*
              Rendered off-screen (not display:none, which some
              browsers skip during canvas capture) rather than
              conditionally mounted, so html-to-image always has a
              real DOM node with real layout to capture on demand.
            */}
            <div className="pointer-events-none fixed -left-[9999px] top-0">
                <ShareCard ref={cardRef} research={research} />
            </div>

            {!previewUrl ? (
                <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={status === "generating"}
                    className="w-full justify-center"
                >
                    {status === "generating" ? "Generating..." : "Generate Share Card"}
                </Button>
            ) : (
                <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview, not a static asset */}
                    <img src={previewUrl} alt="Research share card preview" className="w-full rounded-lg border border-zinc-800" />
                    <div className="flex gap-2">
                        <Button onClick={handleDownload} className="flex-1 justify-center">
                            Download PNG
                        </Button>
                        <Button variant="outline" onClick={() => setPreviewUrl(null)} className="flex-1 justify-center">
                            Regenerate
                        </Button>
                    </div>
                </div>
            )}

            {status === "error" && (
                <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
            )}
        </div>
    );
}
