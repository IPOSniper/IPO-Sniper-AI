"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import EarningsPreviewShareCard from "./EarningsPreviewShareCard";
import type { EarningsPreviewResponse } from "../EarningsPreviewPanel";
import { Button } from "@/components/ui/button";

interface Props {
 ticker: string;
 companyName: string;
 sector: string;
 industry: string;
}

/**
 * Self-contained (fetches its own data on click, unlike
 * ShareCardButton which receives an already-loaded `research` prop)
 * since earnings preview data isn't part of the main ResearchObject
 * -- it's a separate endpoint (/api/earnings/preview/[ticker]),
 * same one EarningsPreviewPanel already calls. Fetching only on
 * click, not on mount, avoids a second eager API call every time
 * this sits next to EarningsPreviewPanel on the same page.
 */
export default function EarningsPreviewShareCardButton({ ticker, companyName, sector, industry }: Props) {
 const cardRef = useRef<HTMLDivElement>(null);
 const [status, setStatus] = useState<"idle" | "loading" | "generating" | "error">("idle");
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [previewUrl, setPreviewUrl] = useState<string | null>(null);
 const [data, setData] = useState<EarningsPreviewResponse | null>(null);

 async function handleGenerate() {
 setStatus("loading");
 setErrorMessage(null);

 try {
 const params = new URLSearchParams({ name: companyName, sector, industry });
 const res = await fetch(`/api/earnings/preview/${ticker}?${params.toString()}`);
 if (!res.ok) throw new Error(String(res.status));
 const json: EarningsPreviewResponse = await res.json();

 if (!json.calendar.available) {
 setStatus("error");
 setErrorMessage(json.calendar.reason ?? "No upcoming earnings to preview.");
 return;
 }

 setData(json);
 // Wait a tick for the off-screen card to actually render
 // with the new data before capturing it -- capturing
 // synchronously right after setData risks grabbing the
 // DOM before React has painted the update.
 requestAnimationFrame(async () => {
 if (!cardRef.current) {
 setStatus("error");
 setErrorMessage("Card failed to render.");
 return;
 }
 setStatus("generating");
 try {
 const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#060A12" });
 setPreviewUrl(dataUrl);
 setStatus("idle");
 } catch (err) {
 setStatus("error");
 setErrorMessage(err instanceof Error ? err.message : "Could not generate image.");
 }
 });
 } catch (err) {
 setStatus("error");
 setErrorMessage(err instanceof Error ? err.message : "Could not load earnings preview.");
 }
 }

 function handleDownload() {
 if (!previewUrl) return;
 const link = document.createElement("a");
 link.download = `${ticker}-earnings-preview.png`;
 link.href = previewUrl;
 link.click();
 }

 return (
 <div>
 {data && (
 <div className="pointer-events-none fixed -left-[9999px] top-0">
 <EarningsPreviewShareCard ref={cardRef} ticker={ticker} companyName={companyName} data={data} />
 </div>
 )}

 {!previewUrl ? (
 <Button
 variant="outline"
 onClick={handleGenerate}
 disabled={status === "loading" || status === "generating"}
 className="w-full justify-center"
 >
 {status === "loading" ? "Loading-" : status === "generating" ? "Generating-" : "Generate Earnings Preview Card"}
 </Button>
 ) : (
 <div className="space-y-2">
 {/* eslint-disable-next-line @next/next/no-img-element -- data URL preview, not a static asset */}
 <img src={previewUrl} alt="Earnings preview card" className="w-full rounded-lg border border-zinc-800" />
 <div className="flex gap-2">
 <Button onClick={handleDownload} className="flex-1 justify-center">
 Download PNG
 </Button>
 <Button variant="outline" onClick={() => { setPreviewUrl(null); setData(null); }} className="flex-1 justify-center">
 Regenerate
 </Button>
 </div>
 </div>
 )}

 {status === "error" && <p className="mt-2 text-sm text-red-400">{errorMessage}</p>}
 </div>
 );
}
