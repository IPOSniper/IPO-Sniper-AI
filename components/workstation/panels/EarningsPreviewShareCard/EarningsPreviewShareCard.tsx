import { forwardRef } from "react";
import type { EarningsPreviewResponse } from "../EarningsPreviewPanel";

const SESSION_LABEL: Record<string, string> = {
 bmo: "Before market open",
 amc: "After market close",
 dmh: "During market hours",
 unknown: "Time not specified",
};

function formatMoney(n: number | null | undefined): string {
 if (n === null || n === undefined) return "Not covered";
 if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
 return `$${n.toFixed(2)}`;
}

function daysUntil(dateStr: string | undefined): number | null {
 if (!dateStr) return null;
 const target = new Date(dateStr);
 if (Number.isNaN(target.getTime())) return null;
 const now = new Date();
 const msPerDay = 24 * 60 * 60 * 1000;
 const diff = Math.ceil((target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / msPerDay);
 return diff;
}

interface Props {
 ticker: string;
 companyName: string;
 data: EarningsPreviewResponse;
}

/**
 * Shareable/downloadable version of EarningsPreviewPanel, matching
 * pre_earnings_card.html's layout. Deliberately reuses the exact
 * same EarningsPreviewResponse shape that panel already fetches and
 * renders -- this is a different VIEW of the same real data, not a
 * second data source. See EarningsPreviewPanel.tsx for the API call
 * and the honest "AI analysis unavailable" fallback this mirrors.
 *
 * Options-implied move / IV rank from the mockup are NOT included --
 * there is no options data source anywhere in this codebase (no
 * Tradier/Polygon/CBOE integration), and Finnhub's free tier doesn't
 * expose an options chain. Inventing an implied-move number here
 * would be fabricating market data this app has no way to know.
 * Rendered ONLY when preview.available -- callers should show
 * EarningsPreviewPanel's existing "AI analysis unavailable" message
 * instead of mounting this component when preview data isn't ready.
 */
const EarningsPreviewShareCard = forwardRef<HTMLDivElement, Props>(
 function EarningsPreviewShareCard({ ticker, companyName, data }, ref) {
 const { calendar, preview } = data;
 const daysAway = daysUntil(calendar.reportDate);

 return (
 <div
 ref={ref}
 className="flex w-[680px] flex-col gap-4 bg-[#060A12] p-8"
 style={{ fontFamily: "Georgia, serif" }}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-800/50 bg-[#160B3D]">
 <div className="h-3 w-3 rounded-full bg-violet-300" />
 </div>
 <span className="text-sm font-semibold text-zinc-200">IPO Sniper AI</span>
 </div>
 <span className="text-xs text-zinc-500">Pre-earnings preview</span>
 </div>

 <div>
 <h1 className="text-xl font-bold text-white">
 {companyName} <span className="text-zinc-500">({ticker})</span>
 </h1>
 </div>

 {/* Countdown bar -- real, computed from the actual verified report date */}
 <div className="flex items-center justify-between rounded-lg border border-violet-900/50 bg-[#160B3D] px-4 py-2.5">
 <span className="text-xs font-semibold text-violet-300">
 {calendar.fiscalQuarter && calendar.fiscalYear ? `Q${calendar.fiscalQuarter} ${calendar.fiscalYear} earnings` : "Upcoming earnings"}
 </span>
 <span className="text-xs text-zinc-300">
 Reports {calendar.reportDate} - {SESSION_LABEL[calendar.session ?? "unknown"]}
 {daysAway !== null && (daysAway === 0 ? " - Today" : daysAway === 1 ? " - Tomorrow" : daysAway > 0 ? ` - in ${daysAway} days` : ` - ${Math.abs(daysAway)} days ago`)}
 </span>
 </div>

 {/* Facts grid -- real, verified consensus figures only */}
 <div>
 <p className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-500">Facts (consensus and history, no interpretation)</p>
 <div className="grid grid-cols-4 gap-2">
 <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
 <p className="text-[9px] text-zinc-500">Consensus EPS</p>
 <p className="mt-1 text-sm font-semibold text-white">
 {calendar.epsEstimate === null || calendar.epsEstimate === undefined ? "Not covered" : `$${calendar.epsEstimate.toFixed(2)}`}
 </p>
 </div>
 <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
 <p className="text-[9px] text-zinc-500">Consensus revenue</p>
 <p className="mt-1 text-sm font-semibold text-white">{formatMoney(calendar.revenueEstimate)}</p>
 </div>
 <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
 <p className="text-[9px] text-zinc-500">Fiscal period</p>
 <p className="mt-1 text-sm font-semibold text-white">
 {calendar.fiscalQuarter && calendar.fiscalYear ? `Q${calendar.fiscalQuarter} ${calendar.fiscalYear}` : "-"}
 </p>
 </div>
 <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-2.5">
 <p className="text-[9px] text-zinc-500">Days to report</p>
 <p className="mt-1 text-sm font-semibold text-white">{daysAway !== null ? Math.max(0, daysAway) : "-"}</p>
 </div>
 </div>
 </div>

 {!preview.available ? (
 <div className="rounded-lg border border-zinc-800 bg-[#0D111B] p-3.5 text-xs text-zinc-500">
 AI analysis unavailable - {preview.reason ?? "not configured."} Facts above are still real and verified via Finnhub.
 </div>
 ) : (
 <>
 {preview.narrative && (
 <div className="rounded-lg border-l-4 border-violet-600 bg-[#131A26] p-3.5">
 <p className="text-xs leading-relaxed text-zinc-200">{preview.narrative}</p>
 </div>
 )}

 {preview.probabilityAssessment && preview.probabilityAssessment.length > 0 && (
 <div className="flex gap-2 rounded-lg border border-zinc-800 bg-[#0D111B] p-3">
 {preview.probabilityAssessment.slice(0, 3).map((p, i) => (
 <div key={i} className="flex-1 rounded-md bg-zinc-900/60 p-2 text-center">
 <p className="text-sm font-bold text-zinc-100">{p.probabilityPercent}%</p>
 <p className="text-[9px] text-zinc-500">{p.outcome}</p>
 </div>
 ))}
 </div>
 )}

 {(preview.bullCase?.length || preview.bearCase?.length) ? (
 <div className="grid grid-cols-2 gap-3">
 <div className="rounded-lg border border-emerald-900/40 bg-[#0D111B] p-3">
 <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Bull setup</p>
 {(preview.bullCase ?? []).slice(0, 4).map((b, i) => (
 <p key={i} className="mb-1.5 text-[11px] leading-snug text-zinc-300">{b}</p>
 ))}
 </div>
 <div className="rounded-lg border border-red-900/40 bg-[#0D111B] p-3">
 <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-red-400">Bear setup</p>
 {(preview.bearCase ?? []).slice(0, 4).map((b, i) => (
 <p key={i} className="mb-1.5 text-[11px] leading-snug text-zinc-300">{b}</p>
 ))}
 </div>
 </div>
 ) : null}
 </>
 )}

 <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-600">
 <p>Research only, not investment advice. Probabilities reflect current positioning and history, not certainty.</p>
 <p>IPO Sniper AI is not a registered investment advisor.</p>
 </div>
 </div>
 );
 }
);

export default EarningsPreviewShareCard;
