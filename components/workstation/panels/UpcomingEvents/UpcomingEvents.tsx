import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";

/**
 * Partially real: lock-up expiration is a genuine calculation from
 * the real SEC-calendar IPO date (180 days is the conventional, not
 * universal, lock-up length — see EvidenceSummaryGrid's comment on
 * the same calculation). Earnings calls, product launches, investor
 * days have no real data source and are honestly omitted rather than
 * shown as empty placeholder rows.
 */
export default function UpcomingEvents({ research }: WorkstationPanelProps) {
    const { ipo } = research.report.evidence;

    const lockUpDate = ipo.ipoDate.verified && ipo.ipoDate.value
        ? new Date(new Date(ipo.ipoDate.value).getTime() + 180 * 24 * 60 * 60 * 1000)
        : null;

    const lockUpPassed = lockUpDate ? lockUpDate.getTime() < Date.now() : false;

    return (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 h-full">
            <h2 className="mb-3 text-lg font-semibold">Upcoming Events</h2>

            {lockUpDate && !lockUpPassed ? (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">Lock-Up Expiration (est.)</span>
                    <span className="text-zinc-500">{lockUpDate.toLocaleDateString()}</span>
                </div>
            ) : (
                <p className="text-sm text-zinc-600">
                    No confirmed events — no earnings calendar, product-launch, or investor-day data source is wired in yet, and no IPO date is available to estimate a lock-up.
                </p>
            )}
        </section>
    );
}
