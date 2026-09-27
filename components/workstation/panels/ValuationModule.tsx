export default function ValuationModule() {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Valuation</h3>
            <p className="py-0.5 text-xs text-zinc-500">DCF <span className="float-right text-zinc-600">no data</span></p>
            <p className="py-0.5 text-xs text-zinc-500">Comparables <span className="float-right text-zinc-600">no data</span></p>
            <p className="py-0.5 text-xs text-zinc-500">Analyst Targets <span className="float-right text-zinc-600">no data</span></p>
            <p className="mt-2 text-[10px] text-zinc-600">No valuation engine currently available.</p>
        </div>
    );
}
