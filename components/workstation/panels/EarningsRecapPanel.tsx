"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface ResultsData {
 available: boolean;
 reason?: string;
 fiscalQuarter?: string;
 fiscalYear?: number;
 reportDate?: string;
 actualEPS?: number;
 estimatedEPS?: number;
 epsBeat?: "beat" | "miss" | "in_line";
 epsSurprisePercent?: number;
 actualRevenue?: number;
 estimatedRevenue?: number;
 revenueBeat?: "beat" | "miss" | "in_line";
 revenueSurprisePercent?: number;
 revenueGrowthYoY?: number | null;
 epsQualityScore?: number;
 revenueQualityScore?: number;
}

interface RecapData {
 available: boolean;
 reason?: string;
 narrative?: string;
 takeaways?: string[];
 watchNext?: string[];
}

interface Props {
 ticker: string;
 companyName: string;
}

function formatMoney(n: number | undefined): string {
 if (n === undefined) return "-";
 if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
 return `$${n.toFixed(2)}`;
}

function BeatMissBadge({ beat }: { beat: "beat" | "miss" | "in_line" | undefined }) {
 if (beat === undefined) return null;
 if (beat === "in_line") {
 return (
 <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
 In Line
 </span>
 );
 }
 return beat === "beat" ? (
 <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
 <CheckCircle2 size={12} /> Beat
 </span>
 ) : (
 <span className="flex items-center gap-1 text-xs font-medium text-red-400">
 <XCircle size={12} /> Miss
 </span>
 );
}

export default function EarningsRecapPanel({ ticker, companyName }: Props) {
 const [data, setData] = useState<{ results: ResultsData; recap: RecapData } | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let cancelled = false;
 setLoading(true);

 fetch(`/api/earnings/recap/${ticker}?name=${encodeURIComponent(companyName)}`)
 .then(res => res.json())
 .then(json => {
 if (!cancelled) setData(json);
 })
 .catch(() => {
 if (!cancelled) setData(null);
 })
 .finally(() => {
 if (!cancelled) setLoading(false);
 });

 return () => {
 cancelled = true;
 };
 }, [ticker, companyName]);

 if (loading) {
 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <h2 className="text-lg font-semibold text-zinc-300">Last Reported</h2>
 <p className="mt-2 text-sm text-zinc-600">Loading-</p>
 </div>
 );
 }

 if (!data || !data.results.available) {
 return null; // No reported history - quietly omit rather than show an empty card.
 }

 const { results, recap } = data;

 return (
 <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-5">

 <div className="flex items-start justify-between gap-4">
 <div>
 <h2 className="text-lg font-semibold text-zinc-100">Last Reported</h2>
 <p className="mt-1 text-sm text-zinc-400">
 {results.fiscalQuarter} {results.fiscalYear}
 {results.reportDate ? ` - ${new Date(results.reportDate).toLocaleDateString()}` : ""}
 </p>
 </div>
 <span className="shrink-0 rounded-full border border-emerald-800 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
 Verified - Finnhub
 </span>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-wide text-zinc-500">EPS</p>
 <BeatMissBadge beat={results.epsBeat} />
 </div>
 <p className="mt-1 text-lg font-semibold text-white">
 ${results.actualEPS?.toFixed(2)}
 <span className="ml-1.5 text-sm text-zinc-500">vs ${results.estimatedEPS?.toFixed(2)} est.</span>
 </p>
 <p className="text-xs text-zinc-500">
 {results.epsSurprisePercent !== undefined && results.epsSurprisePercent >= 0 ? "+" : ""}
 {results.epsSurprisePercent?.toFixed(1)}% surprise
 </p>
 </div>
 <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
 <div className="flex items-center justify-between">
 <p className="text-xs uppercase tracking-wide text-zinc-500">Revenue</p>
 <BeatMissBadge beat={results.revenueBeat} />
 </div>
 <p className="mt-1 text-lg font-semibold text-white">
 {formatMoney(results.actualRevenue)}
 <span className="ml-1.5 text-sm text-zinc-500">vs {formatMoney(results.estimatedRevenue)} est.</span>
 </p>
 <p className="text-xs text-zinc-500">
 {results.revenueGrowthYoY !== null && results.revenueGrowthYoY !== undefined
 ? `${results.revenueGrowthYoY >= 0 ? "+" : ""}${results.revenueGrowthYoY.toFixed(1)}% YoY`
 : "YoY growth not available"}
 </p>
 </div>
 </div>

 {!recap.available ? (
 <p className="text-sm text-zinc-600 border-t border-zinc-800 pt-4">
 AI analysis unavailable - {recap.reason ?? "not configured."}
 </p>
 ) : (
 <div className="border-t border-zinc-800 pt-4 space-y-4">
 <div className="flex items-center gap-1.5 text-xs font-medium text-violet-400">
 <Sparkles size={12} />
 AI ANALYSIS - interpretation, not verified fact
 </div>

 {recap.narrative && (
 <p className="text-sm text-zinc-300 leading-relaxed">{recap.narrative}</p>
 )}

 {recap.takeaways && recap.takeaways.length > 0 && (
 <div>
 <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Takeaways</p>
 <ul className="space-y-1 text-sm text-zinc-300 list-disc list-inside">
 {recap.takeaways.map((t, i) => <li key={i}>{t}</li>)}
 </ul>
 </div>
 )}

 {recap.watchNext && recap.watchNext.length > 0 && (
 <div>
 <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Watch Next Quarter</p>
 <ul className="space-y-1 text-sm text-zinc-300 list-disc list-inside">
 {recap.watchNext.map((t, i) => <li key={i}>{t}</li>)}
 </ul>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
