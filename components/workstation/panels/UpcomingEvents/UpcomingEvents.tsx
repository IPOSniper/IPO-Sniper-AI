import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";
import { FinnhubEarningsCalendarProvider } from "@/engine/earnings/providers/FinnhubEarningsCalendarProvider";

/**
 * Real fix for a real, confirmed inconsistency: this panel used to
 * unconditionally claim "no earnings calendar... data source is
 * wired in yet" -- true when this panel was first built, but stale
 * once FinnhubEarningsCalendarProvider was later built for the
 * separate Earnings Preview panel. Two panels on the same research
 * page were directly contradicting each other about whether earnings
 * data exists for the same ticker.
 *
 * Now async and fetches the same real provider Earnings Preview
 * already uses -- not a second, parallel earnings-data
 * implementation. Product launches and investor days genuinely still
 * have no real data source and remain honestly omitted, not shown as
 * empty placeholder rows.
 *
 * Lock-up expiration is a genuine calculation from the real
 * SEC-calendar IPO date (180 days is the conventional, not
 * universal, lock-up length - see EvidenceSummaryGrid's comment on
 * the same calculation).
 */
/** Finnhub returns date-only strings such as "2026-09-21". new Date() reads
 * those as UTC midnight, and toLocaleDateString() then shifts them back a day
 * in US time zones. Format date-only values in UTC instead. */
function formatDateOnly(value: string): string {
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { timeZone: "UTC" });
}

export default async function UpcomingEvents({ research }: WorkstationPanelProps) {
 const { ipo } = research.report.evidence;

 const lockUpDate = ipo.ipoDate.verified && ipo.ipoDate.value
 ? new Date(new Date(ipo.ipoDate.value).getTime() + 180 * 24 * 60 * 60 * 1000)
 : null;

 const lockUpPassed = lockUpDate ? lockUpDate.getTime() < Date.now() : false;

 let earnings: { reportDate: string; session: string } | null = null;
 try {
 const entry = await new FinnhubEarningsCalendarProvider().getNext(research.company.ticker);
 if (entry) earnings = { reportDate: entry.reportDate, session: entry.session };
 } catch {
 // Real calendar lookup can fail independently -- earnings
 // just stays null, doesn't block the rest of this panel.
 }

 const hasAnyEvent = (lockUpDate && !lockUpPassed) || earnings;

 return (
 <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 h-full">
 <h2 className="mb-3 text-lg font-semibold">Upcoming Events</h2>

 {hasAnyEvent ? (
 <div className="space-y-2">
 {earnings && (
 <div className="flex items-center justify-between text-sm">
 <span className="text-zinc-300">Earnings Report</span>
 <span className="text-zinc-500">
 {formatDateOnly(earnings.reportDate)}
 {earnings.session === "bmo" && " (before open)"}
 {earnings.session === "amc" && " (after close)"}
 </span>
 </div>
 )}
 {lockUpDate && !lockUpPassed && (
 <div className="flex items-center justify-between text-sm">
 <span className="text-zinc-300">Lock-Up Expiration (est.)</span>
 <span className="text-zinc-500">{lockUpDate.toLocaleDateString(undefined, { timeZone: "UTC" })}</span>
 </div>
 )}
 </div>
 ) : (
 <p className="text-sm text-zinc-600">
 No confirmed events - no product-launch or investor-day data source is wired in yet, no confirmed earnings date, and no IPO date is available to estimate a lock-up.
 </p>
 )}
 </section>
 );
}
