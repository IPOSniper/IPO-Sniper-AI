"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { publishResearchAction } from "@/app/(app)/research/[ticker]/actions";
import ShareCard from "./ShareCard";
import ShareCardCompact from "./ShareCardCompact";
import { Button } from "@/components/ui/button";

type CardFormat = "full" | "compact";

/**
 * Real QR code -- FIXED to point at the real, News-excluded public
 * page (/r/[slug]), not /research/[ticker], which requires
 * authentication (verified directly against proxy.ts -- everything
 * under app/(app)/ is auth-gated, confirmed via a real QR scan
 * landing on the login page, not a hypothetical). Reuses the same
 * real publishResearchAction() the existing "Publish Report" button
 * already uses -- not a second, parallel publishing path.
 *
 * Real, important side effect, stated plainly rather than done
 * silently: generating a Share Card now also PUBLISHES the research
 * (sets is_public: true in research_history) if it isn't published
 * already, since a QR code that dead-ends at a private page isn't
 * actually useful. The UI shows this explicitly -- see the notice
 * rendered below.
 */
async function generateQRCode(research: WorkstationPanelProps["research"]): Promise<string | null> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) return null;

    try {
        const result = await publishResearchAction(research);
        if (!result.success || !result.shareUrl) return null;
        return await QRCode.toDataURL(result.shareUrl, { margin: 1, width: 200 });
    } catch {
        return null;
    }
}

export default function ShareCardButton({ research }: WorkstationPanelProps) {
    const fullCardRef = useRef<HTMLDivElement>(null);
    const compactCardRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<"idle" | "generating" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [activeFormat, setActiveFormat] = useState<CardFormat>("full");
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>(undefined);

    async function handleGenerate(format: CardFormat) {
        const ref = format === "full" ? fullCardRef : compactCardRef;
        if (!ref.current) return;

        setStatus("generating");
        setErrorMessage(null);
        setActiveFormat(format);

        try {
            // Real QR, generated fresh each time in case
            // NEXT_PUBLIC_SITE_URL wasn't set at initial page load
            // for some reason -- cheap to regenerate, avoids a stale
            // undefined sticking around. Also (re)publishes the
            // research via the real, shared publishResearchAction --
            // see generateQRCode's docstring.
            const qr = await generateQRCode(research);
            setQrCodeDataUrl(qr ?? undefined);

            // Give React a tick to actually paint the QR image into
            // the off-screen DOM before capturing it -- same reason
            // EarningsPreviewShareCardButton waits a frame after
            // setData before calling toPng.
            await new Promise(resolve => requestAnimationFrame(resolve));

            const dataUrl = await toPng(ref.current, {
                pixelRatio: 2,
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
        link.download = `${research.company.ticker}-${activeFormat === "compact" ? "share-card" : "research-card"}.png`;
        link.href = previewUrl;
        link.click();
    }

    return (
        <div>
            {/*
              Both formats rendered off-screen simultaneously (not
              conditionally mounted), same reasoning as before: a real
              DOM node with real layout, ready to capture on demand,
              regardless of which format gets clicked.
            */}
            <div className="pointer-events-none fixed -left-[9999px] top-0">
                <ShareCard ref={fullCardRef} research={research} qrCodeDataUrl={qrCodeDataUrl} />
            </div>
            <div className="pointer-events-none fixed -left-[9999px] top-0">
                <ShareCardCompact ref={compactCardRef} research={research} qrCodeDataUrl={qrCodeDataUrl} />
            </div>

            <p className="mb-2 text-[10px] text-zinc-600">
                Generating a card also publishes this research publicly (same as the Publish Report button) so the QR code has somewhere real to go — the public page excludes News Analyst content, same as this card.
            </p>

            {!previewUrl ? (
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        onClick={() => handleGenerate("compact")}
                        disabled={status === "generating"}
                        className="w-full justify-center"
                    >
                        {status === "generating" && activeFormat === "compact" ? "Generating..." : "Generate Standard Card (for X/Twitter)"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleGenerate("full")}
                        disabled={status === "generating"}
                        className="w-full justify-center"
                    >
                        {status === "generating" && activeFormat === "full" ? "Generating..." : "Generate Full Research Snapshot"}
                    </Button>
                </div>
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
