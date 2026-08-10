import UnverifiedCard from "../../shared/UnverifiedCard";

/**
 * No DCF model, comparable-company engine, precedent-transaction
 * database, or analyst-estimates source exists anywhere in this
 * codebase. This is a genuinely large, separate subsystem to build —
 * not a data-wiring fix like the other UnverifiedCards on this page.
 * Deliberately not faking plausible-looking valuation numbers here.
 */
export default function ValuationSummary() {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="mb-3 text-lg font-semibold text-zinc-400">Valuation Summary</h2>
            <UnverifiedCard
                title="DCF, Comparable Companies, Precedent Transactions, Analyst Targets"
                reason="No valuation engine exists yet — this needs a real DCF model, comps database, and estimates source, not just a new API key."
            />
        </div>
    );
}
